import {
  Controller, Get, Post, Patch, Body, Param, Query,
  UseGuards, ParseUUIDPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ContractsService } from './contracts.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { User, UserRole } from '../../database/entities/user.entity';
import { ContractStatus } from '../../database/entities/contract.entity';

@ApiTags('Contracts')
@ApiBearerAuth()
@Controller('contracts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Get()
  @ApiOperation({ summary: 'Get my contracts' })
  getMyContracts(
    @CurrentUser() user: User,
    @Query('role') role: string,
    @Query() query: any,
  ) {
    return this.contractsService.getMyContracts(user.id, role || user.role, query);
  }

  @Get('admin/all')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[Admin] Get all contracts' })
  getAllContracts(@Query() query: any) {
    return this.contractsService.getContractsByAdmin(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get contract details' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.contractsService.findOneSecure(id, user.id, user.role);
  }

  @Get(':id/summary')
  @ApiOperation({ summary: 'Get contract financial summary' })
  getSummary(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.contractsService.getContractSummary(id, user.id, user.role);
  }

  @Patch(':id/sign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign contract (freelancer action)' })
  sign(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.contractsService.signContract(id, user.id);
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update contract status' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Body('status') status: ContractStatus,
    @Body('reason') reason?: string,
  ) {
    return this.contractsService.updateStatus(id, user.id, user.role, status, reason);
  }

  @Post(':contractId/milestones/:milestoneId/fund-escrow')
  @Roles(UserRole.CLIENT, UserRole.AGENCY_OWNER)
  @ApiOperation({ summary: 'Fund escrow for a milestone' })
  fundEscrow(
    @Param('contractId', ParseUUIDPipe) contractId: string,
    @Param('milestoneId', ParseUUIDPipe) milestoneId: string,
    @CurrentUser() user: User,
  ) {
    return this.contractsService.fundEscrow(contractId, milestoneId, user.id);
  }
}
