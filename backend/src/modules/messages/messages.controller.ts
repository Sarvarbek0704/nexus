import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  UseGuards, ParseUUIDPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../database/entities/user.entity';

@ApiTags('Messages')
@ApiBearerAuth()
@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post('conversations')
  @ApiOperation({ summary: 'Create or get conversation with a user' })
  getOrCreateConversation(
    @CurrentUser() user: User,
    @Body('userId') otherUserId: string,
    @Body('projectId') projectId?: string,
  ) {
    return this.messagesService.getOrCreateConversation(user.id, otherUserId, projectId);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Get my conversations' })
  getMyConversations(@CurrentUser() user: User, @Query() query: any) {
    return this.messagesService.getMyConversations(user.id, query);
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Get messages in a conversation' })
  getMessages(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Query() query: any,
  ) {
    return this.messagesService.getMessages(id, user.id, query);
  }

  @Post('conversations/:id/send')
  @ApiOperation({ summary: 'Send a message' })
  sendMessage(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Body() dto: { content: string; attachments?: any[]; replyToId?: string },
  ) {
    return this.messagesService.sendMessage(id, user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edit a message' })
  editMessage(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Body('content') content: string,
  ) {
    return this.messagesService.editMessage(id, user.id, content);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a message' })
  deleteMessage(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.messagesService.deleteMessage(id, user.id);
  }
}
