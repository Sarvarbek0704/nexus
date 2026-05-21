import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BidsController } from './bids.controller';
import { BidsService } from './bids.service';
import { Bid } from '../../database/entities/bid.entity';
import { BidMilestone } from '../../database/entities/bid-milestone.entity';
import { Project } from '../../database/entities/project.entity';
import { Contract } from '../../database/entities/contract.entity';
import { Milestone } from '../../database/entities/milestone.entity';
import { User } from '../../database/entities/user.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Bid, BidMilestone, Project, Contract, Milestone, User]),
    NotificationsModule,
  ],
  controllers: [BidsController],
  providers: [BidsService],
  exports: [BidsService],
})
export class BidsModule {}
