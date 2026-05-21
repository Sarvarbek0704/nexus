import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn, OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { Project } from './project.entity';
import { Agency } from './agency.entity';
import { BidMilestone } from './bid-milestone.entity';

export enum BidStatus {
  PENDING = 'pending',
  SHORTLISTED = 'shortlisted',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn',
  EXPIRED = 'expired',
}

export enum BidType {
  FREELANCER = 'freelancer',
  AGENCY = 'agency',
}

@Entity('bids')
export class Bid {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Project, (project) => project.bids)
  @JoinColumn()
  project: Project;

  @Column()
  projectId: string;

  @ManyToOne(() => User)
  @JoinColumn()
  bidder: User;

  @Column()
  bidderId: string;

  @ManyToOne(() => Agency, { nullable: true })
  @JoinColumn()
  agency: Agency;

  @Column({ nullable: true })
  agencyId: string;

  @Column({ type: 'enum', enum: BidType, default: BidType.FREELANCER })
  bidType: BidType;

  @Column({ type: 'enum', enum: BidStatus, default: BidStatus.PENDING })
  status: BidStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ nullable: true })
  currency: string;

  @Column({ nullable: true })
  deliveryTime: number;

  @Column({ nullable: true })
  deliveryUnit: string;

  @Column({ type: 'text' })
  coverLetter: string;

  @Column({ type: 'jsonb', nullable: true })
  questionAnswers: Array<{
    question: string;
    answer: string;
  }>;

  @Column({ nullable: true })
  attachments: string;

  @Column({ nullable: true })
  expiresAt: Date;

  @Column({ nullable: true })
  clientNote: string;

  @Column({ default: false })
  isInvited: boolean;

  @Column({ default: false })
  isBoosted: boolean;

  @Column({ nullable: true })
  rejectionReason: string;

  @Column({ nullable: true })
  acceptedAt: Date;

  @Column({ nullable: true })
  rejectedAt: Date;

  @OneToMany(() => BidMilestone, (bm) => bm.bid)
  milestones: BidMilestone[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
