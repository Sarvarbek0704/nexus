import {
  IsString, IsEnum, IsOptional, IsNumber, IsBoolean,
  IsArray, MinLength, MaxLength, Min, IsDateString, IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ProjectType, ProjectDuration, ExperienceRequired, ProjectVisibility,
} from '../../../database/entities/project.entity';

export class CreateProjectDto {
  @ApiProperty()
  @IsString()
  @MinLength(10)
  @MaxLength(200)
  title: string;

  @ApiProperty()
  @IsString()
  @MinLength(50)
  description: string;

  @ApiPropertyOptional({ enum: ProjectType })
  @IsOptional()
  @IsEnum(ProjectType)
  type?: ProjectType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  budgetMin?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  budgetMax?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  hourlyRateMin?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  hourlyRateMax?: number;

  @ApiPropertyOptional({ enum: ProjectDuration })
  @IsOptional()
  @IsEnum(ProjectDuration)
  duration?: ProjectDuration;

  @ApiPropertyOptional({ enum: ExperienceRequired })
  @IsOptional()
  @IsEnum(ExperienceRequired)
  experienceRequired?: ExperienceRequired;

  @ApiPropertyOptional({ enum: ProjectVisibility })
  @IsOptional()
  @IsEnum(ProjectVisibility)
  visibility?: ProjectVisibility;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  deadline?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  skillIds?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requirements?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  questions?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isUrgent?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  allowAgencyBids?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  preferredLocation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currency?: string;
}
