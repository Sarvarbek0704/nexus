import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { StatsService } from './stats.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, UserRole } from '../../database/entities/user.entity';

@ApiTags('Statistics')
@ApiBearerAuth()
@Controller('stats')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('platform')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[Admin] Get platform-wide statistics' })
  getPlatformStats() {
    return this.statsService.getPlatformStats();
  }

  @Get('me')
  @ApiOperation({ summary: 'Get my personal statistics' })
  getMyStats(@CurrentUser() user: User) {
    return this.statsService.getUserStats(user.id);
  }
}
