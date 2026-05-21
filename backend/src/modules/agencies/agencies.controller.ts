import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  UseGuards, ParseUUIDPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AgenciesService } from './agencies.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, UserRole } from '../../database/entities/user.entity';

@ApiTags('Agencies')
@ApiBearerAuth()
@Controller('agencies')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AgenciesController {
  constructor(private readonly agenciesService: AgenciesService) {}

  @Post()
  @Roles(UserRole.AGENCY_OWNER)
  @ApiOperation({ summary: 'Create an agency' })
  create(@CurrentUser() user: User, @Body() dto: any) {
    return this.agenciesService.create(user.id, dto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Browse agencies' })
  findAll(@Query() query: any) {
    return this.agenciesService.findAll(query);
  }

  @Get('my')
  @Roles(UserRole.AGENCY_OWNER)
  @ApiOperation({ summary: 'Get my agency' })
  getMyAgency(@CurrentUser() user: User) {
    return this.agenciesService.getMyAgency(user.id);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get agency by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.agenciesService.findOne(id);
  }

  @Public()
  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get agency by slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.agenciesService.findBySlug(slug);
  }

  @Patch(':id')
  @Roles(UserRole.AGENCY_OWNER)
  @ApiOperation({ summary: 'Update agency' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Body() dto: any,
  ) {
    return this.agenciesService.update(id, user.id, dto);
  }

  @Post(':id/invite')
  @Roles(UserRole.AGENCY_OWNER)
  @ApiOperation({ summary: 'Invite member to agency' })
  inviteMember(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Body('userId') inviteeId: string,
    @Body('title') title?: string,
  ) {
    return this.agenciesService.inviteMember(id, user.id, inviteeId, title);
  }

  @Patch(':id/invite/respond')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept or decline agency invite' })
  respondToInvite(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Body('accept') accept: boolean,
  ) {
    return this.agenciesService.respondToInvite(id, user.id, accept);
  }

  @Delete(':id/members/:memberId')
  @Roles(UserRole.AGENCY_OWNER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove agency member' })
  removeMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @CurrentUser() user: User,
  ) {
    return this.agenciesService.removeMember(id, user.id, memberId);
  }
}
