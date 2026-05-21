import {
  Controller, Get, Post, Patch, Body, Param, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { MilestonesService } from './milestones.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { User, UserRole } from '../../database/entities/user.entity';

@ApiTags('Milestones')
@ApiBearerAuth()
@Controller('milestones')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MilestonesController {
  constructor(private readonly milestonesService: MilestonesService) {}

  @Get('contract/:contractId')
  @ApiOperation({ summary: 'Get all milestones for a contract' })
  getContractMilestones(
    @Param('contractId', ParseUUIDPipe) contractId: string,
    @CurrentUser() user: User,
  ) {
    return this.milestonesService.getContractMilestones(contractId, user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get milestone details' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.milestonesService.findOne(id);
  }

  @Post(':id/submit')
  @Roles(UserRole.FREELANCER, UserRole.AGENCY_OWNER)
  @ApiOperation({ summary: 'Submit milestone for review' })
  submit(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Body() dto: { description: string; attachments?: string[]; deliverableLinks?: string[] },
  ) {
    return this.milestonesService.submit(id, user.id, dto);
  }

  @Patch(':id/review')
  @Roles(UserRole.CLIENT, UserRole.AGENCY_OWNER)
  @ApiOperation({ summary: 'Review a milestone submission (approve/reject/revision)' })
  review(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Body() dto: { action: 'approve' | 'reject' | 'request_revision'; feedback?: string },
  ) {
    return this.milestonesService.review(id, user.id, dto);
  }
}
