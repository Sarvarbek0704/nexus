import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { StatsController } from "./stats.controller";
import { StatsService } from "./stats.service";
import { User } from "../../database/entities/user.entity";
import { Project } from "../../database/entities/project.entity";
import { Contract } from "../../database/entities/contract.entity";
import { Payment } from "../../database/entities/payment.entity";
import { Bid } from "../../database/entities/bid.entity";
import { Review } from "../../database/entities/review.entity";
import { Dispute } from "../../database/entities/dispute.entity";
import { FreelancerProfile } from "../../database/entities/freelancer-profile.entity";
import { AgencyProfile } from "../../database/entities/agency-profile.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Project,
      Contract,
      Payment,
      Bid,
      Review,
      Dispute,
      FreelancerProfile,
      AgencyProfile,
    ]),
  ],
  controllers: [StatsController],
  providers: [StatsService],
  exports: [StatsService],
})
export class StatsModule {}
