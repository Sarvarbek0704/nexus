import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn, OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { Contract } from './contract.entity';
import { Milestone } from './milestone.entity';
import { DisputeMessage } from './dispute-message.entity';

export enum DisputeStatus {
  OPEN = 'open',
  UNDER_REVIEW = 'under_review',
  AWAITING_RESPONSE = 'awaiting_response',
  MEDIATION = 'mediation',
  RESOLVED_CLAIMANT = 'resolved_claimant',
  RESOLVED_RESPONDENT = 'resolved_respondent',
  RESOLVED_SPLIT = 'resolved_split',
  CLOSED = 'closed',
  ESCALATED = 'escalated',
}

export enum DisputeReason {
  NON_DELIVERY = 'non_delivery',
  POOR_QUALITY = 'poor_quality',
  SCOPE_CHANGE = 'scope_change',
  PAYMENT_ISSUE = 'payment_issue',
  COMMUNICATION = 'communication',
  DEADLINE_MISSED = 'deadline_missed',
  CONTRACT_VIOLATION = 'contract_violation',
  OTHER = 'other',
}

@Entity('disputes')
export class Dispute {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  disputeNumber: string;

  @ManyToOne(() => Contract, (contract) => contract.disputes)
  @JoinColumn()
  contract: Contract;

  @Column()
  contractId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'claimantId' })
  claimant: User;

  @Column()
  claimantId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'respondentId' })
  respondent: User;

  @Column()
  respondentId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'mediatorId' })
  mediator: User;

  @Column({ nullable: true })
  mediatorId: string;

  @ManyToOne(() => Milestone, { nullable: true })
  @JoinColumn()
  milestone: Milestone;

  @Column({ nullable: true })
  milestoneId: string;

  @Column({ type: 'enum', enum: DisputeStatus, default: DisputeStatus.OPEN })
  status: DisputeStatus;

  @Column({ type: 'enum', enum: DisputeReason })
  reason: DisputeReason;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  claimAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  resolvedAmount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  claimantSharePercent: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  respondentSharePercent: number;

  @Column({ type: 'jsonb', nullable: true })
  attachments: string[];

  @Column({ nullable: true, type: 'text' })
  resolution: string;

  @Column({ nullable: true })
  resolvedAt: Date;

  @Column({ nullable: true })
  closedAt: Date;

  @Column({ nullable: true })
  responseDeadline: Date;

  @OneToMany(() => DisputeMessage, (msg) => msg.dispute)
  messages: DisputeMessage[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
