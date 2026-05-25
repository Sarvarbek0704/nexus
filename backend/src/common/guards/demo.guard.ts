import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';

/**
 * DemoGuard — blocks any mutating request (POST, PATCH, PUT, DELETE)
 * from demo accounts. Demo users can only READ (GET).
 */
@Injectable()
export class DemoGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const method = request.method?.toUpperCase();

    // Only check mutating requests
    if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
      return true;
    }

    // Try to get user from request (already populated by JwtAuthGuard if it ran first)
    let user = request.user;

    // If not populated, decode JWT manually
    if (!user) {
      const authHeader = request.headers?.authorization;
      if (!authHeader?.startsWith('Bearer ')) return true;
      try {
        const token = authHeader.split(' ')[1];
        const payload = this.jwtService.verify(token, {
          secret: process.env.JWT_SECRET,
        });
        user = await this.userRepo.findOne({ where: { id: payload.sub } });
      } catch {
        return true; // invalid token — let JwtAuthGuard handle it
      }
    }

    if (user?.isDemo) {
      throw new ForbiddenException(
        'Demo accounts are read-only. Please register a real account to perform this action.',
      );
    }

    return true;
  }
}
