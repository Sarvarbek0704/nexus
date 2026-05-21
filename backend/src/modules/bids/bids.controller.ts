import {
  Controller, Get, Post, Patch, Delete, Body, Param,
  Query, UseGuards, ParseUUIDPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { BidsService } from './bids.service';
import { CreateBidDto } from './dto/create-bid.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { User, UserRole } from '../../database/entities/user.entity';
import { BidStatus } from '../../database/entities/bid.entity';

@ApiTags('Bids')
@ApiBearerAuth()
@Controller('bids')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BidsController {
  constructor(private readonly bidsService: BidsService) {}

  @Post()
  @Roles(UserRole.FREELANCER, UserRole.AGENCY_OWNER)
  @ApiOperation({ summary: 'Submit a bid on a project' })
  create(@CurrentUser() user: User, @Body() dto: CreateBidDto) {
    return this.bidsService.create(user.id, dto);
  }

  @Get('my')
  @Roles(UserRole.FREELANCER, UserRole.AGENCY_OWNER)
  @ApiOperation({ summary: 'Get my submitted bids' })
  getMyBids(@CurrentUser() user: User, @Query() query: any) {
    return this.bidsService.getMyBids(user.id, query);
  }

  @Get('project/:projectId')
  @Roles(UserRole.CLIENT, UserRole.AGENCY_OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all bids for a project' })
  getProjectBids(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @CurrentUser() user: User,
    @Query() query: any,
  ) {
    return this.bidsService.getProjectBids(projectId, user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get bid by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.bidsService.findOne(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update bid status (shortlist, accept, reject)' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Body('status') status: BidStatus,
    @Body('note') note?: string,
  ) {
    return this.bidsService.updateStatus(id, user.id, user.role, status, note);
  }

  @Patch(':id/withdraw')
  @Roles(UserRole.FREELANCER, UserRole.AGENCY_OWNER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Withdraw a bid' })
  withdraw(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.bidsService.withdraw(id, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a bid' })
  delete(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.bidsService.delete(id, user.id, user.role);
  }
}
