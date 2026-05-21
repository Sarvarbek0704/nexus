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
      await queryRunner.manager.update(User, userId, {
        walletBalance: () => `wallet_balance + ${amount}`,
      });

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

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (Number(user.walletBalance) < amount) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.update(User, userId, {
        walletBalance: () => `wallet_balance - ${amount}`,
      });

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
    const [data, total] = await this.paymentRepo.findAndCount({
      relations: ['contract'],
      order: { createdAt: 'DESC' },
      skip,
      take,
    });
    return paginatedResponse(data, total, page, limit);
  }
}
