import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Agency } from './agency.entity';
import { User } from './user.entity';

export enum AgencyMemberRole {
  OWNER = 'owner',
  MANAGER = 'manager',
  MEMBER = 'member',
}

export enum AgencyMemberStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  REJECTED = 'rejected',
}

@Entity('agency_members')
export class AgencyMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Agency, (agency) => agency.agencyMembers)
  @JoinColumn()
  agency: Agency;

  @Column()
  agencyId: string;

  @ManyToOne(() => User)
  @JoinColumn()
  user: User;

  @Column()
  userId: string;

  @Column({ type: 'enum', enum: AgencyMemberRole, default: AgencyMemberRole.MEMBER })
  role: AgencyMemberRole;

  @Column({ type: 'enum', enum: AgencyMemberStatus, default: AgencyMemberStatus.PENDING })
  status: AgencyMemberStatus;

  @Column({ nullable: true })
  title: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  revenueShare: number;

  @Column({ nullable: true })
  invitedBy: string;

  @Column({ nullable: true })
  joinedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
