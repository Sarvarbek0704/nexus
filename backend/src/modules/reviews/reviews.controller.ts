import {
  Controller, Get, Post, Patch, Body, Param, Query, UseGuards, ParseUUIDPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ReviewsService, CreateReviewDto } from './reviews.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../database/entities/user.entity';

@ApiTags('Reviews')
@ApiBearerAuth()
@Controller('reviews')
@UseGuards(JwtAuthGuard)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @ApiOperation({ summary: 'Submit a review for a completed contract' })
  create(@CurrentUser() user: User, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(user.id, dto);
  }

  @Public()
  @Get('freelancer/:userId')
  @ApiOperation({ summary: 'Get reviews received by a freelancer' })
  getFreelancerReviews(@Param('userId', ParseUUIDPipe) userId: string, @Query() query: any) {
    return this.reviewsService.getFreelancerReviews(userId, query);
  }

  @Public()
  @Get('client/:userId')
  @ApiOperation({ summary: 'Get reviews received by a client' })
  getClientReviews(@Param('userId', ParseUUIDPipe) userId: string, @Query() query: any) {
    return this.reviewsService.getClientReviews(userId, query);
  }

  @Public()
  @Get('summary/:userId')
  @ApiOperation({ summary: 'Get rating summary for a user' })
  getSummary(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.reviewsService.getRatingSummary(userId);
  }

  @Patch(':id/respond')
  @ApiOperation({ summary: 'Respond to a review' })
  respond(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Body('response') response: string,
  ) {
    return this.reviewsService.respondToReview(id, user.id, response);
  }

  @Patch(':id/helpful')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark review as helpful' })
  markHelpful(@Param('id', ParseUUIDPipe) id: string) {
    return this.reviewsService.markHelpful(id);
  }
}
