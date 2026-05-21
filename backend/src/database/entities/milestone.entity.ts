import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn, OneToMany,
} from 'typeorm';
import { Contract } from './contract.entity';
import { MilestoneSubmission } from './milestone-submission.entity';
import { Payment } from './payment.entity';

export enum MilestoneStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  REVISION_REQUESTED = 'revision_requested',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

@Entity('milestones')
export class Milestone {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Contract, (contract) => contract.milestones)
  @JoinColumn()
  contract: Contract;

  @Column()
  contractId: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ nullable: true })
  currency: string;

  @Column({ type: 'enum', enum: MilestoneStatus, default: MilestoneStatus.PENDING })
  status: MilestoneStatus;

  @Column({ nullable: true })
  dueDate: Date;

  @Column({ default: 0 })
  sortOrder: number;

  @Column({ default: 0 })
  revisionCount: number;

  @Column({ default: 3 })
  maxRevisions: number;

  @Column({ nullable: true })
  submittedAt: Date;

  @Column({ nullable: true })
  approvedAt: Date;

  @Column({ nullable: true })
  rejectedAt: Date;

  @Column({ nullable: true })
  paidAt: Date;

  @Column({ nullable: true })
  rejectionReason: string;

  @Column({ nullable: true })
  revisionNote: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  escrowAmount: number;

  @Column({ default: false })
  isEscrowFunded: boolean;

  @OneToMany(() => MilestoneSubmission, (submission) => submission.milestone)
  submissions: MilestoneSubmission[];

  @OneToMany(() => Payment, (payment) => payment.milestone)
  payments: Payment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
