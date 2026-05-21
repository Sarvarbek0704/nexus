import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn, OneToMany,
  ManyToMany, JoinTable, Index,
} from 'typeorm';
import { User } from './user.entity';
import { ClientProfile } from './client-profile.entity';
import { Category } from './category.entity';
import { Skill } from './skill.entity';
import { Bid } from './bid.entity';
import { Contract } from './contract.entity';

export enum ProjectStatus {
  DRAFT = 'draft',
  OPEN = 'open',
  IN_REVIEW = 'in_review',
  IN_PROGRESS = 'in_progress',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  CLOSED = 'closed',
}

export enum ProjectType {
  FIXED = 'fixed',
  HOURLY = 'hourly',
}

export enum ProjectDuration {
  LESS_THAN_1_MONTH = 'less_than_1_month',
  ONE_TO_THREE_MONTHS = '1_to_3_months',
  THREE_TO_SIX_MONTHS = '3_to_6_months',
  MORE_THAN_SIX_MONTHS = 'more_than_6_months',
}

export enum ExperienceRequired {
  ENTRY = 'entry',
  INTERMEDIATE = 'intermediate',
  EXPERT = 'expert',
}

export enum ProjectVisibility {
  PUBLIC = 'public',
  INVITE_ONLY = 'invite_only',
  PRIVATE = 'private',
}

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'enum', enum: ProjectStatus, default: ProjectStatus.OPEN })
  status: ProjectStatus;

  @Column({ type: 'enum', enum: ProjectType, default: ProjectType.FIXED })
  type: ProjectType;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  budgetMin: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  budgetMax: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  hourlyRateMin: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  hourlyRateMax: number;

  @Column({ type: 'enum', enum: ProjectDuration, nullable: true })
  duration: ProjectDuration;

  @Column({ type: 'enum', enum: ExperienceRequired, default: ExperienceRequired.INTERMEDIATE })
  experienceRequired: ExperienceRequired;

  @Column({ type: 'enum', enum: ProjectVisibility, default: ProjectVisibility.PUBLIC })
  visibility: ProjectVisibility;

  @Column({ nullable: true })
  deadline: Date;

  @Column({ default: 0 })
  bidsCount: number;

  @Column({ default: 0 })
  viewsCount: number;

  @Column({ default: false })
  isFeatured: boolean;

  @Column({ default: false })
  isUrgent: boolean;

  @Column({ default: true })
  allowAgencyBids: boolean;

  @Column({ nullable: true })
  attachments: string;

  @Column({ type: 'jsonb', nullable: true })
  requirements: string[];

  @Column({ type: 'jsonb', nullable: true })
  questions: string[];

  @Column({ nullable: true })
  preferredLocation: string;

  @Column({ nullable: true })
  currency: string;

  @Column({ nullable: true })
  startDate: Date;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn()
  client: User;

  @Column()
  clientId: string;

  @ManyToOne(() => Category, (category) => category.projects)
  @JoinColumn()
  category: Category;

  @Column({ nullable: true })
  categoryId: string;

  @ManyToMany(() => Skill)
  @JoinTable({ name: 'project_skills' })
  skills: Skill[];

  @OneToMany(() => Bid, (bid) => bid.project)
  bids: Bid[];

  @OneToMany(() => Contract, (contract) => contract.project)
  contracts: Contract[];

  @Column({ nullable: true })
  selectedFreelancerId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  closedAt: Date;
}
