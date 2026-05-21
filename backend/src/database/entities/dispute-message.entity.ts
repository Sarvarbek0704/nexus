import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { Dispute } from './dispute.entity';
import { User } from './user.entity';

export enum DisputeMessageSender {
  CLAIMANT = 'claimant',
  RESPONDENT = 'respondent',
  MEDIATOR = 'mediator',
  SYSTEM = 'system',
}

@Entity('dispute_messages')
export class DisputeMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Dispute, (dispute) => dispute.messages)
  @JoinColumn()
  dispute: Dispute;

  @Column()
  disputeId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn()
  sender: User;

  @Column({ nullable: true })
  senderId: string;

  @Column({ type: 'enum', enum: DisputeMessageSender })
  senderType: DisputeMessageSender;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'jsonb', nullable: true })
  attachments: string[];

  @Column({ default: false })
  isInternal: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
