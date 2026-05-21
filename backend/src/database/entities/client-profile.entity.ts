import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, OneToOne, JoinColumn, OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { Project } from './project.entity';

export enum ClientType {
  INDIVIDUAL = 'individual',
  COMPANY = 'company',
  AGENCY = 'agency',
}

@Entity('client_profiles')
export class ClientProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, (user) => user.clientProfile)
  @JoinColumn()
  user: User;

  @Column()
  userId: string;

  @Column({ type: 'enum', enum: ClientType, default: ClientType.INDIVIDUAL })
  clientType: ClientType;

  @Column({ nullable: true })
  companyName: string;

  @Column({ nullable: true })
  companySize: string;

  @Column({ nullable: true })
  industry: string;

  @Column({ nullable: true })
  website: string;

  @Column({ nullable: true })
  companyDescription: string;

  @Column({ nullable: true })
  logoUrl: string;

  @Column({ nullable: true })
  taxId: string;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ default: 0 })
  totalProjectsPosted: number;

  @Column({ default: 0 })
  totalProjectsCompleted: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalSpent: number;

  @Column({ default: 0 })
  hireRate: number;

  @Column({ nullable: true })
  paymentMethod: string;

  @Column({ default: false })
  isPaymentVerified: boolean;

  @Column({ nullable: true })
  preferredContractType: string;

  @OneToMany(() => Project, (project) => project.client)
  projects: Project[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
