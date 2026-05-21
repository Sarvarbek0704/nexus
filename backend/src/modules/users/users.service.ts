import {
  Injectable, NotFoundException, ForbiddenException, ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole, UserStatus } from '../../database/entities/user.entity';
import { FreelancerProfile } from '../../database/entities/freelancer-profile.entity';
import { ClientProfile } from '../../database/entities/client-profile.entity';
import { Portfolio } from '../../database/entities/portfolio.entity';
import { Skill } from '../../database/entities/skill.entity';
import { getPagination, paginatedResponse } from '../../common/utils/pagination.util';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(FreelancerProfile) private freelancerProfileRepo: Repository<FreelancerProfile>,
    @InjectRepository(ClientProfile) private clientProfileRepo: Repository<ClientProfile>,
    @InjectRepository(Portfolio) private portfolioRepo: Repository<Portfolio>,
    @InjectRepository(Skill) private skillRepo: Repository<Skill>,
  ) {}

  async getPublicProfile(userId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId, status: UserStatus.ACTIVE },
      relations: [
        'freelancerProfile', 'freelancerProfile.skills',
        'freelancerProfile.portfolioItems',
        'clientProfile', 'agencyProfile',
      ],
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async getPublicProfileByUsername(username: string) {
    const user = await this.userRepo.findOne({
      where: { username, status: UserStatus.ACTIVE },
      relations: [
        'freelancerProfile', 'freelancerProfile.skills',
        'freelancerProfile.portfolioItems', 'clientProfile',
      ],
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(userId: string, dto: Partial<User>) {
    const forbidden = ['password', 'role', 'status', 'email', 'provider', 'providerId'];
    forbidden.forEach((key) => delete dto[key]);

    await this.userRepo.update(userId, dto);
    return this.userRepo.findOne({ where: { id: userId } });
  }

  async updateFreelancerProfile(userId: string, dto: Partial<FreelancerProfile>) {
    const profile = await this.freelancerProfileRepo.findOne({ where: { userId } });
    if (!profile) throw new NotFoundException('Freelancer profile not found');

    if (dto.skills) {
      const skills = await this.skillRepo.findByIds(dto.skills as any);
      profile.skills = skills;
      delete dto.skills;
    }

    Object.assign(profile, dto);
    return this.freelancerProfileRepo.save(profile);
  }

  async updateClientProfile(userId: string, dto: Partial<ClientProfile>) {
    const profile = await this.clientProfileRepo.findOne({ where: { userId } });
    if (!profile) throw new NotFoundException('Client profile not found');
    Object.assign(profile, dto);
    return this.clientProfileRepo.save(profile);
  }

  async getFreelancers(query: any) {
    const { skip, take, page, limit } = getPagination(query);

    const qb = this.userRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.freelancerProfile', 'fp')
      .leftJoinAndSelect('fp.skills', 'skills')
      .where('user.role = :role AND user.status = :status', {
        role: UserRole.FREELANCER,
        status: UserStatus.ACTIVE,
      });

    if (query.search) {
      qb.andWhere(
        "(user.firstName ILIKE :s OR user.lastName ILIKE :s OR fp.title ILIKE :s OR fp.overview ILIKE :s)",
        { s: `%${query.search}%` },
      );
    }

    if (query.skills) {
      const skillNames = query.skills.split(',');
      qb.andWhere('skills.name IN (:...skillNames)', { skillNames });
    }

    if (query.country) qb.andWhere('user.country = :country', { country: query.country });
    if (query.minRate) qb.andWhere('fp.hourlyRate >= :minRate', { minRate: query.minRate });
    if (query.maxRate) qb.andWhere('fp.hourlyRate <= :maxRate', { maxRate: query.maxRate });
    if (query.experienceLevel) qb.andWhere('fp.experienceLevel = :exp', { exp: query.experienceLevel });
    if (query.availability) qb.andWhere('fp.availability = :avail', { avail: query.availability });
    if (query.isTopRated) qb.andWhere('fp.isTopRated = true');

    const sortMap: Record<string, string> = {
      rating: 'user.averageRating',
      rate: 'fp.hourlyRate',
      jobs: 'fp.totalJobsCompleted',
      newest: 'user.createdAt',
    };
    const sortField = sortMap[query.sortBy] || 'user.averageRating';
    qb.orderBy(sortField, 'DESC').skip(skip).take(take);

    const [data, total] = await qb.getManyAndCount();
    return paginatedResponse(data, total, page, limit);
  }

  async addPortfolio(userId: string, dto: Partial<Portfolio>) {
    const profile = await this.freelancerProfileRepo.findOne({ where: { userId } });
    if (!profile) throw new NotFoundException();

    const portfolio = this.portfolioRepo.create({
      ...dto,
      freelancerProfileId: profile.id,
    });
    return this.portfolioRepo.save(portfolio);
  }

  async updatePortfolio(portfolioId: string, userId: string, dto: Partial<Portfolio>) {
    const portfolio = await this.portfolioRepo.findOne({
      where: { id: portfolioId },
      relations: ['freelancerProfile'],
    });
    if (!portfolio) throw new NotFoundException();
    if (portfolio.freelancerProfile.userId !== userId) throw new ForbiddenException();

    Object.assign(portfolio, dto);
    return this.portfolioRepo.save(portfolio);
  }

  async deletePortfolio(portfolioId: string, userId: string) {
    const portfolio = await this.portfolioRepo.findOne({
      where: { id: portfolioId },
      relations: ['freelancerProfile'],
    });
    if (!portfolio) throw new NotFoundException();
    if (portfolio.freelancerProfile.userId !== userId) throw new ForbiddenException();
    await this.portfolioRepo.delete(portfolioId);
    return { message: 'Portfolio item deleted' };
  }

  async uploadAvatar(userId: string, filename: string) {
    await this.userRepo.update(userId, { avatar: `/uploads/${filename}` });
    return { avatar: `/uploads/${filename}` };
  }

  async adminGetUsers(query: any) {
    const { skip, take, page, limit } = getPagination(query);
    const [data, total] = await this.userRepo.findAndCount({
      order: { createdAt: 'DESC' },
      skip,
      take,
    });
    return paginatedResponse(data, total, page, limit);
  }

  async adminUpdateUserStatus(userId: string, status: UserStatus) {
    await this.userRepo.update(userId, { status });
    return { message: `User status updated to ${status}` };
  }
}
