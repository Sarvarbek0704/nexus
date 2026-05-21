import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum NotificationType {
  BID_RECEIVED = 'bid_received',
  BID_ACCEPTED = 'bid_accepted',
  BID_REJECTED = 'bid_rejected',
  BID_SHORTLISTED = 'bid_shortlisted',
  CONTRACT_CREATED = 'contract_created',
  CONTRACT_SIGNED = 'contract_signed',
  CONTRACT_COMPLETED = 'contract_completed',
  CONTRACT_CANCELLED = 'contract_cancelled',
  MILESTONE_SUBMITTED = 'milestone_submitted',
  MILESTONE_APPROVED = 'milestone_approved',
  MILESTONE_REJECTED = 'milestone_rejected',
  MILESTONE_REVISION = 'milestone_revision',
  PAYMENT_RECEIVED = 'payment_received',
  PAYMENT_RELEASED = 'payment_released',
  ESCROW_FUNDED = 'escrow_funded',
  DISPUTE_OPENED = 'dispute_opened',
  DISPUTE_RESOLVED = 'dispute_resolved',
  DISPUTE_MESSAGE = 'dispute_message',
  REVIEW_RECEIVED = 'review_received',
  AGENCY_INVITE = 'agency_invite',
  AGENCY_INVITE_ACCEPTED = 'agency_invite_accepted',
  MESSAGE_RECEIVED = 'message_received',
  PROJECT_CLOSED = 'project_closed',
  PROFILE_VERIFIED = 'profile_verified',
  SYSTEM = 'system',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.notifications)
  @JoinColumn()
  user: User;

  @Column()
  userId: string;

  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  @Column()
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ nullable: true })
  link: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ default: false })
  isRead: boolean;

  @Column({ nullable: true })
  readAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  data: Record<string, any>;

  @Column({ nullable: true })
  relatedEntityId: string;

  @Column({ nullable: true })
  relatedEntityType: string;

  @CreateDateColumn()
  createdAt: Date;
}
