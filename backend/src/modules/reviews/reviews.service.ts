import {
  Injectable, NotFoundException, ForbiddenException,
  BadRequestException, ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review, ReviewType } from '../../database/entities/review.entity';
import { Contract, ContractStatus } from '../../database/entities/contract.entity';
import { User } from '../../database/entities/user.entity';
import { getPagination, paginatedResponse } from '../../common/utils/pagination.util';

export class CreateReviewDto {
  contractId: string;
  overallRating: number;
  communicationRating?: number;
  qualityRating?: number;
  timelinessRating?: number;
  cooperationRating?: number;
  skillRating?: number;
  comment?: string;
  isPublic?: boolean;
}

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review) private reviewRepo: Repository<Review>,
    @InjectRepository(Contract) private contractRepo: Repository<Contract>,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  async create(reviewerId: string, dto: CreateReviewDto) {
    const contract = await this.contractRepo.findOne({
      where: { id: dto.contractId },
      relations: ['project'],
    });

    if (!contract) throw new NotFoundException('Contract not found');
    if (contract.status !== ContractStatus.COMPLETED) {
      throw new BadRequestException('Can only review completed contracts');
    }

    const isClient = contract.clientId === reviewerId;
    const isFreelancer = contract.freelancerId === reviewerId;

    if (!isClient && !isFreelancer) throw new ForbiddenException();

    const type = isClient ? ReviewType.CLIENT_TO_FREELANCER : ReviewType.FREELANCER_TO_CLIENT;
    const revieweeId = isClient ? contract.freelancerId : contract.clientId;

    const existing = await this.reviewRepo.findOne({
      where: { contractId: dto.contractId, reviewerId, type },
    });
    if (existing) throw new ConflictException('You already reviewed this contract');

    if (dto.overallRating < 1 || dto.overallRating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    const review = this.reviewRepo.create({
      ...dto,
      reviewerId,
      revieweeId,
      projectId: contract.projectId,
      type,
      isPublic: dto.isPublic !== false,
    });

    await this.reviewRepo.save(review);
    await this.updateUserRating(revieweeId);

    return review;
  }

  async getFreelancerReviews(freelancerId: string, query: any) {
    const { skip, take, page, limit } = getPagination(query);

    const [data, total] = await this.reviewRepo.findAndCount({
      where: {
        revieweeId: freelancerId,
        type: ReviewType.CLIENT_TO_FREELANCER,
        isPublic: true,
      },
      relations: ['reviewer', 'project'],
      order: { createdAt: 'DESC' },
      skip,
      take,
    });

    return paginatedResponse(data, total, page, limit);
  }

  async getClientReviews(clientId: string, query: any) {
    const { skip, take, page, limit } = getPagination(query);

    const [data, total] = await this.reviewRepo.findAndCount({
      where: {
        revieweeId: clientId,
        type: ReviewType.FREELANCER_TO_CLIENT,
        isPublic: true,
      },
      relations: ['reviewer', 'project'],
      order: { createdAt: 'DESC' },
      skip,
      take,
    });

    return paginatedResponse(data, total, page, limit);
  }

  async respondToReview(reviewId: string, userId: string, response: string) {
    const review = await this.reviewRepo.findOne({ where: { id: reviewId } });
    if (!review) throw new NotFoundException();
    if (review.revieweeId !== userId) throw new ForbiddenException();
    if (review.response) throw new BadRequestException('Already responded');

    await this.reviewRepo.update(reviewId, { response, respondedAt: new Date() });
    return { message: 'Response added' };
  }

  async markHelpful(reviewId: string) {
    await this.reviewRepo.update(reviewId, {
      helpfulCount: () => 'helpful_count + 1',
    });
    return { message: 'Marked as helpful' };
  }

  async getRatingSummary(userId: string) {
    const stats = await this.reviewRepo
      .createQueryBuilder('review')
      .where('review.revieweeId = :userId AND review.isPublic = true', { userId })
      .select([
        'AVG(review.overallRating) as avgRating',
        'COUNT(*) as totalReviews',
        'AVG(review.communicationRating) as avgCommunication',
        'AVG(review.qualityRating) as avgQuality',
        'AVG(review.timelinessRating) as avgTimeliness',
        'COUNT(CASE WHEN review.overallRating = 5 THEN 1 END) as fiveStars',
        'COUNT(CASE WHEN review.overallRating = 4 THEN 1 END) as fourStars',
        'COUNT(CASE WHEN review.overallRating = 3 THEN 1 END) as threeStars',
        'COUNT(CASE WHEN review.overallRating <= 2 THEN 1 END) as lowStars',
      ])
      .getRawOne();

    return {
      averageRating: parseFloat(stats.avgrating) || 0,
      totalReviews: parseInt(stats.totalreviews) || 0,
      breakdown: {
        communication: parseFloat(stats.avgcommunication) || 0,
        quality: parseFloat(stats.avgquality) || 0,
        timeliness: parseFloat(stats.avgtimeliness) || 0,
      },
      distribution: {
        5: parseInt(stats.fivestars) || 0,
        4: parseInt(stats.fourstars) || 0,
        3: parseInt(stats.threestars) || 0,
        2: parseInt(stats.lowstars) || 0,
        1: 0,
      },
    };
  }

  private async updateUserRating(userId: string) {
    const stats = await this.reviewRepo
      .createQueryBuilder('review')
      .where('review.revieweeId = :userId', { userId })
      .select([
        'AVG(review.overallRating) as avg',
        'COUNT(*) as count',
      ])
      .getRawOne();

    await this.userRepo.update(userId, {
      averageRating: parseFloat(stats.avg) || 0,
      totalReviews: parseInt(stats.count) || 0,
    });
  }
}
