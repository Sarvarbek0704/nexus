import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, OneToOne, OneToMany, Index,
} from 'typeorm';
import { FreelancerProfile } from './freelancer-profile.entity';
import { ClientProfile } from './client-profile.entity';
import { AgencyProfile } from './agency-profile.entity';
import { Notification } from './notification.entity';
import { Message } from './message.entity';
import { Review } from './review.entity';

export enum UserRole {
  CLIENT = 'client',
  FREELANCER = 'freelancer',
  AGENCY_OWNER = 'agency_owner',
  ADMIN = 'admin',
}

export enum AuthProvider {
  LOCAL = 'local',
  GOOGLE = 'google',
  GITHUB = 'github',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ unique: true })
  email: string;

  @Column({ nullable: true, select: false })
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Index()
  @Column({ unique: true, nullable: true })
  username: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  timezone: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.FREELANCER })
  role: UserRole;

  @Column({ type: 'enum', enum: AuthProvider, default: AuthProvider.LOCAL })
  provider: AuthProvider;

  @Column({ nullable: true })
  providerId: string;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({ nullable: true, select: false })
  emailVerificationToken: string;

  @Column({ nullable: true, select: false })
  otpCode: string;

  @Column({ nullable: true, select: false })
  otpExpires: Date;

  @Column({ nullable: true, select: false })
  passwordResetToken: string;

  @Column({ nullable: true, select: false })
  passwordResetExpires: Date;

  @Column({ nullable: true, select: false })
  refreshToken: string;

  @Column({ nullable: true })
  lastLoginAt: Date;

  @Column({ default: 0 })
  loginCount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  walletBalance: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  escrowBalance: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  averageRating: number;

  @Column({ default: 0 })
  totalReviews: number;

  @Column({ default: false })
  isFeatured: boolean;

  @Column({ default: false })
  isDemo: boolean;

  @Column({ nullable: true })
  bio: string;

  @Column({ type: 'jsonb', nullable: true })
  socialLinks: {
    linkedin?: string;
    github?: string;
    twitter?: string;
    website?: string;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => FreelancerProfile, (profile) => profile.user, { cascade: true })
  freelancerProfile: FreelancerProfile;

  @OneToOne(() => ClientProfile, (profile) => profile.user, { cascade: true })
  clientProfile: ClientProfile;

  @OneToOne(() => AgencyProfile, (profile) => profile.user, { cascade: true })
  agencyProfile: AgencyProfile;

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];

  @OneToMany(() => Message, (message) => message.sender)
  sentMessages: Message[];

  @OneToMany(() => Review, (review) => review.reviewer)
  givenReviews: Review[];

  @OneToMany(() => Review, (review) => review.reviewee)
  receivedReviews: Review[];

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
