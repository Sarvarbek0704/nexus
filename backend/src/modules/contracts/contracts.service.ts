import {
  Injectable, NotFoundException, ForbiddenException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Contract, ContractStatus } from '../../database/entities/contract.entity';
import { User, UserRole } from '../../database/entities/user.entity';
import { Milestone, MilestoneStatus } from '../../database/entities/milestone.entity';
import { Payment, PaymentType, PaymentStatus, PaymentMethod } from '../../database/entities/payment.entity';
import { getPagination, paginatedResponse } from '../../common/utils/pagination.util';
import { generateTransactionId } from '../../common/utils/generate.util';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../../database/entities/notification.entity';

@Injectable()
export class ContractsService {
  constructor(
    @InjectRepository(Contract) private contractRepo: Repository<Contract>,
    @InjectRepository(Milestone) private milestoneRepo: Repository<Milestone>,
    @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private dataSource: DataSource,
    private notificationsService: NotificationsService,
  ) {}

  async findOne(id: string) {
    const contract = await this.contractRepo.findOne({
      where: { id },
      relations: [
        'project', 'client', 'freelancer',
        'milestones', 'timeLogs', 'invoices', 'disputes',
        'bid',
      ],
    });
    if (!contract) throw new NotFoundException('Contract not found');
    return contract;
  }

  async findOneSecure(id: string, userId: string, userRole: UserRole) {
    const contract = await this.findOne(id);
    if (
      userRole !== UserRole.ADMIN &&
      contract.clientId !== userId &&
      contract.freelancerId !== userId
    ) {
      throw new ForbiddenException('Access denied');
    }
    return contract;
  }

  async getMyContracts(userId: string, role: string, query: any) {
    const { skip, take, page, limit } = getPagination(query);

    const where: any = role === 'client' ? { clientId: userId } : { freelancerId: userId };
    if (query.status) where.status = query.status;

    const [data, total] = await this.contractRepo.findAndCount({
      where,
      relations: ['project', 'client', 'freelancer', 'milestones'],
      order: { createdAt: 'DESC' },
      skip,
      take,
    });

    return paginatedResponse(data, total, page, limit);
  }

  async signContract(id: string, userId: string) {
    const contract = await this.findOne(id);

    if (contract.status !== ContractStatus.PENDING) {
      throw new BadRequestException('Contract is not pending signature');
    }

    const isClient = contract.clientId === userId;
    const isFreelancer = contract.freelancerId === userId;

    if (!isClient && !isFreelancer) throw new ForbiddenException();

    const update: Partial<Contract> = {};

    if (isFreelancer && !contract.freelancerSigned) {
      update.freelancerSigned = true;
      update.freelancerSignedAt = new Date();
    } else if (isClient && !contract.clientSigned) {
      update.clientSigned = true;
      update.clientSignedAt = new Date();
    } else {
      throw new BadRequestException('Already signed');
    }

    if (
      (isFreelancer && contract.clientSigned) ||
      (isClient && contract.freelancerSigned)
    ) {
      update.status = ContractStatus.ACTIVE;
      update.startDate = new Date();
    }

    await this.contractRepo.update(id, update);

    if (update.status === ContractStatus.ACTIVE) {
      await Promise.all([
        this.notificationsService.create({
          userId: contract.clientId,
          type: NotificationType.CONTRACT_SIGNED,
          title: 'Contract Active',
          message: `Contract for "${contract.project?.title}" is now active`,
          link: `/contracts/${id}`,
          relatedEntityId: id,
          relatedEntityType: 'contract',
        }),
        this.notificationsService.create({
          userId: contract.freelancerId,
          type: NotificationType.CONTRACT_SIGNED,
          title: 'Contract Active',
          message: `Contract for "${contract.project?.title}" is now active`,
          link: `/contracts/${id}`,
          relatedEntityId: id,
          relatedEntityType: 'contract',
        }),
      ]);
    }

    return this.findOne(id);
  }

  async updateStatus(
    id: string, userId: string, userRole: UserRole,
    status: ContractStatus, reason?: string,
  ) {
    const contract = await this.findOneSecure(id, userId, userRole);

    const allowed: Record<ContractStatus, ContractStatus[]> = {
      [ContractStatus.PENDING]: [ContractStatus.CANCELLED],
      [ContractStatus.ACTIVE]: [ContractStatus.PAUSED, ContractStatus.COMPLETED, ContractStatus.DISPUTED, ContractStatus.TERMINATED],
      [ContractStatus.PAUSED]: [ContractStatus.ACTIVE, ContractStatus.TERMINATED],
      [ContractStatus.DISPUTED]: [ContractStatus.ACTIVE, ContractStatus.TERMINATED],
      [ContractStatus.COMPLETED]: [],
      [ContractStatus.CANCELLED]: [],
      [ContractStatus.TERMINATED]: [],
    };

    if (!allowed[contract.status]?.includes(status)) {
      throw new BadRequestException(`Cannot transition from ${contract.status} to ${status}`);
    }

    const update: Partial<Contract> = { status };
    if (status === ContractStatus.COMPLETED) update.actualEndDate = new Date();
    if (status === ContractStatus.COMPLETED) update.completedAt = new Date();
    if (status === ContractStatus.CANCELLED) update.cancelledAt = new Date();
    if (reason) {
      if (status === ContractStatus.PAUSED) update.pauseReason = reason;
      if (status === ContractStatus.CANCELLED) update.cancellationReason = reason;
    }

    await this.contractRepo.update(id, update);

    if (status === ContractStatus.COMPLETED) {
      await Promise.all([
        this.notificationsService.create({
          userId: contract.clientId,
          type: NotificationType.CONTRACT_COMPLETED,
          title: 'Contract Completed',
          message: `Contract "${contract.contractNumber}" has been completed`,
          link: `/contracts/${id}`,
          relatedEntityId: id,
          relatedEntityType: 'contract',
        }),
        this.notificationsService.create({
          userId: contract.freelancerId,
          type: NotificationType.CONTRACT_COMPLETED,
          title: 'Contract Completed',
          message: `Contract "${contract.contractNumber}" has been completed`,
          link: `/contracts/${id}`,
          relatedEntityId: id,
          relatedEntityType: 'contract',
        }),
      ]);
    }

    return this.findOne(id);
  }

  async fundEscrow(contractId: string, milestoneId: string, clientId: string) {
    const contract = await this.findOne(contractId);
    if (contract.clientId !== clientId) throw new ForbiddenException();
    if (contract.status !== ContractStatus.ACTIVE) {
      throw new BadRequestException('Contract is not active');
    }

    const milestone = await this.milestoneRepo.findOne({ where: { id: milestoneId, contractId } });
    if (!milestone) throw new NotFoundException('Milestone not found');
    if (milestone.isEscrowFunded) throw new BadRequestException('Escrow already funded');

    const client = await this.userRepo.findOne({ where: { id: clientId } });
    if (Number(client.walletBalance) < Number(milestone.amount)) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.decrement(User, { id: clientId }, 'walletBalance', Number(milestone.amount));
      await queryRunner.manager.increment(User, { id: clientId }, 'escrowBalance', Number(milestone.amount));

      await queryRunner.manager.update(Milestone, milestoneId, {
        isEscrowFunded: true,
        escrowAmount: milestone.amount,
        status: MilestoneStatus.IN_PROGRESS,
      });

      await queryRunner.manager.save(Payment, {
        transactionId: generateTransactionId(),
        payerId: clientId,
        payeeId: contract.freelancerId,
        contractId,
        milestoneId,
        type: PaymentType.ESCROW_DEPOSIT,
        status: PaymentStatus.COMPLETED,
        method: PaymentMethod.WALLET,
        amount: milestone.amount,
        netAmount: milestone.amount,
        currency: contract.currency || 'USD',
        description: `Escrow deposit for milestone: ${milestone.title}`,
        processedAt: new Date(),
        completedAt: new Date(),
      });

      await queryRunner.commitTransaction();

      await this.notificationsService.create({
        userId: contract.freelancerId,
        type: NotificationType.ESCROW_FUNDED,
        title: 'Escrow Funded',
        message: `$${milestone.amount} has been placed in escrow for milestone: ${milestone.title}`,
        link: `/contracts/${contractId}`,
        relatedEntityId: milestoneId,
        relatedEntityType: 'milestone',
      });

      return { message: 'Escrow funded successfully', milestone };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async getContractSummary(id: string, userId: string, userRole: UserRole) {
    const contract = await this.findOneSecure(id, userId, userRole);

    const milestones = await this.milestoneRepo.find({ where: { contractId: id } });
    const payments = await this.paymentRepo.find({ where: { contractId: id } });

    const totalMilestones = milestones.length;
    const completedMilestones = milestones.filter(m => m.status === MilestoneStatus.PAID).length;
    const pendingMilestones = milestones.filter(m => m.status === MilestoneStatus.PENDING).length;
    const submittedMilestones = milestones.filter(m => m.status === MilestoneStatus.SUBMITTED).length;

    return {
      contract,
      summary: {
        totalMilestones,
        completedMilestones,
        pendingMilestones,
        submittedMilestones,
        progressPercent: totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0,
        totalPayments: payments.filter(p => p.status === PaymentStatus.COMPLETED).length,
        totalPaid: contract.paidAmount,
        remaining: Number(contract.totalAmount) - Number(contract.paidAmount),
        escrowBalance: contract.escrowAmount,
      },
    };
  }

  async addNote(id: string, userId: string, note: string) {
    const contract = await this.findOneSecure(id, userId, UserRole.ADMIN);
    return { message: 'Note added', note };
  }

  async getContractsByAdmin(query: any) {
    const { skip, take, page, limit } = getPagination(query);
    const [data, total] = await this.contractRepo.findAndCount({
      relations: ['project', 'client', 'freelancer'],
      order: { createdAt: 'DESC' },
      skip,
      take,
    });
    return paginatedResponse(data, total, page, limit);
  }
}
