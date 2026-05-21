import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Contract } from './contract.entity';

export enum TimeLogStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  DISPUTED = 'disputed',
  BILLED = 'billed',
}

@Entity('time_logs')
export class TimeLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Contract, (contract) => contract.timeLogs)
  @JoinColumn()
  contract: Contract;

  @Column()
  contractId: string;

  @ManyToOne(() => User)
  @JoinColumn()
  freelancer: User;

  @Column()
  freelancerId: string;

  @Column()
  date: Date;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  hours: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: TimeLogStatus, default: TimeLogStatus.PENDING })
  status: TimeLogStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  hourlyRate: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  totalAmount: number;

  @Column({ nullable: true })
  approvedAt: Date;

  @Column({ nullable: true })
  approvedBy: string;

  @Column({ nullable: true })
  disputeReason: string;

  @Column({ type: 'jsonb', nullable: true })
  screenshots: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
