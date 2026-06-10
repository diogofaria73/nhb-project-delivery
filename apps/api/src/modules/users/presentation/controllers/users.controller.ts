import {
  Controller,
  ForbiddenException,
  Get,
  Post,
  Put,
  Patch,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '@shared/infrastructure/decorators/public.decorator';
import { Roles } from '@shared/infrastructure/decorators/roles.decorator';
import { RolesGuard } from '@shared/infrastructure/guards/roles.guard';
import {
  CurrentUser,
  AuthenticatedUser,
} from '@shared/infrastructure/decorators/current-user.decorator';
import { CreateUserDto } from '../../application/dtos/create-user.dto';
import { UpdateUserDto } from '../../application/dtos/update-user.dto';
import { ChangePasswordDto } from '../../application/dtos/change-password.dto';
import { ListUsersQueryDto } from '../../application/dtos/list-users-query.dto';
import {
  CreateUserUseCase,
  UpdateUserUseCase,
  ListUsersUseCase,
  FindUserUseCase,
  ToggleUserStatusUseCase,
  UnlockUserUseCase,
  ChangePasswordUseCase,
} from '../../application/use-cases';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly listUsersUseCase: ListUsersUseCase,
    private readonly findUserUseCase: FindUserUseCase,
    private readonly toggleUserStatusUseCase: ToggleUserStatusUseCase,
    private readonly unlockUserUseCase: UnlockUserUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
  ) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new user (public registration)' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  async create(@Body() dto: CreateUserDto) {
    return this.createUserUseCase.execute(dto);
  }

  @Patch('me/password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Change own password (authenticated user only)' })
  @ApiResponse({ status: 204, description: 'Password changed successfully' })
  @ApiResponse({ status: 401, description: 'Current password is incorrect' })
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    await this.changePasswordUseCase.execute(currentUser.userId, dto);
  }

  @Get()
  @Roles('ADMINISTRATOR')
  @ApiOperation({ summary: 'List all users with filters and pagination (Admin only)' })
  @ApiResponse({ status: 200, description: 'Paginated list of users' })
  async findAll(@Query() query: ListUsersQueryDto) {
    return this.listUsersUseCase.execute(query);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile from database' })
  @ApiResponse({ status: 200, description: 'Current user profile' })
  async me(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.findUserUseCase.execute(currentUser.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find a user by ID (Admin or self)' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 403, description: 'Cannot read another user profile' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    if (currentUser.role !== 'ADMINISTRATOR' && currentUser.userId !== id) {
      throw new ForbiddenException('You can only read your own profile');
    }
    return this.findUserUseCase.execute(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a user' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.updateUserUseCase.execute(id, dto, currentUser.userId, currentUser.role);
  }

  @Roles('ADMINISTRATOR')
  @Patch(':id/toggle-status')
  @ApiOperation({ summary: 'Activate or deactivate a user' })
  @ApiResponse({ status: 200, description: 'User status toggled' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Cannot deactivate own account or last admin' })
  async toggleStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.toggleUserStatusUseCase.execute(id, currentUser.userId);
  }

  @Roles('ADMINISTRATOR')
  @Patch(':id/unlock')
  @ApiOperation({ summary: 'Unlock a locked user account' })
  @ApiResponse({ status: 200, description: 'User unlocked successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async unlock(@Param('id', ParseUUIDPipe) id: string) {
    return this.unlockUserUseCase.execute(id);
  }
}
