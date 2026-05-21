import {
  Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Dispute, DisputeStatus, DisputeReason } from '../../database/entities/dispute.entity';
import { DisputeMessage, DisputeMessageSender } from '../../database/entities/dispute-message.entity';
import { Contract, ContractStatus } from '../../database/entities/contract.entity';
import { User, UserRole } from '../../database/entities/user.entity';
import { Payment, PaymentType, PaymentStatus, PaymentMethod } from '../../database/entities/payment.entity';
import { generateDisputeNumber, generateTransactionId } from '../../common/utils/generate.util';
import { getPagination, paginatedResponse } from '../../common/utils/pagination.util';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../../database/entities/notification.entity';

@Injectable()
export class DisputesService {
  constructor(
    @InjectRepository(Dispute) private disputeRepo: Repository<Dispute>,
    @InjectRepository(DisputeMessage) private msgRepo: Repository<DisputeMessage>,
    @InjectRepository(Contract) private contractRepo: Repository<Contract>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
    private dataSource: DataSource,
    private notificationsService: NotificationsService,
  ) {}

  async open(claimantId: string, dto: {
    contractId: string; milestoneId?: string; reason: DisputeReason;
    title: string; description: string; claimAmount?: number; attachments?: string[];
  }) {
    const contract = await this.contractRepo.findOne({
      where: { id: dto.contractId },
      relations: ['project'],
    });
    if (!contract) throw new NotFoundException('Contract not found');

    const isParty = contract.clientId === claimantId || contract.freelancerId === claimantId;
    if (!isParty) throw new ForbiddenException();

    if (contract.status !== ContractStatus.ACTIVE) {
      throw new BadRequestException('Can only dispute active contracts');
    }

    const existing = await this.disputeRepo.findOne({
      where: { contractId: dto.contractId, status: DisputeStatus.OPEN },
    });
    if (existing) throw new ConflictException('There is already an open dispute for this contract');

    const respondentId = contract.clientId === claimantId ? contract.freelancerId : contract.clientId;
    const responseDeadline = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

    const dispute = this.disputeRepo.create({
      disputeNumber: generateDisputeNumber(),
      contractId: dto.contractId,
      milestoneId: dto.milestoneId,
      claimantId,
      respondentId,
      reason: dto.reason,
      title: dto.title,
      description: dto.description,
      claimAmount: dto.claimAmount,
      attachments: dto.attachments || [],
      status: DisputeStatus.OPEN,
      responseDeadline,
    });

    await this.disputeRepo.save(dispute);

    await this.contractRepo.update(dto.contractId, { status: ContractStatus.DISPUTED });

    const systemMsg = this.msgRepo.create({
      disputeId: dispute.id,
      senderType: DisputeMessageSender.SYSTEM,
      message: `Dispute "${dto.title}" opened. Respondent has 5 days to respond.`,
    });
    await this.msgRepo.save(systemMsg);

    await this.notificationsService.create({
      userId: respondentId,
      type: NotificationType.DISPUTE_OPENED,
      title: 'Dispute Opened',
      message: `A dispute has been opened against you: "${dto.title}"`,
      link: `/disputes/${dispute.id}`,
      relatedEntityId: dispute.id,
      relatedEntityType: 'dispute',
    });

    return this.findOne(dispute.id);
  }

  async findOne(id: string) {
    const dispute = await this.disputeRepo.findOne({
      where: { id },
      relations: ['contract', 'contract.project', 'claimant', 'respondent', 'mediator', 'messages', 'milestone'],
    });
    if (!dispute) throw new NotFoundException('Dispute not found');
    return dispute;
  }

  async findOneSecure(id: string, userId: string, userRole: UserRole) {
    const dispute = await this.findOne(id);
    if (
      userRole !== UserRole.ADMIN &&
      dispute.claimantId !== userId &&
      dispute.respondentId !== userId
    ) {
      throw new ForbiddenException();
    }
    return dispute;
  }

  async addMessage(disputeId: string, userId: string, userRole: UserRole, dto: {
    message: string; attachments?: string[];
  }) {
    const dispute = await this.findOneSecure(disputeId, userId, userRole);

    const senderType = userRole === UserRole.ADMIN
      ? DisputeMessageSender.MEDIATOR
      : dispute.claimantId === userId
      ? DisputeMessageSender.CLAIMANT
      : DisputeMessageSender.RESPONDENT;

    const msg = this.msgRepo.create({
      disputeId,
      senderId: userId,
      senderType,
      message: dto.message,
      attachments: dto.attachments || [],
    });

    await this.msgRepo.save(msg);

    const notifUserId = dispute.claimantId === userId ? dispute.respondentId : dispute.claimantId;
    await this.notificationsService.create({
      userId: notifUserId,
      type: NotificationType.DISPUTE_MESSAGE,
      title: 'New Message in Dispute',
      message: 'A new message has been added to your dispute',
      link: `/disputes/${disputeId}`,
      relatedEntityId: disputeId,
      relatedEntityType: 'dispute',
    });

    return msg;
  }

  async resolve(disputeId: string, adminId: string, dto: {
    resolution: string;
    status: DisputeStatus.RESOLVED_CLAIMANT | DisputeStatus.RESOLVED_RESPONDENT | DisputeStatus.RESOLVED_SPLIT;
    claimantSharePercent?: number;
    respondentSharePercent?: number;
    resolvedAmount?: number;
  }) {
    const dispute = await this.findOne(disputeId);
    if (dispute.status === DisputeStatus.CLOSED) throw new BadRequestException('Dispute already closed');

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.update(Dispute, disputeId, {
        status: dto.status,
        resolution: dto.resolution,
        resolvedAmount: dto.resolvedAmount,
        claimantSharePercent: dto.claimantSharePercent,
        respondentSharePercent: dto.respondentSharePercent,
        resolvedAt: new Date(),
        mediatorId: adminId,
      });

      await queryRunner.manager.update(Contract, dispute.contractId, {
        status: ContractStatus.ACTIVE,
      });

      const systemMsg = queryRunner.manager.create(DisputeMessage, {
        disputeId,
        senderType: DisputeMessageSender.SYSTEM,
        message: `Dispute resolved: ${dto.resolution}`,
      });
      await queryRunner.manager.save(systemMsg);

      await queryRunner.commitTransaction();

      await Promise.all([
        this.notificationsService.create({
          userId: dispute.claimantId,
          type: NotificationType.DISPUTE_RESOLVED,
          title: 'Dispute Resolved',
          message: `Your dispute has been resolved: ${dto.resolution}`,
          link: `/disputes/${disputeId}`,
          relatedEntityId: disputeId,
          relatedEntityType: 'dispute',
        }),
        this.notificationsService.create({
          userId: dispute.respondentId,
          type: NotificationType.DISPUTE_RESOLVED,
          title: 'Dispute Resolved',
          message: `The dispute against you has been resolved`,
          link: `/disputes/${disputeId}`,
          relatedEntityId: disputeId,
          relatedEntityType: 'dispute',
        }),
      ]);

      return this.findOne(disputeId);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async getMyDisputes(userId: string, query: any) {
    const { skip, take, page, limit } = getPagination(query);
    const [data, total] = await this.disputeRepo.findAndCount({
      where: [{ claimantId: userId }, { respondentId: userId }],
      relations: ['contract', 'contract.project'],
      order: { createdAt: 'DESC' },
      skip,
      take,
    });
    return paginatedResponse(data, total, page, limit);
  }

  async getAllDisputes(query: any) {
    const { skip, take, page, limit } = getPagination(query);
    const [data, total] = await this.disputeRepo.findAndCount({
      relations: ['contract', 'claimant', 'respondent'],
      order: { createdAt: 'DESC' },
      skip,
      take,
    });
    return paginatedResponse(data, total, page, limit);
  }
}
