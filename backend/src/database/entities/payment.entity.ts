import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Contract } from './contract.entity';
import { Milestone } from './milestone.entity';

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled',
  ON_HOLD = 'on_hold',
}

export enum PaymentType {
  MILESTONE_PAYMENT = 'milestone_payment',
  ESCROW_DEPOSIT = 'escrow_deposit',
  ESCROW_RELEASE = 'escrow_release',
  REFUND = 'refund',
  BONUS = 'bonus',
  WITHDRAWAL = 'withdrawal',
  PLATFORM_FEE = 'platform_fee',
  SUBSCRIPTION = 'subscription',
}

export enum PaymentMethod {
  WALLET = 'wallet',
  CREDIT_CARD = 'credit_card',
  BANK_TRANSFER = 'bank_transfer',
  PAYPAL = 'paypal',
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  transactionId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'payerId' })
  payer: User;

  @Column()
  payerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'payeeId' })
  payee: User;

  @Column()
  payeeId: string;

  @ManyToOne(() => Contract, (contract) => contract, { nullable: true })
  @JoinColumn()
  contract: Contract;

  @Column({ nullable: true })
  contractId: string;

  @ManyToOne(() => Milestone, (milestone) => milestone.payments, { nullable: true })
  @JoinColumn()
  milestone: Milestone;

  @Column({ nullable: true })
  milestoneId: string;

  @Column({ type: 'enum', enum: PaymentType })
  type: PaymentType;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ type: 'enum', enum: PaymentMethod, default: PaymentMethod.WALLET })
  method: PaymentMethod;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  platformFee: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  netAmount: number;

  @Column({ default: 'USD' })
  currency: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  failureReason: string;

  @Column({ nullable: true })
  refundReason: string;

  @Column({ nullable: true })
  processedAt: Date;

  @Column({ nullable: true })
  completedAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
