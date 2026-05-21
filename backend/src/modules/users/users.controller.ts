import {
  Controller, Get, Patch, Delete, Post, Body, Param, Query,
  UseGuards, ParseUUIDPipe, UseInterceptors, UploadedFile, HttpCode, HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, UserRole, UserStatus } from '../../database/entities/user.entity';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Public()
  @Get('freelancers')
  @ApiOperation({ summary: 'Browse freelancers with filters' })
  getFreelancers(@Query() query: any) {
    return this.usersService.getFreelancers(query);
  }

  @Public()
  @Get('profile/:id')
  @ApiOperation({ summary: 'Get public user profile by ID' })
  getPublicProfile(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.getPublicProfile(id);
  }

  @Public()
  @Get('username/:username')
  @ApiOperation({ summary: 'Get public user profile by username' })
  getByUsername(@Param('username') username: string) {
    return this.usersService.getPublicProfileByUsername(username);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update my profile' })
  updateProfile(@CurrentUser() user: User, @Body() dto: Partial<User>) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Patch('me/freelancer-profile')
  @Roles(UserRole.FREELANCER, UserRole.AGENCY_OWNER)
  @ApiOperation({ summary: 'Update freelancer profile' })
  updateFreelancerProfile(@CurrentUser() user: User, @Body() dto: any) {
    return this.usersService.updateFreelancerProfile(user.id, dto);
  }

  @Patch('me/client-profile')
  @Roles(UserRole.CLIENT, UserRole.AGENCY_OWNER)
  @ApiOperation({ summary: 'Update client profile' })
  updateClientProfile(@CurrentUser() user: User, @Body() dto: any) {
    return this.usersService.updateClientProfile(user.id, dto);
  }

  @Post('me/portfolio')
  @Roles(UserRole.FREELANCER, UserRole.AGENCY_OWNER)
  @ApiOperation({ summary: 'Add portfolio item' })
  addPortfolio(@CurrentUser() user: User, @Body() dto: any) {
    return this.usersService.addPortfolio(user.id, dto);
  }

  @Patch('me/portfolio/:id')
  @Roles(UserRole.FREELANCER, UserRole.AGENCY_OWNER)
  @ApiOperation({ summary: 'Update portfolio item' })
  updatePortfolio(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Body() dto: any,
  ) {
    return this.usersService.updatePortfolio(id, user.id, dto);
  }

  @Delete('me/portfolio/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete portfolio item' })
  deletePortfolio(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.usersService.deletePortfolio(id, user.id);
  }

  @Post('me/avatar')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: './uploads/avatars',
        filename: (_, file, cb) => {
          const uniqueName = `${Date.now()}${extname(file.originalname)}`;
          cb(null, uniqueName);
        },
      }),
      limits: { fileSize: 2 * 1024 * 1024 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload avatar' })
  uploadAvatar(@CurrentUser() user: User, @UploadedFile() file: Express.Multer.File) {
    return this.usersService.uploadAvatar(user.id, file.filename);
  }

  @Get('admin/all')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[Admin] Get all users' })
  adminGetUsers(@Query() query: any) {
    return this.usersService.adminGetUsers(query);
  }

  @Patch('admin/:id/status')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[Admin] Update user status' })
  adminUpdateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: UserStatus,
  ) {
    return this.usersService.adminUpdateUserStatus(id, status);
  }
}
