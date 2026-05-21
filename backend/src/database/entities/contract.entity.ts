import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn, OneToMany, OneToOne,
} from 'typeorm';
import { User } from './user.entity';
import { Project } from './project.entity';
import { Bid } from './bid.entity';
import { Milestone } from './milestone.entity';
import { TimeLog } from './time-log.entity';
import { Invoice } from './invoice.entity';
import { Dispute } from './dispute.entity';
import { Review } from './review.entity';

export enum ContractStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  PAUSED = 'paused',
  DISPUTED = 'disputed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  TERMINATED = 'terminated',
}

export enum ContractType {
  FIXED = 'fixed',
  HOURLY = 'hourly',
  RETAINER = 'retainer',
}

@Entity('contracts')
export class Contract {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  contractNumber: string;

  @ManyToOne(() => Project, (project) => project.contracts)
  @JoinColumn()
  project: Project;

  @Column()
  projectId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'clientId' })
  client: User;

  @Column()
  clientId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'freelancerId' })
  freelancer: User;

  @Column()
  freelancerId: string;

  @ManyToOne(() => Bid, { nullable: true })
  @JoinColumn()
  bid: Bid;

  @Column({ nullable: true })
  bidId: string;

  @Column({ type: 'enum', enum: ContractStatus, default: ContractStatus.PENDING })
  status: ContractStatus;

  @Column({ type: 'enum', enum: ContractType, default: ContractType.FIXED })
  type: ContractType;

  @Column({ type: 'text', nullable: true })
  terms: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  paidAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  escrowAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  hourlyRate: number;

  @Column({ nullable: true })
  hoursPerWeek: number;

  @Column({ nullable: true })
  currency: string;

  @Column({ nullable: true })
  startDate: Date;

  @Column({ nullable: true })
  endDate: Date;

  @Column({ nullable: true })
  actualEndDate: Date;

  @Column({ nullable: true })
  deadline: Date;

  @Column({ default: false })
  clientSigned: boolean;

  @Column({ nullable: true })
  clientSignedAt: Date;

  @Column({ default: false })
  freelancerSigned: boolean;

  @Column({ nullable: true })
  freelancerSignedAt: Date;

  @Column({ default: false })
  isNdaSigned: boolean;

  @Column({ nullable: true })
  ndaUrl: string;

  @Column({ nullable: true })
  pauseReason: string;

  @Column({ nullable: true })
  cancellationReason: string;

  @Column({ nullable: true })
  completedAt: Date;

  @Column({ nullable: true })
  cancelledAt: Date;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 10 })
  platformFeePercent: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  platformFeeAmount: number;

  @OneToMany(() => Milestone, (milestone) => milestone.contract)
  milestones: Milestone[];

  @OneToMany(() => TimeLog, (timeLog) => timeLog.contract)
  timeLogs: TimeLog[];

  @OneToMany(() => Invoice, (invoice) => invoice.contract)
  invoices: Invoice[];

  @OneToMany(() => Dispute, (dispute) => dispute.contract)
  disputes: Dispute[];

  @OneToMany(() => Review, (review) => review.contract)
  reviews: Review[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
