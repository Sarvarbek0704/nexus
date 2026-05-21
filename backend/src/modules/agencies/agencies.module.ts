import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgenciesController } from './agencies.controller';
import { AgenciesService } from './agencies.service';
import { Agency } from '../../database/entities/agency.entity';
import { AgencyMember } from '../../database/entities/agency-member.entity';
import { AgencyProfile } from '../../database/entities/agency-profile.entity';
import { User } from '../../database/entities/user.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Agency, AgencyMember, AgencyProfile, User]),
    NotificationsModule,
  ],
  controllers: [AgenciesController],
  providers: [AgenciesService],
  exports: [AgenciesService],
})
export class AgenciesModule {}
