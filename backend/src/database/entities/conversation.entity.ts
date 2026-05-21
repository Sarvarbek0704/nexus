import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToMany, JoinTable, OneToMany, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Message } from './message.entity';
import { Project } from './project.entity';

export enum ConversationType {
  DIRECT = 'direct',
  PROJECT = 'project',
  CONTRACT = 'contract',
  SUPPORT = 'support',
}

@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: ConversationType, default: ConversationType.DIRECT })
  type: ConversationType;

  @Column({ nullable: true })
  title: string;

  @ManyToMany(() => User)
  @JoinTable({ name: 'conversation_participants' })
  participants: User[];

  @ManyToOne(() => Project, { nullable: true })
  @JoinColumn()
  project: Project;

  @Column({ nullable: true })
  projectId: string;

  @Column({ nullable: true })
  relatedEntityId: string;

  @Column({ nullable: true })
  lastMessageAt: Date;

  @Column({ nullable: true })
  lastMessage: string;

  @Column({ default: false })
  isArchived: boolean;

  @OneToMany(() => Message, (message) => message.conversation)
  messages: Message[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
