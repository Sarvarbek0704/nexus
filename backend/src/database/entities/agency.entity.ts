import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, OneToOne, JoinColumn, OneToMany, ManyToMany, JoinTable,
} from 'typeorm';
import { User } from './user.entity';
import { AgencyProfile } from './agency-profile.entity';
import { FreelancerProfile } from './freelancer-profile.entity';
import { AgencyMember } from './agency-member.entity';
import { Skill } from './skill.entity';

export enum AgencySize {
  SOLO = 'solo',
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
}

export enum AgencyStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_REVIEW = 'pending_review',
}

@Entity('agencies')
export class Agency {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ nullable: true })
  tagline: string;

  @Column({ nullable: true })
  logoUrl: string;

  @Column({ nullable: true })
  coverUrl: string;

  @Column({ nullable: true })
  website: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  timezone: string;

  @Column({ type: 'enum', enum: AgencySize, default: AgencySize.SMALL })
  size: AgencySize;

  @Column({ type: 'enum', enum: AgencyStatus, default: AgencyStatus.ACTIVE })
  status: AgencyStatus;

  @Column({ nullable: true })
  foundedYear: number;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ default: false })
  isFeatured: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  minimumProjectSize: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  hourlyRate: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  averageRating: number;

  @Column({ default: 0 })
  totalReviews: number;

  @Column({ default: 0 })
  totalProjectsCompleted: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalEarned: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  successRate: number;

  @Column({ type: 'jsonb', nullable: true })
  socialLinks: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };

  @Column()
  ownerId: string;

  @OneToOne(() => AgencyProfile, (profile) => profile.agency)
  agencyProfile: AgencyProfile;

  @OneToMany(() => FreelancerProfile, (fp) => fp.agency)
  members: FreelancerProfile[];

  @OneToMany(() => AgencyMember, (am) => am.agency)
  agencyMembers: AgencyMember[];

  @ManyToMany(() => Skill)
  @JoinTable({ name: 'agency_skills' })
  skills: Skill[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
