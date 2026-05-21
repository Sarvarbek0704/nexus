import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, OneToOne, JoinColumn, ManyToMany, JoinTable,
  OneToMany, ManyToOne,
} from 'typeorm';
import { User } from './user.entity';
import { Skill } from './skill.entity';
import { Agency } from './agency.entity';
import { Portfolio } from './portfolio.entity';

export enum ExperienceLevel {
  ENTRY = 'entry',
  INTERMEDIATE = 'intermediate',
  EXPERT = 'expert',
}

export enum AvailabilityStatus {
  AVAILABLE = 'available',
  PARTIALLY_AVAILABLE = 'partially_available',
  NOT_AVAILABLE = 'not_available',
}

@Entity('freelancer_profiles')
export class FreelancerProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, (user) => user.freelancerProfile)
  @JoinColumn()
  user: User;

  @Column()
  userId: string;

  @Column({ nullable: true })
  title: string;

  @Column({ nullable: true, type: 'text' })
  overview: string;

  @Column({ type: 'enum', enum: ExperienceLevel, default: ExperienceLevel.INTERMEDIATE })
  experienceLevel: ExperienceLevel;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  hourlyRate: number;

  @Column({ nullable: true })
  currency: string;

  @Column({ type: 'enum', enum: AvailabilityStatus, default: AvailabilityStatus.AVAILABLE })
  availability: AvailabilityStatus;

  @Column({ default: 40 })
  hoursPerWeek: number;

  @Column({ default: 0 })
  totalJobsCompleted: number;

  @Column({ default: 0 })
  totalEarned: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  successRate: number;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ default: false })
  isTopRated: boolean;

  @Column({ default: false })
  isRising: boolean;

  @Column({ nullable: true })
  languages: string;

  @Column({ type: 'jsonb', nullable: true })
  education: Array<{
    institution: string;
    degree: string;
    field: string;
    from: number;
    to: number;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  certifications: Array<{
    name: string;
    issuer: string;
    year: number;
    url?: string;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  employmentHistory: Array<{
    company: string;
    title: string;
    from: Date;
    to: Date;
    description: string;
  }>;

  @Column({ nullable: true })
  resumeUrl: string;

  @Column({ default: 0 })
  profileViews: number;

  @Column({ default: 0 })
  responseTime: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  responseRate: number;

  @ManyToMany(() => Skill, { eager: true })
  @JoinTable({ name: 'freelancer_skills' })
  skills: Skill[];

  @ManyToOne(() => Agency, (agency) => agency.members, { nullable: true })
  agency: Agency;

  @Column({ nullable: true })
  agencyId: string;

  @OneToMany(() => Portfolio, (portfolio) => portfolio.freelancerProfile)
  portfolioItems: Portfolio[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
