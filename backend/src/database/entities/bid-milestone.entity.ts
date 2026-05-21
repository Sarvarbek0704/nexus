import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn,
} from 'typeorm';
import { Bid } from './bid.entity';

@Entity('bid_milestones')
export class BidMilestone {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Bid, (bid) => bid.milestones)
  @JoinColumn()
  bid: Bid;

  @Column()
  bidId: string;

  @Column()
  title: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ nullable: true })
  dueDate: Date;

  @Column({ default: 0 })
  sortOrder: number;
}
