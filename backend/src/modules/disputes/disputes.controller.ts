import {
  Controller, Get, Post, Patch, Body, Param, Query,
  UseGuards, ParseUUIDPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DisputesService } from './disputes.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, UserRole } from '../../database/entities/user.entity';
import { DisputeReason, DisputeStatus } from '../../database/entities/dispute.entity';

@ApiTags('Disputes')
@ApiBearerAuth()
@Controller('disputes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DisputesController {
  constructor(private readonly disputesService: DisputesService) {}

  @Post()
  @ApiOperation({ summary: 'Open a dispute for a contract' })
  open(
    @CurrentUser() user: User,
    @Body() dto: {
      contractId: string; milestoneId?: string;
      reason: DisputeReason; title: string;
      description: string; claimAmount?: number; attachments?: string[];
    },
  ) {
    return this.disputesService.open(user.id, dto);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get my disputes' })
  getMyDisputes(@CurrentUser() user: User, @Query() query: any) {
    return this.disputesService.getMyDisputes(user.id, query);
  }

  @Get('admin/all')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[Admin] Get all disputes' })
  getAllDisputes(@Query() query: any) {
    return this.disputesService.getAllDisputes(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get dispute details' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.disputesService.findOneSecure(id, user.id, user.role);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Add message to dispute' })
  addMessage(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Body() dto: { message: string; attachments?: string[] },
  ) {
    return this.disputesService.addMessage(id, user.id, user.role, dto);
  }

  @Patch(':id/resolve')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[Admin] Resolve a dispute' })
  resolve(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Body() dto: {
      resolution: string;
      status: DisputeStatus;
      claimantSharePercent?: number;
      respondentSharePercent?: number;
      resolvedAmount?: number;
    },
  ) {
    return this.disputesService.resolve(id, user.id, dto as any);
  }
}
