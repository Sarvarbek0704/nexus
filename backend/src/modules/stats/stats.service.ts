import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { User, UserRole } from "../../database/entities/user.entity";
import { Project, ProjectStatus } from "../../database/entities/project.entity";
import {
  Contract,
  ContractStatus,
} from "../../database/entities/contract.entity";
import {
  Payment,
  PaymentType,
  PaymentStatus,
} from "../../database/entities/payment.entity";
import { Bid, BidStatus } from "../../database/entities/bid.entity";
import { Review } from "../../database/entities/review.entity";
import { Dispute, DisputeStatus } from "../../database/entities/dispute.entity";
import { FreelancerProfile } from "../../database/entities/freelancer-profile.entity";
import { AgencyProfile } from "../../database/entities/agency-profile.entity";

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Project) private projectRepo: Repository<Project>,
    @InjectRepository(Contract) private contractRepo: Repository<Contract>,
    @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
    @InjectRepository(Bid) private bidRepo: Repository<Bid>,
    @InjectRepository(Review) private reviewRepo: Repository<Review>,
    @InjectRepository(Dispute) private disputeRepo: Repository<Dispute>,
    @InjectRepository(FreelancerProfile)
    private freelancerProfileRepo: Repository<FreelancerProfile>,
    @InjectRepository(AgencyProfile)
    private agencyProfileRepo: Repository<AgencyProfile>,
  ) {}

  async getPlatformStats() {
    const [
      totalUsers,
      totalProjects,
      activeProjects,
      completedProjects,
      totalContracts,
      activeContracts,
    ] = await Promise.all([
      this.userRepo.count(),
      this.projectRepo.count(),
      this.projectRepo.count({ where: { status: ProjectStatus.OPEN } }),
      this.projectRepo.count({ where: { status: ProjectStatus.COMPLETED } }),
      this.contractRepo.count(),
      this.contractRepo.count({ where: { status: ContractStatus.ACTIVE } }),
    ]);

    const totalRevenue = await this.paymentRepo
      .createQueryBuilder("p")
      .where("p.type = :type AND p.status = :status", {
        type: PaymentType.PLATFORM_FEE,
        status: PaymentStatus.COMPLETED,
      })
      .select("SUM(p.amount)", "total")
      .getRawOne();

    const totalTransactionVolume = await this.paymentRepo
      .createQueryBuilder("p")
      .where("p.type = :type AND p.status = :status", {
        type: PaymentType.MILESTONE_PAYMENT,
        status: PaymentStatus.COMPLETED,
      })
      .select("SUM(p.amount)", "total")
      .getRawOne();

    const monthlyStats = await this.getMonthlyStats();
    const totalPaidOut = await this.paymentRepo
      .createQueryBuilder("p")
      .where("p.type = :type AND p.status = :status", {
        type: PaymentType.MILESTONE_PAYMENT,
        status: PaymentStatus.COMPLETED,
      })
      .select("COALESCE(SUM(p.netAmount), 0)", "total")
      .getRawOne();

    const totalFreelancers = await this.userRepo.count({
      where: { role: UserRole.FREELANCER },
    });
    const verifiedFreelancers = await this.freelancerProfileRepo.count({
      where: { isVerified: true },
    });
    const totalAgencies = await this.userRepo.count({
      where: { role: UserRole.AGENCY_OWNER },
    });
    const verifiedAgencies = await this.agencyProfileRepo.count();
    const openDisputes = await this.disputeRepo.count({
      where: {
        status: In([
          DisputeStatus.OPEN,
          DisputeStatus.UNDER_REVIEW,
          DisputeStatus.AWAITING_RESPONSE,
          DisputeStatus.MEDIATION,
          DisputeStatus.ESCALATED,
        ]),
      },
    });

    const totalRevenueValue = totalRevenue?.total
      ? parseFloat(totalRevenue.total)
      : 0;
    const totalVolumeValue = totalTransactionVolume?.total
      ? parseFloat(totalTransactionVolume.total)
      : 0;
    const totalPaidOutValue = totalPaidOut?.total
      ? parseFloat(totalPaidOut.total)
      : 0;
    const newUsersThisMonth = await this.getUsersThisMonth();

    return {
      totalUsers,
      newUsersThisMonth,
      totalProjects,
      activeProjects,
      completedProjects,
      totalContracts,
      activeContracts,
      platformRevenue: totalRevenueValue,
      totalTransactionVolume: totalVolumeValue,
      totalPaidOut: totalPaidOutValue,
      totalFreelancers,
      verifiedFreelancers,
      totalAgencies,
      verifiedAgencies,
      openDisputes,
      monthlyGrowth: await this.getMonthlyUserGrowth(),
      monthlyRevenue: await this.getMonthlyRevenueBreakdown(),
      users: {
        total: totalUsers,
        newThisMonth: newUsersThisMonth,
      },
      projects: {
        total: totalProjects,
        active: activeProjects,
        completed: completedProjects,
      },
      contracts: {
        total: totalContracts,
        active: activeContracts,
      },
      financial: {
        totalRevenue: totalRevenueValue,
        totalTransactionVolume: totalVolumeValue,
      },
      monthlyStats,
    };
  }

  async getUserStats(userId: string) {
    const [
      totalBids,
      acceptedBids,
      totalContracts,
      completedContracts,
      totalPostedProjects,
    ] = await Promise.all([
      this.bidRepo.count({ where: { bidderId: userId } }),
      this.bidRepo.count({
        where: { bidderId: userId, status: BidStatus.ACCEPTED },
      }),
      this.contractRepo.count({
        where: [{ clientId: userId }, { freelancerId: userId }],
      }),
      this.contractRepo.count({
        where: [
          { clientId: userId, status: ContractStatus.COMPLETED },
          { freelancerId: userId, status: ContractStatus.COMPLETED },
        ],
      }),
      this.projectRepo.count({ where: { clientId: userId } }),
    ]);

    const earningsStats = await this.paymentRepo
      .createQueryBuilder("p")
      .where("p.payeeId = :userId AND p.type = :type AND p.status = :status", {
        userId,
        type: PaymentType.MILESTONE_PAYMENT,
        status: PaymentStatus.COMPLETED,
      })
      .select([
        "SUM(p.netAmount) as totalEarnings",
        "AVG(p.netAmount) as avgPayment",
        "COUNT(*) as totalPayments",
      ])
      .getRawOne();

    const spentStats = await this.paymentRepo
      .createQueryBuilder("p")
      .where("p.payerId = :userId AND p.type = :type AND p.status = :status", {
        userId,
        type: PaymentType.MILESTONE_PAYMENT,
        status: PaymentStatus.COMPLETED,
      })
      .select("SUM(p.amount) as totalSpent")
      .getRawOne();

    const monthlyEarnings = await this.getMonthlyEarnings(userId);

    return {
      bids: {
        total: totalBids,
        accepted: acceptedBids,
        successRate:
          totalBids > 0 ? Math.round((acceptedBids / totalBids) * 100) : 0,
      },
      contracts: {
        total: totalContracts,
        completed: completedContracts,
      },
      projects: {
        posted: totalPostedProjects,
      },
      earnings: {
        total: parseFloat(earningsStats.totalearnings) || 0,
        average: parseFloat(earningsStats.avgpayment) || 0,
        totalPayments: parseInt(earningsStats.totalpayments) || 0,
      },
      spending: {
        total: parseFloat(spentStats.totalspent) || 0,
      },
      monthlyEarnings,
    };
  }

  private async getMonthlyStats() {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      const [projects, contracts, revenue] = await Promise.all([
        this.projectRepo
          .createQueryBuilder("p")
          .where(
            "EXTRACT(YEAR FROM p.createdAt) = :year AND EXTRACT(MONTH FROM p.createdAt) = :month",
            { year, month },
          )
          .getCount(),
        this.contractRepo
          .createQueryBuilder("c")
          .where(
            "EXTRACT(YEAR FROM c.createdAt) = :year AND EXTRACT(MONTH FROM c.createdAt) = :month",
            { year, month },
          )
          .getCount(),
        this.paymentRepo
          .createQueryBuilder("p")
          .where(
            "EXTRACT(YEAR FROM p.createdAt) = :year AND EXTRACT(MONTH FROM p.createdAt) = :month AND p.type = :type AND p.status = :status",
            {
              year,
              month,
              type: PaymentType.PLATFORM_FEE,
              status: PaymentStatus.COMPLETED,
            },
          )
          .select("COALESCE(SUM(p.amount), 0)", "total")
          .getRawOne(),
      ]);

      months.push({
        month: `${year}-${String(month).padStart(2, "0")}`,
        projects,
        contracts,
        revenue: parseFloat(revenue.total) || 0,
      });
    }
    return months;
  }

  private async getMonthlyUserGrowth() {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      const users = await this.userRepo
        .createQueryBuilder("u")
        .where(
          "EXTRACT(YEAR FROM u.createdAt) = :year AND EXTRACT(MONTH FROM u.createdAt) = :month",
          { year, month },
        )
        .getCount();

      months.push({
        month: `${year}-${String(month).padStart(2, "0")}`,
        users,
      });
    }
    return months;
  }

  private async getMonthlyRevenueBreakdown() {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      const [fees, volume] = await Promise.all([
        this.paymentRepo
          .createQueryBuilder("p")
          .where(
            "EXTRACT(YEAR FROM p.createdAt) = :year AND EXTRACT(MONTH FROM p.createdAt) = :month AND p.type = :type AND p.status = :status",
            {
              year,
              month,
              type: PaymentType.PLATFORM_FEE,
              status: PaymentStatus.COMPLETED,
            },
          )
          .select("COALESCE(SUM(p.amount), 0)", "total")
          .getRawOne(),
        this.paymentRepo
          .createQueryBuilder("p")
          .where(
            "EXTRACT(YEAR FROM p.createdAt) = :year AND EXTRACT(MONTH FROM p.createdAt) = :month AND p.type = :type AND p.status = :status",
            {
              year,
              month,
              type: PaymentType.MILESTONE_PAYMENT,
              status: PaymentStatus.COMPLETED,
            },
          )
          .select("COALESCE(SUM(p.amount), 0)", "total")
          .getRawOne(),
      ]);

      months.push({
        month: `${year}-${String(month).padStart(2, "0")}`,
        fees: parseFloat(fees.total) || 0,
        volume: parseFloat(volume.total) || 0,
      });
    }
    return months;
  }

  private async getMonthlyEarnings(userId: string) {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      const earnings = await this.paymentRepo
        .createQueryBuilder("p")
        .where(
          "p.payeeId = :userId AND EXTRACT(YEAR FROM p.createdAt) = :year AND EXTRACT(MONTH FROM p.createdAt) = :month AND p.type = :type AND p.status = :status",
          {
            userId,
            year,
            month,
            type: PaymentType.MILESTONE_PAYMENT,
            status: PaymentStatus.COMPLETED,
          },
        )
        .select("COALESCE(SUM(p.netAmount), 0)", "total")
        .getRawOne();

      months.push({
        month: `${year}-${String(month).padStart(2, "0")}`,
        earnings: parseFloat(earnings.total) || 0,
      });
    }
    return months;
  }

  private async getUsersThisMonth() {
    const now = new Date();
    return this.userRepo
      .createQueryBuilder("u")
      .where(
        "EXTRACT(YEAR FROM u.createdAt) = :year AND EXTRACT(MONTH FROM u.createdAt) = :month",
        { year: now.getFullYear(), month: now.getMonth() + 1 },
      )
      .getCount();
  }
}
