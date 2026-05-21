import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { Milestone } from './milestone.entity';

export enum SubmissionStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  REVISION_REQUESTED = 'revision_requested',
}

@Entity('milestone_submissions')
export class MilestoneSubmission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Milestone, (milestone) => milestone.submissions)
  @JoinColumn()
  milestone: Milestone;

  @Column()
  milestoneId: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  attachments: string[];

  @Column({ type: 'jsonb', nullable: true })
  deliverableLinks: string[];

  @Column({ type: 'enum', enum: SubmissionStatus, default: SubmissionStatus.PENDING })
  status: SubmissionStatus;

  @Column({ nullable: true })
  clientFeedback: string;

  @Column({ nullable: true })
  reviewedAt: Date;

  @Column({ default: 1 })
  revisionNumber: number;

  @CreateDateColumn()
  createdAt: Date;
}
