import {
  Injectable, NotFoundException, ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In, ILike, Between, FindOptionsWhere } from 'typeorm';
import { Project, ProjectStatus, ProjectType } from '../../database/entities/project.entity';
import { Skill } from '../../database/entities/skill.entity';
import { Category } from '../../database/entities/category.entity';
import { User, UserRole } from '../../database/entities/user.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { QueryProjectDto } from './dto/query-project.dto';
import { getPagination, paginatedResponse } from '../../common/utils/pagination.util';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../../database/entities/notification.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project) private projectRepo: Repository<Project>,
    @InjectRepository(Skill) private skillRepo: Repository<Skill>,
    @InjectRepository(Category) private categoryRepo: Repository<Category>,
    private dataSource: DataSource,
    private notificationsService: NotificationsService,
  ) {}

  async create(clientId: string, dto: CreateProjectDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const project = queryRunner.manager.create(Project, {
        ...dto,
        clientId,
        status: ProjectStatus.OPEN,
        deadline: dto.deadline ? new Date(dto.deadline) : null,
      });

      if (dto.skillIds?.length) {
        const skills = await this.skillRepo.findBy({ id: In(dto.skillIds) });
        project.skills = skills;
        await this.skillRepo.increment({ id: In(dto.skillIds) }, 'usageCount', 1);
      }

      if (dto.categoryId) {
        await this.categoryRepo.increment({ id: dto.categoryId }, 'projectCount', 1);
      }

      await queryRunner.manager.save(project);
      await queryRunner.commitTransaction();

      return this.findOne(project.id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(query: QueryProjectDto) {
    const { skip, take, page, limit } = getPagination(query);

    const qb = this.projectRepo
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.category', 'category')
      .leftJoinAndSelect('project.skills', 'skills')
      .leftJoinAndSelect('project.client', 'client')
      .leftJoinAndSelect('client.clientProfile', 'clientProfile')
      .where('project.status = :status', { status: ProjectStatus.OPEN })
      .andWhere('project.visibility = :visibility', { visibility: 'public' });

    if (query.search) {
      qb.andWhere(
        '(project.title ILIKE :search OR project.description ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.categoryId) qb.andWhere('project.categoryId = :categoryId', { categoryId: query.categoryId });
    if (query.type) qb.andWhere('project.type = :type', { type: query.type });
    if (query.duration) qb.andWhere('project.duration = :duration', { duration: query.duration });
    if (query.experienceRequired) qb.andWhere('project.experienceRequired = :exp', { exp: query.experienceRequired });
    if (query.isUrgent !== undefined) qb.andWhere('project.isUrgent = :isUrgent', { isUrgent: query.isUrgent });
    if (query.isFeatured !== undefined) qb.andWhere('project.isFeatured = :isFeatured', { isFeatured: query.isFeatured });
    if (query.location) qb.andWhere('project.preferredLocation ILIKE :loc', { loc: `%${query.location}%` });

    if (query.budgetMin) qb.andWhere('project.budgetMin >= :budgetMin', { budgetMin: query.budgetMin });
    if (query.budgetMax) qb.andWhere('project.budgetMax <= :budgetMax', { budgetMax: query.budgetMax });

    if (query.skills) {
      const skillNames = query.skills.split(',').map((s) => s.trim());
      qb.andWhere('skills.name IN (:...skillNames)', { skillNames });
    }

    const sortField = ['createdAt', 'budgetMax', 'bidsCount', 'viewsCount'].includes(query.sortBy)
      ? `project.${query.sortBy}`
      : 'project.createdAt';
    qb.orderBy(sortField, query.sortOrder || 'DESC');

    qb.skip(skip).take(take);

    const [data, total] = await qb.getManyAndCount();
    return paginatedResponse(data, total, page, limit);
  }

  async findOne(id: string) {
    const project = await this.projectRepo.findOne({
      where: { id },
      relations: ['category', 'skills', 'client', 'client.clientProfile', 'bids'],
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async findOneAndIncrementView(id: string, userId?: string) {
    const project = await this.findOne(id);
    if (userId !== project.clientId) {
      await this.projectRepo.increment({ id }, 'viewsCount', 1);
    }
    return project;
  }

  async adminFindAll(query: any) {
    const { skip, take, page, limit } = getPagination(query);

    const qb = this.projectRepo
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.category', 'category')
      .leftJoinAndSelect('project.client', 'client')
      .orderBy('project.createdAt', 'DESC');

    if (query.search) {
      qb.andWhere(
        '(project.title ILIKE :search OR project.description ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }
    if (query.status) qb.andWhere('project.status = :status', { status: query.status });

    qb.skip(skip).take(take);
    const [data, total] = await qb.getManyAndCount();
    return paginatedResponse(data, total, page, limit);
  }

  async update(id: string, userId: string, dto: Partial<CreateProjectDto>) {
    const project = await this.findOne(id);
    if (project.clientId !== userId) throw new ForbiddenException('Not your project');

    if ([ProjectStatus.IN_PROGRESS, ProjectStatus.COMPLETED].includes(project.status)) {
      throw new BadRequestException('Cannot edit project in current status');
    }

    if (dto.skillIds) {
      const skills = await this.skillRepo.findBy({ id: In(dto.skillIds) });
      project.skills = skills;
    }

    Object.assign(project, dto);
    if (dto.deadline) project.deadline = new Date(dto.deadline);

    return this.projectRepo.save(project);
  }

  async updateStatus(id: string, userId: string, userRole: UserRole, status: ProjectStatus, reason?: string) {
    const project = await this.findOne(id);

    if (userRole !== UserRole.ADMIN && project.clientId !== userId) {
      throw new ForbiddenException('Not authorized');
    }

    const allowedTransitions: Record<ProjectStatus, ProjectStatus[]> = {
      [ProjectStatus.DRAFT]: [ProjectStatus.OPEN, ProjectStatus.CANCELLED],
      [ProjectStatus.OPEN]: [ProjectStatus.IN_REVIEW, ProjectStatus.PAUSED, ProjectStatus.CLOSED, ProjectStatus.CANCELLED],
      [ProjectStatus.IN_REVIEW]: [ProjectStatus.OPEN, ProjectStatus.IN_PROGRESS],
      [ProjectStatus.IN_PROGRESS]: [ProjectStatus.PAUSED, ProjectStatus.COMPLETED, ProjectStatus.CANCELLED],
      [ProjectStatus.PAUSED]: [ProjectStatus.IN_PROGRESS, ProjectStatus.CANCELLED],
      [ProjectStatus.COMPLETED]: [],
      [ProjectStatus.CANCELLED]: [],
      [ProjectStatus.CLOSED]: [],
    };

    if (!allowedTransitions[project.status]?.includes(status)) {
      throw new BadRequestException(
        `Cannot transition from ${project.status} to ${status}`,
      );
    }

    await this.projectRepo.update(id, {
      status,
      ...(status === ProjectStatus.CLOSED ? { closedAt: new Date() } : {}),
    });

    return this.findOne(id);
  }

  async getClientProjects(clientId: string, query: QueryProjectDto) {
    const { skip, take, page, limit } = getPagination(query);

    const [data, total] = await this.projectRepo.findAndCount({
      where: { clientId },
      relations: ['category', 'skills', 'bids'],
      order: { createdAt: 'DESC' },
      skip,
      take,
    });

    return paginatedResponse(data, total, page, limit);
  }

  async getProjectStats(projectId: string, userId: string) {
    const project = await this.findOne(projectId);
    if (project.clientId !== userId) throw new ForbiddenException();

    const bidsStats = await this.projectRepo
      .createQueryBuilder('project')
      .leftJoin('project.bids', 'bid')
      .where('project.id = :id', { id: projectId })
      .select([
        'COUNT(bid.id) as totalBids',
        'AVG(bid.amount) as avgBidAmount',
        'MIN(bid.amount) as minBidAmount',
        'MAX(bid.amount) as maxBidAmount',
        'COUNT(CASE WHEN bid.status = \'shortlisted\' THEN 1 END) as shortlisted',
      ])
      .getRawOne();

    return {
      project,
      stats: {
        totalBids: parseInt(bidsStats.totalbids) || 0,
        avgBidAmount: parseFloat(bidsStats.avgbidamount) || 0,
        minBidAmount: parseFloat(bidsStats.minbidamount) || 0,
        maxBidAmount: parseFloat(bidsStats.maxbidamount) || 0,
        shortlisted: parseInt(bidsStats.shortlisted) || 0,
        viewsCount: project.viewsCount,
      },
    };
  }

  async delete(id: string, userId: string, userRole: UserRole) {
    const project = await this.findOne(id);

    if (userRole !== UserRole.ADMIN && project.clientId !== userId) {
      throw new ForbiddenException('Not authorized');
    }

    if (project.status === ProjectStatus.IN_PROGRESS) {
      throw new BadRequestException('Cannot delete in-progress project');
    }

    await this.projectRepo.softDelete(id);
    return { message: 'Project deleted successfully' };
  }

  async getFeaturedProjects() {
    return this.projectRepo.find({
      where: { isFeatured: true, status: ProjectStatus.OPEN },
      relations: ['category', 'skills', 'client'],
      order: { createdAt: 'DESC' },
      take: 12,
    });
  }

  async getSimilarProjects(id: string) {
    const project = await this.findOne(id);
    if (!project.categoryId) return [];

    return this.projectRepo.find({
      where: {
        categoryId: project.categoryId,
        status: ProjectStatus.OPEN,
      },
      relations: ['category', 'skills'],
      order: { createdAt: 'DESC' },
      take: 6,
    });
  }
}
