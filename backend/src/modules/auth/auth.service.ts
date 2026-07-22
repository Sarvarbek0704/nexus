import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import {
  User,
  UserRole,
  AuthProvider,
  UserStatus,
} from "../../database/entities/user.entity";
import { FreelancerProfile } from "../../database/entities/freelancer-profile.entity";
import { ClientProfile } from "../../database/entities/client-profile.entity";
import { AgencyProfile } from "../../database/entities/agency-profile.entity";
import { RegisterDto, SELF_ASSIGNABLE_ROLES } from "./dto/register.dto";
import {
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
  VerifyOtpDto,
  ResendOtpDto,
} from "./dto/login.dto";
import { hashPassword, comparePassword } from "../../common/utils/bcrypt.util";
import {
  generateUsername,
  generateVerificationToken,
} from "../../common/utils/generate.util";
import { MailerService } from "../mailer/mailer.service";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(FreelancerProfile)
    private freelancerProfileRepo: Repository<FreelancerProfile>,
    @InjectRepository(ClientProfile)
    private clientProfileRepo: Repository<ClientProfile>,
    @InjectRepository(AgencyProfile)
    private agencyProfileRepo: Repository<AgencyProfile>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private dataSource: DataSource,
    private mailerService: MailerService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.userRepo.findOne({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) throw new ConflictException("Email already registered");

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const hashedPassword = await hashPassword(dto.password);
      const username = generateUsername(dto.firstName, dto.lastName);
      const otp = this.generateOtp();
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Second line of defence. The DTO already rejects a self-assigned admin,
      // but this is a public endpoint writing a privilege column: if a future
      // caller reaches this method around the validation pipe — another
      // service, a seed, a test helper — the escalation comes back silently.
      // The check is cheap and the failure it prevents is not.
      if (dto.role && !SELF_ASSIGNABLE_ROLES.includes(dto.role)) {
        throw new BadRequestException('Invalid role');
      }

      const user = queryRunner.manager.create(User, {
        email: dto.email.toLowerCase(),
        password: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
        username,
        role: dto.role || UserRole.FREELANCER,
        country: dto.country,
        provider: AuthProvider.LOCAL,
        status: UserStatus.PENDING_VERIFICATION,
        isEmailVerified: false,
        otpCode: otp,
        otpExpires,
      });

      await queryRunner.manager.save(user);
      await this.createProfileForRole(queryRunner.manager, user);
      await queryRunner.commitTransaction();

      // Send OTP email (don't block registration if email fails)
      try {
        await this.mailerService.sendOtpEmail(user.email, user.firstName, otp);
      } catch {
        // log but don't throw — user can resend OTP
      }

      return {
        message:
          "Registration successful. Please check your email for the verification code.",
        email: user.email,
        requiresVerification: true,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const user = await this.userRepo
      .createQueryBuilder("user")
      .addSelect("user.otpCode")
      .addSelect("user.otpExpires")
      .where("user.email = :email", { email: dto.email.toLowerCase() })
      .getOne();

    if (!user) throw new NotFoundException("User not found");
    if (user.isEmailVerified)
      throw new BadRequestException("Email is already verified");

    if (!user.otpCode || !user.otpExpires) {
      throw new BadRequestException(
        "No verification code found. Please request a new one.",
      );
    }

    if (new Date() > user.otpExpires) {
      throw new BadRequestException(
        "Verification code has expired. Please request a new one.",
      );
    }

    if (user.otpCode !== dto.otp) {
      throw new BadRequestException("Invalid verification code");
    }

    await this.userRepo.update(user.id, {
      isEmailVerified: true,
      status: UserStatus.ACTIVE,
      otpCode: null,
      otpExpires: null,
    });

    const updatedUser = await this.userRepo.findOne({ where: { id: user.id } });
    const tokens = await this.generateTokens(updatedUser);

    return {
      message: "Email verified successfully! Welcome to Nexus.",
      user: updatedUser,
      ...tokens,
    };
  }

  async resendOtp(dto: ResendOtpDto) {
    const user = await this.userRepo
      .createQueryBuilder("user")
      .addSelect("user.otpExpires")
      .where("user.email = :email", { email: dto.email.toLowerCase() })
      .getOne();

    if (!user) throw new NotFoundException("User not found");
    if (user.isEmailVerified)
      throw new BadRequestException("Email is already verified");

    // Rate limit: can only resend after 1 minute
    if (user.otpExpires) {
      const timeLeft = user.otpExpires.getTime() - Date.now();
      const nineMinutes = 9 * 60 * 1000;
      if (timeLeft > nineMinutes) {
        throw new BadRequestException(
          "Please wait at least 1 minute before requesting a new code.",
        );
      }
    }

    const otp = this.generateOtp();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    await this.userRepo.update(user.id, { otpCode: otp, otpExpires });

    await this.mailerService.sendOtpEmail(user.email, user.firstName, otp);

    return { message: "A new verification code has been sent to your email." };
  }

  async login(dto: LoginDto) {
    const user = await this.userRepo
      .createQueryBuilder("user")
      .addSelect("user.password")
      .where("user.email = :email", { email: dto.email.toLowerCase() })
      .getOne();

    if (!user) throw new UnauthorizedException("Invalid credentials");

    if (user.provider !== AuthProvider.LOCAL) {
      throw new UnauthorizedException(`Please login with ${user.provider}`);
    }

    const isPasswordValid = await comparePassword(dto.password, user.password);
    if (!isPasswordValid)
      throw new UnauthorizedException("Invalid credentials");

    if (!user.isEmailVerified) {
      throw new ForbiddenException({
        message: "Please verify your email before logging in.",
        requiresVerification: true,
        email: user.email,
      });
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new ForbiddenException(
        "Your account has been suspended. Please contact support.",
      );
    }

    if (user.status === UserStatus.PENDING_VERIFICATION) {
      throw new ForbiddenException({
        message: "Please verify your email before logging in.",
        requiresVerification: true,
        email: user.email,
      });
    }

    try {
      await this.userRepo.increment({ id: user.id }, "loginCount", 1);
    } catch (error) {
      const message = (error as any)?.message || "";
      const code = (error as any)?.code;
      if (
        code === "42703" ||
        message.includes("login_count") ||
        message.includes("loginCount")
      ) {
        // Ignore if the column is missing due to an out-of-date database schema.
      } else {
        throw error;
      }
    }

    await this.userRepo.update(user.id, {
      lastLoginAt: new Date(),
    });

    const tokens = await this.generateTokens(user);
    const { password, ...userWithoutPassword } = user as any;

    return { user: userWithoutPassword, ...tokens };
  }

  async oauthLogin(oauthUser: any, role?: UserRole) {
    // Match by email OR provider id. Matching on email alone (not
    // email+provider) means the same person can sign in with Google one time
    // and GitHub the next without hitting the unique-email constraint.
    let user = await this.userRepo.findOne({
      where: [{ email: oauthUser.email }, { providerId: oauthUser.providerId }],
    });

    // Link this provider to an existing account that has no provider id yet.
    if (user && !user.providerId && oauthUser.providerId) {
      await this.userRepo.update(user.id, {
        providerId: oauthUser.providerId,
        provider: oauthUser.provider as AuthProvider,
      });
    }

    if (!user) {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        const username = generateUsername(
          oauthUser.firstName,
          oauthUser.lastName,
        );
        user = queryRunner.manager.create(User, {
          email: oauthUser.email,
          firstName: oauthUser.firstName || oauthUser.email.split("@")[0],
          lastName: oauthUser.lastName || "",
          avatar: oauthUser.avatar,
          provider: oauthUser.provider as AuthProvider,
          providerId: oauthUser.providerId,
          username: oauthUser.username || username,
          role: role || UserRole.FREELANCER,
          status: UserStatus.ACTIVE,
          isEmailVerified: true, // OAuth providers already verified the email
        });
        await queryRunner.manager.save(user);
        await this.createProfileForRole(queryRunner.manager, user);
        await queryRunner.commitTransaction();
      } catch (err) {
        await queryRunner.rollbackTransaction();
        throw err;
      } finally {
        await queryRunner.release();
      }
    }

    await this.userRepo.update(user.id, { lastLoginAt: new Date() });
    return this.generateTokens(user);
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>("jwt.refreshSecret"),
      });

      const user = await this.userRepo.findOne({ where: { id: payload.sub } });
      if (!user) throw new UnauthorizedException();

      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.userRepo.findOne({
      where: { email: dto.email.toLowerCase() },
    });

    // Always return success to avoid email enumeration attacks
    if (!user)
      return { message: "If this email exists, a reset link has been sent." };

    const token = generateVerificationToken();
    const expires = new Date(Date.now() + 3600000); // 1 hour

    await this.userRepo.update(user.id, {
      passwordResetToken: token,
      passwordResetExpires: expires,
    });

    try {
      await this.mailerService.sendPasswordResetEmail(
        user.email,
        user.firstName,
        token,
      );
    } catch {
      // log silently
    }

    return { message: "If this email exists, a reset link has been sent." };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.userRepo
      .createQueryBuilder("user")
      .addSelect("user.passwordResetToken")
      .addSelect("user.passwordResetExpires")
      .where("user.passwordResetToken = :token", { token: dto.token })
      .getOne();

    if (
      !user ||
      !user.passwordResetExpires ||
      user.passwordResetExpires < new Date()
    ) {
      throw new BadRequestException("Invalid or expired reset token");
    }

    const hashedPassword = await hashPassword(dto.password);
    await this.userRepo.update(user.id, {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null,
    });

    return { message: "Password reset successfully. You can now login." };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.userRepo
      .createQueryBuilder("user")
      .addSelect("user.password")
      .where("user.id = :id", { id: userId })
      .getOne();

    if (user.provider !== AuthProvider.LOCAL) {
      throw new BadRequestException(
        "Cannot change password for OAuth accounts",
      );
    }

    const isValid = await comparePassword(dto.currentPassword, user.password);
    if (!isValid)
      throw new BadRequestException("Current password is incorrect");

    const hashedPassword = await hashPassword(dto.newPassword);
    await this.userRepo.update(userId, { password: hashedPassword });

    return { message: "Password changed successfully" };
  }

  async verifyEmail(token: string) {
    const user = await this.userRepo
      .createQueryBuilder("user")
      .addSelect("user.emailVerificationToken")
      .where("user.emailVerificationToken = :token", { token })
      .getOne();

    if (!user) throw new BadRequestException("Invalid verification token");
    if (user.isEmailVerified) return { message: "Email already verified" };

    await this.userRepo.update(user.id, {
      isEmailVerified: true,
      emailVerificationToken: null,
    });

    return { message: "Email verified successfully" };
  }

  async getProfile(userId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ["freelancerProfile", "clientProfile", "agencyProfile"],
    });
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async generateTokens(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role, isDemo: user.isDemo ?? false };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>("jwt.secret"),
        expiresIn: this.configService.get<string>("jwt.expiresIn"),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>("jwt.refreshSecret"),
        expiresIn: this.configService.get<string>("jwt.refreshExpiresIn"),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async createProfileForRole(manager: any, user: User) {
    switch (user.role) {
      case UserRole.FREELANCER:
        await manager.save(FreelancerProfile, { userId: user.id, user });
        break;
      case UserRole.CLIENT:
        await manager.save(ClientProfile, { userId: user.id, user });
        break;
      case UserRole.AGENCY_OWNER:
        await manager.save(ClientProfile, { userId: user.id, user });
        break;
    }
  }
}
