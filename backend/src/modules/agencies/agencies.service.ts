import {
  Injectable, NotFoundException, ForbiddenException,
  BadRequestException, ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Agency, AgencyStatus } from '../../database/entities/agency.entity';
import { AgencyMember, AgencyMemberRole, AgencyMemberStatus } from '../../database/entities/agency-member.entity';
import { AgencyProfile } from '../../database/entities/agency-profile.entity';
import { User, UserRole } from '../../database/entities/user.entity';
import { generateSlug } from '../../common/utils/generate.util';
import { getPagination, paginatedResponse } from '../../common/utils/pagination.util';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../../database/entities/notification.entity';

@Injectable()
export class AgenciesService {
  constructor(
    @InjectRepository(Agency) private agencyRepo: Repository<Agency>,
    @InjectRepository(AgencyMember) private memberRepo: Repository<AgencyMember>,
    @InjectRepository(AgencyProfile) private agencyProfileRepo: Repository<AgencyProfile>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private notificationsService: NotificationsService,
  ) {}

  async create(ownerId: string, dto: Partial<Agency>) {
    const user = await this.userRepo.findOne({ where: { id: ownerId } });
    if (user.role !== UserRole.AGENCY_OWNER) {
      throw new ForbiddenException('Only agency owners can create agencies');
    }

    const existing = await this.agencyRepo.findOne({ where: { ownerId } });
    if (existing) throw new ConflictException('You already have an agency');

    const slug = generateSlug(dto.name);
    const slugExists = await this.agencyRepo.findOne({ where: { slug } });
    const finalSlug = slugExists ? `${slug}-${Date.now()}` : slug;

    const agency = this.agencyRepo.create({
      ...dto,
      slug: finalSlug,
      ownerId,
      status: AgencyStatus.ACTIVE,
    });

    await this.agencyRepo.save(agency);

    await this.memberRepo.save({
      agencyId: agency.id,
      userId: ownerId,
      role: AgencyMemberRole.OWNER,
      status: AgencyMemberStatus.ACTIVE,
      joinedAt: new Date(),
    });

    return this.findOne(agency.id);
  }

  async findAll(query: any) {
    const { skip, take, page, limit } = getPagination(query);

    const qb = this.agencyRepo
      .createQueryBuilder('agency')
      .leftJoinAndSelect('agency.skills', 'skills')
      .where('agency.status = :status', { status: AgencyStatus.ACTIVE });

    if (query.search) {
      qb.andWhere(
        '(agency.name ILIKE :s OR agency.description ILIKE :s)',
        { s: `%${query.search}%` },
      );
    }

    if (query.country) qb.andWhere('agency.country = :country', { country: query.country });
    if (query.size) qb.andWhere('agency.size = :size', { size: query.size });
    if (query.isVerified) qb.andWhere('agency.isVerified = true');

    qb.orderBy('agency.averageRating', 'DESC').skip(skip).take(take);

    const [data, total] = await qb.getManyAndCount();
    return paginatedResponse(data, total, page, limit);
  }

  async findOne(id: string) {
    const agency = await this.agencyRepo.findOne({
      where: { id },
      relations: ['skills', 'agencyMembers', 'agencyMembers.user'],
    });
    if (!agency) throw new NotFoundException('Agency not found');
    return agency;
  }

  async findBySlug(slug: string) {
    const agency = await this.agencyRepo.findOne({
      where: { slug },
      relations: ['skills', 'agencyMembers', 'agencyMembers.user', 'agencyMembers.user.freelancerProfile'],
    });
    if (!agency) throw new NotFoundException('Agency not found');
    return agency;
  }

  async update(id: string, ownerId: string, dto: Partial<Agency>) {
    const agency = await this.findOne(id);
    if (agency.ownerId !== ownerId) throw new ForbiddenException();

    const forbidden = ['ownerId', 'status', 'isVerified', 'isFeatured'];
    forbidden.forEach((k) => delete dto[k]);

    Object.assign(agency, dto);
    return this.agencyRepo.save(agency);
  }

  async inviteMember(agencyId: string, ownerId: string, inviteeId: string, title?: string) {
    const agency = await this.findOne(agencyId);
    if (agency.ownerId !== ownerId) throw new ForbiddenException();

    const existing = await this.memberRepo.findOne({
      where: { agencyId, userId: inviteeId },
    });
    if (existing) throw new ConflictException('User is already a member or has pending invite');

    const invitee = await this.userRepo.findOne({ where: { id: inviteeId } });
    if (!invitee) throw new NotFoundException('User not found');

    const member = this.memberRepo.create({
      agencyId,
      userId: inviteeId,
      role: AgencyMemberRole.MEMBER,
      status: AgencyMemberStatus.PENDING,
      title,
      invitedBy: ownerId,
    });
    await this.memberRepo.save(member);

    await this.notificationsService.create({
      userId: inviteeId,
      type: NotificationType.AGENCY_INVITE,
      title: 'Agency Invitation',
      message: `You've been invited to join "${agency.name}"`,
      link: `/agencies/${agencyId}/invite`,
      relatedEntityId: agencyId,
      relatedEntityType: 'agency',
    });

    return member;
  }

  async respondToInvite(agencyId: string, userId: string, accept: boolean) {
    const member = await this.memberRepo.findOne({
      where: { agencyId, userId, status: AgencyMemberStatus.PENDING },
    });
    if (!member) throw new NotFoundException('Invite not found');

    if (accept) {
      await this.memberRepo.update(member.id, {
        status: AgencyMemberStatus.ACTIVE,
        joinedAt: new Date(),
      });

      const agency = await this.findOne(agencyId);
      await this.notificationsService.create({
        userId: agency.ownerId,
        type: NotificationType.AGENCY_INVITE_ACCEPTED,
        title: 'Invite Accepted',
        message: `Your agency invite was accepted`,
        link: `/agencies/${agencyId}`,
        relatedEntityId: agencyId,
        relatedEntityType: 'agency',
      });
    } else {
      await this.memberRepo.update(member.id, { status: AgencyMemberStatus.REJECTED });
    }

    return { message: accept ? 'Joined agency' : 'Invite declined' };
  }

  async removeMember(agencyId: string, ownerId: string, memberId: string) {
    const agency = await this.findOne(agencyId);
    if (agency.ownerId !== ownerId) throw new ForbiddenException();
    if (memberId === ownerId) throw new BadRequestException('Cannot remove owner');

    await this.memberRepo.delete({ agencyId, userId: memberId });
    return { message: 'Member removed' };
  }

  async getMyAgency(ownerId: string) {
    return this.agencyRepo.findOne({
      where: { ownerId },
      relations: ['skills', 'agencyMembers', 'agencyMembers.user'],
    });
  }
}
