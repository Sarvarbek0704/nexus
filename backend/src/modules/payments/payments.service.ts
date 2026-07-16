import {
  Injectable, NotFoundException, ForbiddenException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Payment, PaymentStatus, PaymentType, PaymentMethod } from '../../database/entities/payment.entity';
import { User } from '../../database/entities/user.entity';
import { getPagination, paginatedResponse } from '../../common/utils/pagination.util';
import { generateTransactionId } from '../../common/utils/generate.util';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private dataSource: DataSource,
  ) {}

  async getMyPayments(userId: string, query: any) {
    const { skip, take, page, limit } = getPagination(query);

    const [data, total] = await this.paymentRepo.findAndCount({
      where: [{ payerId: userId }, { payeeId: userId }],
      relations: ['contract', 'milestone'],
      order: { createdAt: 'DESC' },
      skip,
      take,
    });

    return paginatedResponse(data, total, page, limit);
  }

  async getWalletInfo(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException();

    const totalReceived = await this.paymentRepo
      .createQueryBuilder('p')
      .where('p.payeeId = :userId AND p.status = :status AND p.type = :type', {
        userId,
        status: PaymentStatus.COMPLETED,
        type: PaymentType.MILESTONE_PAYMENT,
      })
      .select('SUM(p.netAmount)', 'total')
      .getRawOne();

    const totalSpent = await this.paymentRepo
      .createQueryBuilder('p')
      .where('p.payerId = :userId AND p.status = :status AND p.type = :type', {
        userId,
        status: PaymentStatus.COMPLETED,
        type: PaymentType.MILESTONE_PAYMENT,
      })
      .select('SUM(p.amount)', 'total')
      .getRawOne();

    return {
      walletBalance: user.walletBalance,
      escrowBalance: user.escrowBalance,
      totalReceived: parseFloat(totalReceived.total) || 0,
      totalSpent: parseFloat(totalSpent.total) || 0,
    };
  }

  async deposit(userId: string, amount: number, method: PaymentMethod) {
    if (amount < 10) throw new BadRequestException('Minimum deposit is $10');
    if (amount > 10000) throw new BadRequestException('Maximum deposit is $10,000');

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.increment(User, { id: userId }, 'walletBalance', amount);

      const payment = queryRunner.manager.create(Payment, {
        transactionId: generateTransactionId(),
        payerId: userId,
        payeeId: userId,
        type: PaymentType.ESCROW_DEPOSIT,
        status: PaymentStatus.COMPLETED,
        method,
        amount,
        netAmount: amount,
        currency: 'USD',
        description: 'Wallet top-up',
        processedAt: new Date(),
        completedAt: new Date(),
      });
      await queryRunner.manager.save(payment);

      await queryRunner.commitTransaction();
      return { message: `$${amount} deposited to wallet`, payment };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async withdraw(userId: string, amount: number, method: PaymentMethod) {
    if (amount < 10) throw new BadRequestException('Minimum withdrawal is $10');

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Same shape as fundMilestone in contracts.service.ts, and for the same
      // reason: the read, the comparison and the debit have to be one
      // statement or two concurrent withdrawals both pass a check against the
      // same balance and both debit. Here it matters more — a withdrawal is
      // money leaving the system, not moving inside it.
      //
      // Nothing in the schema forbids a negative balance, so there is no
      // backstop underneath this. See docs/03-money-and-escrow.md §8.
      const debited: Array<{ walletBalance: string }> = await queryRunner.query(
        `UPDATE "users"
            SET "walletBalance" = "walletBalance" - $1::numeric
          WHERE "id" = $2
            AND "walletBalance" >= $1::numeric
      RETURNING "walletBalance"`,
        [amount, userId],
      );

      if (debited.length === 0) {
        throw new BadRequestException('Insufficient wallet balance');
      }

      const payment = queryRunner.manager.create(Payment, {
        transactionId: generateTransactionId(),
        payerId: userId,
        payeeId: userId,
        type: PaymentType.WITHDRAWAL,
        status: PaymentStatus.COMPLETED,
        method,
        amount,
        netAmount: amount,
        currency: 'USD',
        description: 'Wallet withdrawal',
        processedAt: new Date(),
        completedAt: new Date(),
      });
      await queryRunner.manager.save(payment);

      await queryRunner.commitTransaction();
      return { message: `$${amount} withdrawal initiated`, payment };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async getTransactionHistory(userId: string, type?: PaymentType, query?: any) {
    const { skip, take, page, limit } = getPagination(query || {});

    const qb = this.paymentRepo
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.contract', 'contract')
      .leftJoinAndSelect('payment.milestone', 'milestone')
      .where('(payment.payerId = :userId OR payment.payeeId = :userId)', { userId });

    if (type) qb.andWhere('payment.type = :type', { type });

    qb.orderBy('payment.createdAt', 'DESC').skip(skip).take(take);

    const [data, total] = await qb.getManyAndCount();
    return paginatedResponse(data, total, page, limit);
  }

  async getAdminPayments(query: any) {
    const { skip, take, page, limit } = getPagination(query);

    const qb = this.paymentRepo
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.contract', 'contract')
      .leftJoinAndSelect('payment.payer', 'payer')
      .leftJoinAndSelect('payment.payee', 'payee')
      .orderBy('payment.createdAt', 'DESC');

    if (query.type) {
      qb.andWhere('payment.type = :type', { type: query.type });
    }

    if (query.search) {
      qb.andWhere(
        '(payer.email ILIKE :search OR payee.email ILIKE :search OR payment.transactionId ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    qb.skip(skip).take(take);
    const [data, total] = await qb.getManyAndCount();
    return paginatedResponse(data, total, page, limit);
  }
}
