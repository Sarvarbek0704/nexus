import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DisputesController } from './disputes.controller';
import { DisputesService } from './disputes.service';
import { Dispute } from '../../database/entities/dispute.entity';
import { DisputeMessage } from '../../database/entities/dispute-message.entity';
import { Contract } from '../../database/entities/contract.entity';
import { User } from '../../database/entities/user.entity';
import { Payment } from '../../database/entities/payment.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Dispute, DisputeMessage, Contract, User, Payment]),
    NotificationsModule,
  ],
  controllers: [DisputesController],
  providers: [DisputesService],
  exports: [DisputesService],
})
export class DisputesModule {}
