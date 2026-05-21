import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from '../../database/entities/notification.entity';
import { getPagination, paginatedResponse } from '../../common/utils/pagination.util';

interface CreateNotificationDto {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  imageUrl?: string;
  data?: Record<string, any>;
  relatedEntityId?: string;
  relatedEntityType?: string;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification) private notifRepo: Repository<Notification>,
  ) {}

  async create(dto: CreateNotificationDto) {
    const notification = this.notifRepo.create(dto);
    return this.notifRepo.save(notification);
  }

  async createBulk(dtos: CreateNotificationDto[]) {
    const notifications = this.notifRepo.create(dtos);
    return this.notifRepo.save(notifications);
  }

  async getMyNotifications(userId: string, query: any) {
    const { skip, take, page, limit } = getPagination(query);

    const [data, total] = await this.notifRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip,
      take,
    });

    return paginatedResponse(data, total, page, limit);
  }

  async getUnreadCount(userId: string) {
    const count = await this.notifRepo.count({
      where: { userId, isRead: false },
    });
    return { count };
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.notifRepo.findOne({ where: { id } });
    if (!notification) throw new NotFoundException();
    if (notification.userId !== userId) throw new ForbiddenException();

    await this.notifRepo.update(id, { isRead: true, readAt: new Date() });
    return { message: 'Marked as read' };
  }

  async markAllAsRead(userId: string) {
    await this.notifRepo.update(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() },
    );
    return { message: 'All notifications marked as read' };
  }

  async delete(id: string, userId: string) {
    const notification = await this.notifRepo.findOne({ where: { id } });
    if (!notification) throw new NotFoundException();
    if (notification.userId !== userId) throw new ForbiddenException();
    await this.notifRepo.delete(id);
    return { message: 'Notification deleted' };
  }

  async deleteAll(userId: string) {
    await this.notifRepo.delete({ userId });
    return { message: 'All notifications deleted' };
  }
}
