import {
  Injectable, NotFoundException, ForbiddenException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Milestone, MilestoneStatus } from '../../database/entities/milestone.entity';
import { MilestoneSubmission, SubmissionStatus } from '../../database/entities/milestone-submission.entity';
import { Contract, ContractStatus } from '../../database/entities/contract.entity';
import { Payment, PaymentType, PaymentStatus, PaymentMethod } from '../../database/entities/payment.entity';
import { User, UserRole } from '../../database/entities/user.entity';
import { generateTransactionId } from '../../common/utils/generate.util';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../../database/entities/notification.entity';
import { MailerService } from '../mailer/mailer.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MilestonesService {
  constructor(
    @InjectRepository(Milestone) private milestoneRepo: Repository<Milestone>,
    @InjectRepository(MilestoneSubmission) private submissionRepo: Repository<MilestoneSubmission>,
    @InjectRepository(Contract) private contractRepo: Repository<Contract>,
    @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private dataSource: DataSource,
    private notificationsService: NotificationsService,
    private mailerService: MailerService,
    private configService: ConfigService,
  ) {}

  async getContractMilestones(contractId: string, userId: string) {
    const contract = await this.contractRepo.findOne({ where: { id: contractId } });
    if (!contract) throw new NotFoundException('Contract not found');

    if (contract.clientId !== userId && contract.freelancerId !== userId) {
      throw new ForbiddenException();
    }

    return this.milestoneRepo.find({
      where: { contractId },
      relations: ['submissions'],
      order: { sortOrder: 'ASC' },
    });
  }

  async findOne(id: string) {
    const milestone = await this.milestoneRepo.findOne({
      where: { id },
      relations: ['contract', 'submissions'],
    });
    if (!milestone) throw new NotFoundException('Milestone not found');
    return milestone;
  }

  async submit(
    milestoneId: string, freelancerId: string,
    dto: { description: string; attachments?: string[]; deliverableLinks?: string[] },
  ) {
    const milestone = await this.findOne(milestoneId);
    const contract = milestone.contract;

    if (contract.freelancerId !== freelancerId) throw new ForbiddenException();
    if (contract.status !== ContractStatus.ACTIVE) {
      throw new BadRequestException('Contract is not active');
    }
    if (![MilestoneStatus.IN_PROGRESS, MilestoneStatus.REVISION_REQUESTED].includes(milestone.status)) {
      throw new BadRequestException('Milestone cannot be submitted in current status');
    }

    if (!milestone.isEscrowFunded) {
      throw new BadRequestException('Escrow must be funded before submitting');
    }

    const submissionNumber = (await this.submissionRepo.count({ where: { milestoneId } })) + 1;

    if (submissionNumber > milestone.maxRevisions + 1) {
      throw new BadRequestException('Maximum submission attempts reached');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const submission = queryRunner.manager.create(MilestoneSubmission, {
        milestoneId,
        description: dto.description,
        attachments: dto.attachments || [],
        deliverableLinks: dto.deliverableLinks || [],
        status: SubmissionStatus.PENDING,
        revisionNumber: submissionNumber,
      });
      await queryRunner.manager.save(submission);

      await queryRunner.manager.update(Milestone, milestoneId, {
        status: MilestoneStatus.SUBMITTED,
        submittedAt: new Date(),
        revisionCount: submissionNumber - 1,
      });

      await queryRunner.commitTransaction();

      await this.notificationsService.create({
        userId: contract.clientId,
        type: NotificationType.MILESTONE_SUBMITTED,
        title: 'Milestone Submitted for Review',
        message: `Milestone "${milestone.title}" has been submitted for review`,
        link: `/contracts/${contract.id}`,
        relatedEntityId: milestoneId,
        relatedEntityType: 'milestone',
      });

      return this.findOne(milestoneId);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async review(
    milestoneId: string, clientId: string,
    dto: { action: 'approve' | 'reject' | 'request_revision'; feedback?: string },
  ) {
    const milestone = await this.findOne(milestoneId);
    const contract = milestone.contract;

    if (contract.clientId !== clientId) throw new ForbiddenException();
    if (milestone.status !== MilestoneStatus.SUBMITTED) {
      throw new BadRequestException('Milestone is not submitted for review');
    }

    const latestSubmission = await this.submissionRepo.findOne({
      where: { milestoneId },
      order: { createdAt: 'DESC' },
    });

    if (dto.action === 'approve') {
      return this.approveMilestone(milestone, contract, clientId, latestSubmission);
    } else if (dto.action === 'request_revision') {
      if (milestone.revisionCount >= milestone.maxRevisions) {
        throw new BadRequestException('Maximum revisions reached. Must approve or reject.');
      }

      await this.submissionRepo.update(latestSubmission.id, {
        status: SubmissionStatus.REVISION_REQUESTED,
        clientFeedback: dto.feedback,
        reviewedAt: new Date(),
      });

      await this.milestoneRepo.update(milestoneId, {
        status: MilestoneStatus.REVISION_REQUESTED,
        revisionNote: dto.feedback,
      });

      await this.notificationsService.create({
        userId: contract.freelancerId,
        type: NotificationType.MILESTONE_REVISION,
        title: 'Revision Requested',
        message: `Client requested revision for milestone: ${milestone.title}`,
        link: `/contracts/${contract.id}`,
        relatedEntityId: milestoneId,
        relatedEntityType: 'milestone',
      });

      return this.findOne(milestoneId);
    } else {
      // Rejection: return escrowed funds back to client's available balance
      return this.rejectMilestone(milestone, contract, clientId, latestSubmission, dto.feedback);
    }
  }

  private async rejectMilestone(
    milestone: Milestone, contract: Contract, clientId: string,
    submission: MilestoneSubmission, feedback?: string,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const escrowAmount = Number(milestone.escrowAmount || milestone.amount);

      // Return escrow to client wallet
      await queryRunner.manager.increment(User, { id: clientId }, 'walletBalance', escrowAmount);
      await queryRunner.manager.decrement(User, { id: clientId }, 'escrowBalance', escrowAmount);
      await queryRunner.manager.decrement(Contract, { id: contract.id }, 'escrowAmount', escrowAmount);

      // Refund payment record
      await queryRunner.manager.save(Payment, {
        transactionId: generateTransactionId(),
        payerId: 'platform',
        payeeId: clientId,
        contractId: contract.id,
        milestoneId: milestone.id,
        type: PaymentType.REFUND,
        status: PaymentStatus.COMPLETED,
        method: PaymentMethod.WALLET,
        amount: escrowAmount,
        netAmount: escrowAmount,
        currency: contract.currency || 'USD',
        description: `Escrow refund for rejected milestone: ${milestone.title}`,
        processedAt: new Date(),
        completedAt: new Date(),
      });

      if (submission) {
        await queryRunner.manager.update(MilestoneSubmission, submission.id, {
          status: SubmissionStatus.REJECTED,
          clientFeedback: feedback,
          reviewedAt: new Date(),
        });
      }

      await queryRunner.manager.update(Milestone, milestone.id, {
        status: MilestoneStatus.REJECTED,
        rejectionReason: feedback,
        rejectedAt: new Date(),
        isEscrowFunded: false,
        escrowAmount: 0,
      });

      await queryRunner.commitTransaction();

      await this.notificationsService.create({
        userId: contract.freelancerId,
        type: NotificationType.MILESTONE_REJECTED,
        title: 'Milestone Rejected',
        message: `Milestone "${milestone.title}" was rejected. Escrow has been refunded to the client.`,
        link: `/contracts/${contract.id}`,
        relatedEntityId: milestone.id,
        relatedEntityType: 'milestone',
      });

      await this.notificationsService.create({
        userId: clientId,
        type: NotificationType.PAYMENT_RECEIVED,
        title: 'Escrow Refunded',
        message: `$${escrowAmount.toFixed(2)} has been returned to your wallet from rejected milestone: ${milestone.title}`,
        link: `/contracts/${contract.id}`,
        relatedEntityId: milestone.id,
        relatedEntityType: 'milestone',
      });

      return this.findOne(milestone.id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  private async approveMilestone(milestone: Milestone, contract: Contract, clientId: string, submission: MilestoneSubmission) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // The fee and the freelancer's share must add back up to the milestone
      // amount, exactly, every time. Postgres rounds them to the column's two
      // decimals on the way in, so whether that holds is decided by how they
      // are derived — not by how carefully they are computed.
      //
      // Deriving both independently in float did not hold. On a $0.05
      // milestone at 10%: fee 0.005 rounds up to 0.01, net 0.045 rounds up to
      // 0.05, and the platform pays out 0.06 while debiting escrow 0.05. The
      // cent comes from nowhere. Float made it worse but was not the cause —
      // two independent roundings were.
      //
      // So the fee is rounded once, in numeric, and the net is *defined* as
      // the remainder. Their sum is the amount by construction.
      const [split]: Array<{ platformFee: string; netAmount: string }> =
        await queryRunner.query(
          `SELECT round($1::numeric * $2::numeric / 100, 2) AS "platformFee",
                  $1::numeric - round($1::numeric * $2::numeric / 100, 2) AS "netAmount"`,
          [milestone.amount, contract.platformFeePercent],
        );
      const platformFee = split.platformFee;
      const netAmount = split.netAmount;

      await queryRunner.query(
        `UPDATE "users" SET "walletBalance" = "walletBalance" + $1::numeric WHERE "id" = $2`,
        [netAmount, contract.freelancerId],
      );
      await queryRunner.query(
        `UPDATE "users" SET "escrowBalance" = "escrowBalance" - $1::numeric WHERE "id" = $2`,
        [milestone.escrowAmount, clientId],
      );
      await queryRunner.query(
        `UPDATE "contracts"
            SET "paidAmount"   = "paidAmount"   + $1::numeric,
                "escrowAmount" = "escrowAmount" - $2::numeric
          WHERE "id" = $3`,
        [milestone.amount, milestone.escrowAmount, contract.id],
      );

      await queryRunner.manager.save(Payment, {
        transactionId: generateTransactionId(),
        payerId: clientId,
        payeeId: contract.freelancerId,
        contractId: contract.id,
        milestoneId: milestone.id,
        type: PaymentType.MILESTONE_PAYMENT,
        status: PaymentStatus.COMPLETED,
        method: PaymentMethod.WALLET,
        amount: milestone.amount,
        // Every `decimal` column in this schema is annotated `number` and
        // arrives as a `string` — TypeORM does not convert them and there is
        // no transformer. So `milestone.amount` above is already a string at
        // runtime and slips through only because its annotation is wrong too.
        // These two are cast rather than rounded through a float: the cast
        // records the mismatch, where `Number(...)` would hide it and lose the
        // exactness the numeric arithmetic above exists to preserve.
        // Fixing the annotations project-wide is specified in docs/.
        platformFee: platformFee as unknown as number,
        netAmount: netAmount as unknown as number,
        currency: contract.currency || 'USD',
        description: `Payment for milestone: ${milestone.title}`,
        processedAt: new Date(),
        completedAt: new Date(),
      });

      await queryRunner.manager.save(Payment, {
        transactionId: generateTransactionId(),
        payerId: contract.freelancerId,
        payeeId: 'platform',
        contractId: contract.id,
        milestoneId: milestone.id,
        type: PaymentType.PLATFORM_FEE,
        status: PaymentStatus.COMPLETED,
        method: PaymentMethod.WALLET,
        amount: platformFee as unknown as number,
        netAmount: platformFee as unknown as number,
        currency: contract.currency || 'USD',
        description: 'Platform fee',
        processedAt: new Date(),
        completedAt: new Date(),
      });

      if (submission) {
        await queryRunner.manager.update(MilestoneSubmission, submission.id, {
          status: SubmissionStatus.APPROVED,
          clientFeedback: 'Approved',
          reviewedAt: new Date(),
        });
      }

      await queryRunner.manager.update(Milestone, milestone.id, {
        status: MilestoneStatus.PAID,
        approvedAt: new Date(),
        paidAt: new Date(),
      });

      await queryRunner.commitTransaction();

      await this.notificationsService.create({
        userId: contract.freelancerId,
        type: NotificationType.PAYMENT_RECEIVED,
        title: 'Payment Received!',
        message: `$${netAmount} received for milestone: ${milestone.title}`,
        link: `/contracts/${contract.id}`,
        relatedEntityId: milestone.id,
        relatedEntityType: 'milestone',
      });

      // Send payment email to freelancer
      try {
        const freelancer = await this.userRepo.findOne({ where: { id: contract.freelancerId } });
        if (freelancer) {
          await this.mailerService.sendPaymentReceivedEmail(
            freelancer.email, freelancer.firstName, netAmount, milestone.title,
          );
        }
      } catch { /* silent */ }

      // Auto-complete contract if all milestones are PAID
      await this.checkAndCompleteContract(contract.id, clientId, contract.freelancerId);

      return this.findOne(milestone.id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  private async checkAndCompleteContract(contractId: string, clientId: string, freelancerId: string) {
    const milestones = await this.milestoneRepo.find({ where: { contractId } });
    if (milestones.length === 0) return;

    const allPaid = milestones.every((m) => m.status === MilestoneStatus.PAID);
    if (!allPaid) return;

    await this.contractRepo.update(contractId, {
      status: ContractStatus.COMPLETED,
      completedAt: new Date(),
    });

    await Promise.all([
      this.notificationsService.create({
        userId: clientId,
        type: NotificationType.CONTRACT_COMPLETED,
        title: 'Contract Completed!',
        message: 'All milestones have been paid. The contract is now complete.',
        link: `/contracts/${contractId}`,
        relatedEntityId: contractId,
        relatedEntityType: 'contract',
      }),
      this.notificationsService.create({
        userId: freelancerId,
        type: NotificationType.CONTRACT_COMPLETED,
        title: 'Contract Completed!',
        message: 'All milestones paid. Don\'t forget to leave a review!',
        link: `/contracts/${contractId}`,
        relatedEntityId: contractId,
        relatedEntityType: 'contract',
      }),
    ]);
  }
}
