import {
  IsString, IsNumber, IsOptional, IsArray,
  IsUUID, Min, MinLength, IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class BidMilestoneDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  amount: number;

  @IsOptional()
  dueDate?: string;
}

class QuestionAnswerDto {
  @IsString()
  question: string;

  @IsString()
  answer: string;
}

export class CreateBidDto {
  @ApiProperty()
  @IsUUID()
  projectId: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  amount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  deliveryTime?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deliveryUnit?: string;

  @ApiProperty()
  @IsString()
  @MinLength(100, { message: 'Cover letter must be at least 100 characters' })
  coverLetter: string;

  @ApiPropertyOptional({ type: [QuestionAnswerDto] })
  @IsOptional()
  @IsArray()
  questionAnswers?: QuestionAnswerDto[];

  @ApiPropertyOptional({ type: [BidMilestoneDto] })
  @IsOptional()
  @IsArray()
  milestones?: BidMilestoneDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  agencyId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currency?: string;
}
