import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from '../../database/entities/user.entity';
import { FreelancerProfile } from '../../database/entities/freelancer-profile.entity';
import { ClientProfile } from '../../database/entities/client-profile.entity';
import { Portfolio } from '../../database/entities/portfolio.entity';
import { Skill } from '../../database/entities/skill.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, FreelancerProfile, ClientProfile, Portfolio, Skill])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
