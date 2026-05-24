import {
  Injectable, NotFoundException, ForbiddenException,
  BadRequestException, ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Bid, BidStatus, BidType } from '../../database/entities/bid.entity';
import { BidMilestone } from '../../database/entities/bid-milestone.entity';
import { Project, ProjectStatus } from '../../database/entities/project.entity';
import { User, UserRole } from '../../database/entities/user.entity';
import { Contract, ContractStatus, ContractType } from '../../database/entities/contract.entity';
import { Milestone, MilestoneStatus } from '../../database/entities/milestone.entity';
import { CreateBidDto } from './dto/create-bid.dto';
import { getPagination, paginatedResponse } from '../../common/utils/pagination.util';
import { generateContractNumber } from '../../common/utils/generate.util';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../../database/entities/notification.entity';
import { MailerService } from '../mailer/mailer.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BidsService {
  constructor(
    @InjectRepository(Bid) private bidRepo: Repository<Bid>,
    @InjectRepository(BidMilestone) private bidMilestoneRepo: Repository<BidMilestone>,
    @InjectRepository(Project) private projectRepo: Repository<Project>,
    @InjectRepository(Contract) private contractRepo: Repository<Contract>,
    @InjectRepository(Milestone) private milestoneRepo: Repository<Milestone>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private dataSource: DataSource,
    private notificationsService: NotificationsService,
    private mailerService: MailerService,
    private configService: ConfigService,
  ) {}

  async create(bidderId: string, dto: CreateBidDto) {
    const project = await this.projectRepo.findOne({
      where: { id: dto.projectId },
      relations: ['client'],
    });

    if (!project) throw new NotFoundException('Project not found');
    if (project.status !== ProjectStatus.OPEN) {
      throw new BadRequestException('Project is not accepting bids');
    }
    if (project.clientId === bidderId) {
      throw new ForbiddenException('Cannot bid on your own project');
    }

    const existingBid = await this.bidRepo.findOne({
      where: { projectId: dto.projectId, bidderId, status: BidStatus.PENDING },
    });
    if (existingBid) throw new ConflictException('You already have a pending bid on this project');

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const bid = queryRunner.manager.create(Bid, {
        ...dto,
        bidderId,
        bidType: dto.agencyId ? BidType.AGENCY : BidType.FREELANCER,
        status: BidStatus.PENDING,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      await queryRunner.manager.save(bid);

      if (dto.milestones?.length) {
        const milestones = dto.milestones.map((m, i) =>
          queryRunner.manager.create(BidMilestone, {
            ...m,
            bidId: bid.id,
            sortOrder: i,
            dueDate: m.dueDate ? new Date(m.dueDate) : null,
          }),
        );
        await queryRunner.manager.save(milestones);
      }

      await queryRunner.manager.update(Project, dto.projectId, {
        bidsCount: () => 'bids_count + 1',
      });

      await queryRunner.commitTransaction();

      await this.notificationsService.create({
        userId: project.clientId,
        type: NotificationType.BID_RECEIVED,
        title: 'New Bid Received',
        message: `You received a new bid of $${dto.amount} on "${project.title}"`,
        link: `/projects/${dto.projectId}/bids/${bid.id}`,
        relatedEntityId: bid.id,
        relatedEntityType: 'bid',
      });

      return this.findOne(bid.id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findOne(id: string) {
    const bid = await this.bidRepo.findOne({
      where: { id },
      relations: ['project', 'bidder', 'agency', 'milestones'],
    });
    if (!bid) throw new NotFoundException('Bid not found');
    return bid;
  }

  async getProjectBids(projectId: string, userId: string, query: any) {
    const project = await this.projectRepo.findOne({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');

    if (project.clientId !== userId) {
      throw new ForbiddenException('Not your project');
    }

    const { skip, take, page, limit } = getPagination(query);

    const [data, total] = await this.bidRepo.findAndCount({
      where: { projectId },
      relations: ['bidder', 'bidder.freelancerProfile', 'milestones', 'agency'],
      order: { createdAt: 'DESC' },
      skip,
      take,
    });

    return paginatedResponse(data, total, page, limit);
  }

  async getMyBids(userId: string, query: any) {
    const { skip, take, page, limit } = getPagination(query);

    const [data, total] = await this.bidRepo.findAndCount({
      where: { bidderId: userId },
      relations: ['project', 'project.category', 'milestones'],
      order: { createdAt: 'DESC' },
      skip,
      take,
    });

    return paginatedResponse(data, total, page, limit);
  }

  async updateStatus(id: string, userId: string, userRole: UserRole, status: BidStatus, note?: string) {
    const bid = await this.findOne(id);
    const project = bid.project;

    const allowedTransitions: Record<BidStatus, BidStatus[]> = {
      [BidStatus.PENDING]: [BidStatus.SHORTLISTED, BidStatus.REJECTED, BidStatus.WITHDRAWN],
      [BidStatus.SHORTLISTED]: [BidStatus.ACCEPTED, BidStatus.REJECTED],
      [BidStatus.ACCEPTED]: [],
      [BidStatus.REJECTED]: [],
      [BidStatus.WITHDRAWN]: [],
      [BidStatus.EXPIRED]: [],
    };

    const isClient = project.clientId === userId;
    const isBidder = bid.bidderId === userId;

    if (status === BidStatus.WITHDRAWN && !isBidder) throw new ForbiddenException();
    if ([BidStatus.SHORTLISTED, BidStatus.REJECTED, BidStatus.ACCEPTED].includes(status) && !isClient) {
      throw new ForbiddenException('Only the client can accept/reject bids');
    }

    if (!allowedTransitions[bid.status]?.includes(status)) {
      throw new BadRequestException(`Cannot transition from ${bid.status} to ${status}`);
    }

    if (status === BidStatus.ACCEPTED) {
      return this.acceptBid(bid, project, userId, note);
    }

    await this.bidRepo.update(id, {
      status,
      ...(status === BidStatus.REJECTED ? { rejectionReason: note, rejectedAt: new Date() } : {}),
      ...(status !== BidStatus.WITHDRAWN ? { clientNote: note } : {}),
    });

    const notifType = status === BidStatus.SHORTLISTED
      ? NotificationType.BID_SHORTLISTED
      : status === BidStatus.REJECTED
      ? NotificationType.BID_REJECTED
      : null;

    if (notifType) {
      await this.notificationsService.create({
        userId: bid.bidderId,
        type: notifType,
        title: `Bid ${status}`,
        message: `Your bid on "${project.title}" has been ${status}`,
        link: `/bids/${id}`,
        relatedEntityId: id,
        relatedEntityType: 'bid',
      });
    }

    return this.findOne(id);
  }

  private async acceptBid(bid: Bid, project: any, clientId: string, note?: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.update(Bid, bid.id, {
        status: BidStatus.ACCEPTED,
        acceptedAt: new Date(),
        clientNote: note,
      });

      await queryRunner.manager.update(Bid,
        { projectId: project.id, status: BidStatus.PENDING },
        { status: BidStatus.REJECTED, rejectionReason: 'Another bid was accepted', rejectedAt: new Date() },
      );

      const contractType = bid.milestones?.length > 0 ? ContractType.FIXED : ContractType.HOURLY;
      const contract = queryRunner.manager.create(Contract, {
        contractNumber: generateContractNumber(),
        projectId: project.id,
        clientId,
        freelancerId: bid.bidderId,
        bidId: bid.id,
        status: ContractStatus.PENDING,
        type: contractType,
        totalAmount: bid.amount,
        currency: bid.currency || 'USD',
        startDate: new Date(),
        clientSigned: true,
        clientSignedAt: new Date(),
        platformFeePercent: this.configService.get<number>('PLATFORM_FEE_PERCENT', 10),
        platformFeeAmount: bid.amount * (this.configService.get<number>('PLATFORM_FEE_PERCENT', 10) / 100),
        terms: 'Standard Nexus platform terms apply.',
      });

      await queryRunner.manager.save(contract);

      if (bid.milestones?.length) {
        const milestones = bid.milestones.map((m, i) =>
          queryRunner.manager.create(Milestone, {
            contractId: contract.id,
            title: m.title,
            description: m.description,
            amount: m.amount,
            currency: contract.currency,
            status: MilestoneStatus.PENDING,
            dueDate: m.dueDate,
            sortOrder: i,
          }),
        );
        await queryRunner.manager.save(milestones);
      }

      await queryRunner.manager.update(Project, project.id, {
        status: ProjectStatus.IN_PROGRESS,
        selectedFreelancerId: bid.bidderId,
      });

      await queryRunner.commitTransaction();

      await this.notificationsService.create({
        userId: bid.bidderId,
        type: NotificationType.BID_ACCEPTED,
        title: 'Bid Accepted!',
        message: `Your bid on "${project.title}" was accepted. Contract created.`,
        link: `/contracts/${contract.id}`,
        relatedEntityId: bid.id,
        relatedEntityType: 'bid',
      });

      // Send email to the freelancer whose bid was accepted
      try {
        const freelancer = await this.userRepo.findOne({ where: { id: bid.bidderId } });
        if (freelancer) {
          await this.mailerService.sendBidAcceptedEmail(
            freelancer.email, freelancer.firstName, project.title, contract.id,
          );
        }
      } catch { /* silent — don't block if email fails */ }

      return this.findOne(bid.id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async withdraw(id: string, userId: string) {
    const bid = await this.findOne(id);
    if (bid.bidderId !== userId) throw new ForbiddenException();
    if (bid.status !== BidStatus.PENDING && bid.status !== BidStatus.SHORTLISTED) {
      throw new BadRequestException('Cannot withdraw bid in current status');
    }

    await this.bidRepo.update(id, { status: BidStatus.WITHDRAWN });
    await this.projectRepo.update(bid.projectId, {
      bidsCount: () => 'bids_count - 1',
    });

    return { message: 'Bid withdrawn successfully' };
  }

  async delete(id: string, userId: string, userRole: UserRole) {
    const bid = await this.findOne(id);
    if (userRole !== UserRole.ADMIN && bid.bidderId !== userId) throw new ForbiddenException();
    if (bid.status === BidStatus.ACCEPTED) throw new BadRequestException('Cannot delete accepted bid');
    await this.bidRepo.delete(id);
    return { message: 'Bid deleted' };
  }
}
