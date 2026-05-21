import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn, ManyToMany, JoinTable,
} from 'typeorm';
import { FreelancerProfile } from './freelancer-profile.entity';
import { Skill } from './skill.entity';

@Entity('portfolios')
export class Portfolio {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => FreelancerProfile, (fp) => fp.portfolioItems)
  @JoinColumn()
  freelancerProfile: FreelancerProfile;

  @Column()
  freelancerProfileId: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  projectUrl: string;

  @Column({ nullable: true })
  repositoryUrl: string;

  @Column({ type: 'jsonb', nullable: true })
  images: string[];

  @Column({ nullable: true })
  thumbnailUrl: string;

  @Column({ nullable: true })
  client: string;

  @Column({ nullable: true })
  completedAt: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  projectValue: number;

  @Column({ nullable: true })
  duration: string;

  @ManyToMany(() => Skill)
  @JoinTable({ name: 'portfolio_skills' })
  skills: Skill[];

  @Column({ default: true })
  isPublic: boolean;

  @Column({ default: 0 })
  likesCount: number;

  @Column({ default: 0 })
  viewsCount: number;

  @Column({ default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
