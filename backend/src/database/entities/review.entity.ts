import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Contract } from './contract.entity';
import { Project } from './project.entity';

export enum ReviewType {
  CLIENT_TO_FREELANCER = 'client_to_freelancer',
  FREELANCER_TO_CLIENT = 'freelancer_to_client',
}

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.givenReviews)
  @JoinColumn({ name: 'reviewerId' })
  reviewer: User;

  @Column()
  reviewerId: string;

  @ManyToOne(() => User, (user) => user.receivedReviews)
  @JoinColumn({ name: 'revieweeId' })
  reviewee: User;

  @Column()
  revieweeId: string;

  @ManyToOne(() => Contract, (contract) => contract.reviews)
  @JoinColumn()
  contract: Contract;

  @Column()
  contractId: string;

  @ManyToOne(() => Project, { nullable: true })
  @JoinColumn()
  project: Project;

  @Column({ nullable: true })
  projectId: string;

  @Column({ type: 'enum', enum: ReviewType })
  type: ReviewType;

  @Column({ type: 'decimal', precision: 3, scale: 2 })
  overallRating: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  communicationRating: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  qualityRating: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  timelinessRating: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  cooperationRating: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  skillRating: number;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @Column({ nullable: true })
  response: string;

  @Column({ nullable: true })
  respondedAt: Date;

  @Column({ default: false })
  isPublic: boolean;

  @Column({ default: false })
  isFeatured: boolean;

  @Column({ default: 0 })
  helpfulCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
