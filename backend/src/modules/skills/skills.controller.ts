import {
  Controller, Get, Post, Body, Param, Query, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SkillsService } from './skills.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UserRole } from '../../database/entities/user.entity';

@ApiTags('Skills & Categories')
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @Public()
  @Get('skills')
  @ApiOperation({ summary: 'Get all skills' })
  getSkills(@Query() query: any) {
    return this.skillsService.getSkills(query);
  }

  @Public()
  @Get('skills/top')
  @ApiOperation({ summary: 'Get top skills by usage' })
  getTopSkills(@Query('limit') limit: number) {
    return this.skillsService.getTopSkills(limit);
  }

  @Public()
  @Get('skills/search')
  @ApiOperation({ summary: 'Search skills by name' })
  searchSkills(@Query('q') query: string) {
    return this.skillsService.searchSkills(query);
  }

  @Post('skills')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Create a skill' })
  createSkill(@Body() dto: { name: string; description?: string; categoryId?: string }) {
    return this.skillsService.createSkill(dto);
  }

  @Public()
  @Get('categories')
  @ApiOperation({ summary: 'Get all categories with subcategories' })
  getCategories() {
    return this.skillsService.getCategories();
  }

  @Public()
  @Get('categories/:id')
  @ApiOperation({ summary: 'Get category by ID' })
  getCategory(@Param('id', ParseUUIDPipe) id: string) {
    return this.skillsService.getCategoryById(id);
  }

  @Post('categories')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Create a category' })
  createCategory(@Body() dto: { name: string; description?: string; icon?: string; parentId?: string }) {
    return this.skillsService.createCategory(dto);
  }
}
