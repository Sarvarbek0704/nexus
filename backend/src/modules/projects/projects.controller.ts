import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  UseGuards, ParseUUIDPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { QueryProjectDto } from './dto/query-project.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { User, UserRole } from '../../database/entities/user.entity';
import { ProjectStatus } from '../../database/entities/project.entity';

@ApiTags('Projects')
@ApiBearerAuth()
@Controller('projects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @Roles(UserRole.CLIENT, UserRole.AGENCY_OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Post a new project' })
  create(@CurrentUser() user: User, @Body() dto: CreateProjectDto) {
    return this.projectsService.create(user.id, dto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all public projects with filters' })
  findAll(@Query() query: QueryProjectDto) {
    return this.projectsService.findAll(query);
  }

  @Public()
  @Get('featured')
  @ApiOperation({ summary: 'Get featured projects' })
  getFeatured() {
    return this.projectsService.getFeaturedProjects();
  }

  @Get('my')
  @Roles(UserRole.CLIENT, UserRole.AGENCY_OWNER)
  @ApiOperation({ summary: 'Get my posted projects' })
  getMyProjects(@CurrentUser() user: User, @Query() query: QueryProjectDto) {
    return this.projectsService.getClientProjects(user.id, query);
  }

  @Get('admin/all')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[Admin] Get all projects with any status' })
  adminGetAll(@Query() query: any) {
    return this.projectsService.adminFindAll(query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get project by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.projectsService.findOneAndIncrementView(id, user?.id);
  }

  @Public()
  @Get(':id/similar')
  @ApiOperation({ summary: 'Get similar projects' })
  getSimilar(@Param('id', ParseUUIDPipe) id: string) {
    return this.projectsService.getSimilarProjects(id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get project bid statistics (client only)' })
  getStats(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.projectsService.getProjectStats(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update project' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Body() dto: Partial<CreateProjectDto>,
  ) {
    return this.projectsService.update(id, user.id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update project status' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Body('status') status: ProjectStatus,
    @Body('reason') reason?: string,
  ) {
    return this.projectsService.updateStatus(id, user.id, user.role, status, reason);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete project' })
  delete(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.projectsService.delete(id, user.id, user.role);
  }
}
