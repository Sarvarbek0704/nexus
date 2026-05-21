import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, OneToOne, JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Agency } from './agency.entity';

@Entity('agency_profiles')
export class AgencyProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, (user) => user.agencyProfile)
  @JoinColumn()
  user: User;

  @Column()
  userId: string;

  @OneToOne(() => Agency, (agency) => agency.agencyProfile)
  @JoinColumn()
  agency: Agency;

  @Column()
  agencyId: string;

  @Column({ type: 'jsonb', nullable: true })
  specializations: string[];

  @Column({ type: 'jsonb', nullable: true })
  clientTestimonials: Array<{
    clientName: string;
    text: string;
    rating: number;
    projectName: string;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  awards: Array<{
    name: string;
    year: number;
    issuer: string;
  }>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
