import {
  Injectable, NotFoundException, ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message, MessageType } from '../../database/entities/message.entity';
import { Conversation, ConversationType } from '../../database/entities/conversation.entity';
import { User } from '../../database/entities/user.entity';
import { getPagination, paginatedResponse } from '../../common/utils/pagination.util';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../../database/entities/notification.entity';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message) private messageRepo: Repository<Message>,
    @InjectRepository(Conversation) private convRepo: Repository<Conversation>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private notificationsService: NotificationsService,
  ) {}

  async getOrCreateConversation(userAId: string, userBId: string, projectId?: string) {
    const existing = await this.convRepo
      .createQueryBuilder('conv')
      .innerJoin('conv.participants', 'pa', 'pa.id = :userAId', { userAId })
      .innerJoin('conv.participants', 'pb', 'pb.id = :userBId', { userBId })
      .where('conv.type = :type', { type: ConversationType.DIRECT })
      .getOne();

    if (existing) return existing;

    const userA = await this.userRepo.findOne({ where: { id: userAId } });
    const userB = await this.userRepo.findOne({ where: { id: userBId } });

    if (!userA || !userB) throw new NotFoundException('User not found');

    const conv = this.convRepo.create({
      type: projectId ? ConversationType.PROJECT : ConversationType.DIRECT,
      participants: [userA, userB],
      projectId,
    });

    return this.convRepo.save(conv);
  }

  async getMyConversations(userId: string, query: any) {
    const { skip, take, page, limit } = getPagination(query);

    const [convs, total] = await this.convRepo
      .createQueryBuilder('conv')
      .innerJoin('conv.participants', 'p', 'p.id = :userId', { userId })
      .leftJoinAndSelect('conv.participants', 'participants')
      .leftJoinAndSelect('conv.project', 'project')
      .orderBy('conv.lastMessageAt', 'DESC', 'NULLS LAST')
      .skip(skip)
      .take(take)
      .getManyAndCount();

    // Count unread messages per conversation
    const unreadCounts = await this.messageRepo
      .createQueryBuilder('msg')
      .select('msg.conversationId', 'conversationId')
      .addSelect('COUNT(msg.id)', 'count')
      .where('msg.conversationId IN (:...ids)', { ids: convs.map((c) => c.id) })
      .andWhere('msg.senderId != :userId', { userId })
      .andWhere('msg.status != :status', { status: 'read' })
      .andWhere('msg.isDeleted = false')
      .groupBy('msg.conversationId')
      .getRawMany()
      .catch(() => []);

    const unreadMap: Record<string, number> = {};
    for (const row of unreadCounts) {
      unreadMap[row.conversationId] = parseInt(row.count, 10);
    }

    const data = convs.map((conv) => ({
      ...conv,
      otherUser: conv.participants?.find((p) => p.id !== userId) ?? null,
      unreadCount: unreadMap[conv.id] ?? 0,
    }));

    return paginatedResponse(data, total, page, limit);
  }

  async markConversationRead(conversationId: string, userId: string) {
    const conv = await this.convRepo.findOne({
      where: { id: conversationId },
      relations: ['participants'],
    });
    if (!conv) throw new NotFoundException('Conversation not found');

    const isParticipant = conv.participants.some((p) => p.id === userId);
    if (!isParticipant) throw new ForbiddenException();

    await this.messageRepo
      .createQueryBuilder()
      .update()
      .set({ status: 'read' } as any)
      .where('conversationId = :conversationId', { conversationId })
      .andWhere('senderId != :userId', { userId })
      .andWhere('status != :status', { status: 'read' })
      .execute()
      .catch(() => null);

    return { message: 'Marked as read' };
  }

  async getMessages(conversationId: string, userId: string, query: any) {
    const conv = await this.convRepo.findOne({
      where: { id: conversationId },
      relations: ['participants'],
    });
    if (!conv) throw new NotFoundException('Conversation not found');

    const isParticipant = conv.participants.some((p) => p.id === userId);
    if (!isParticipant) throw new ForbiddenException();

    const { skip, take, page, limit } = getPagination(query);

    const [data, total] = await this.messageRepo.findAndCount({
      where: { conversationId, isDeleted: false },
      relations: ['sender'],
      order: { createdAt: 'DESC' },
      skip,
      take,
    });

    return paginatedResponse(data.reverse(), total, page, limit);
  }

  async sendMessage(conversationId: string, senderId: string, dto: {
    content: string; type?: MessageType; attachments?: any[]; replyToId?: string;
  }) {
    const conv = await this.convRepo.findOne({
      where: { id: conversationId },
      relations: ['participants'],
    });
    if (!conv) throw new NotFoundException('Conversation not found');

    const isParticipant = conv.participants.some((p) => p.id === senderId);
    if (!isParticipant) throw new ForbiddenException();

    const message = this.messageRepo.create({
      conversationId,
      senderId,
      content: dto.content,
      type: dto.type || MessageType.TEXT,
      attachments: dto.attachments || [],
      replyToId: dto.replyToId,
    });

    await this.messageRepo.save(message);

    await this.convRepo.update(conversationId, {
      lastMessageAt: new Date(),
      lastMessage: dto.content.substring(0, 100),
    });

    const recipients = conv.participants.filter((p) => p.id !== senderId);
    for (const recipient of recipients) {
      await this.notificationsService.create({
        userId: recipient.id,
        type: NotificationType.MESSAGE_RECEIVED,
        title: 'New Message',
        message: dto.content.substring(0, 60),
        link: `/messages/${conversationId}`,
        relatedEntityId: conversationId,
        relatedEntityType: 'conversation',
      });
    }

    return message;
  }

  async editMessage(messageId: string, userId: string, content: string) {
    const message = await this.messageRepo.findOne({ where: { id: messageId } });
    if (!message) throw new NotFoundException();
    if (message.senderId !== userId) throw new ForbiddenException();

    await this.messageRepo.update(messageId, {
      content,
      isEdited: true,
      editedAt: new Date(),
    });

    return this.messageRepo.findOne({ where: { id: messageId } });
  }

  async deleteMessage(messageId: string, userId: string) {
    const message = await this.messageRepo.findOne({ where: { id: messageId } });
    if (!message) throw new NotFoundException();
    if (message.senderId !== userId) throw new ForbiddenException();

    await this.messageRepo.update(messageId, {
      isDeleted: true,
      deletedAt: new Date(),
      content: '[Message deleted]',
    });

    return { message: 'Message deleted' };
  }
}
