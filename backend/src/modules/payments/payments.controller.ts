import {
  Controller, Get, Post, Body, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, UserRole } from '../../database/entities/user.entity';
import { PaymentMethod, PaymentType } from '../../database/entities/payment.entity';

@ApiTags('Payments')
@ApiBearerAuth()
@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('wallet')
  @ApiOperation({ summary: 'Get wallet info and balance' })
  getWallet(@CurrentUser() user: User) {
    return this.paymentsService.getWalletInfo(user.id);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get transaction history' })
  getHistory(
    @CurrentUser() user: User,
    @Query('type') type: PaymentType,
    @Query() query: any,
  ) {
    return this.paymentsService.getTransactionHistory(user.id, type, query);
  }

  @Post('deposit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deposit funds to wallet (simulated)' })
  deposit(
    @CurrentUser() user: User,
    @Body('amount') amount: number,
    @Body('method') method: PaymentMethod,
  ) {
    return this.paymentsService.deposit(user.id, amount, method);
  }

  @Post('withdraw')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Withdraw funds from wallet (simulated)' })
  withdraw(
    @CurrentUser() user: User,
    @Body('amount') amount: number,
    @Body('method') method: PaymentMethod,
  ) {
    return this.paymentsService.withdraw(user.id, amount, method);
  }

  @Get('admin')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[Admin] Get all payments' })
  getAdminPayments(@Query() query: any) {
    return this.paymentsService.getAdminPayments(query);
  }
}
