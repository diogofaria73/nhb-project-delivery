import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Roles } from '@shared/infrastructure/decorators/roles.decorator';
import { RolesGuard } from '@shared/infrastructure/guards/roles.guard';
import {
  CurrentUser,
  AuthenticatedUser,
} from '@shared/infrastructure/decorators/current-user.decorator';
import { CreateGoalDto } from '../../application/dtos/create-goal.dto';
import { UpdateGoalDto } from '../../application/dtos/update-goal.dto';
import { ListGoalsQueryDto } from '../../application/dtos/list-goals-query.dto';
import { GoalBreakdownQueryDto } from '../../application/dtos/goal-breakdown-query.dto';
import {
  ArchiveGoalUseCase,
  BreakdownGoalUseCase,
  CreateGoalUseCase,
  DeleteGoalUseCase,
  ExportGoalBreakdownUseCase,
  FindGoalUseCase,
  ListGoalsUseCase,
  UpdateGoalUseCase,
} from '../../application/use-cases';

@ApiTags('Status Report Goals')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('goals')
export class GoalsController {
  constructor(
    private readonly createUseCase: CreateGoalUseCase,
    private readonly updateUseCase: UpdateGoalUseCase,
    private readonly archiveUseCase: ArchiveGoalUseCase,
    private readonly deleteUseCase: DeleteGoalUseCase,
    private readonly findUseCase: FindGoalUseCase,
    private readonly listUseCase: ListGoalsUseCase,
    private readonly breakdownUseCase: BreakdownGoalUseCase,
    private readonly exportUseCase: ExportGoalBreakdownUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List goals with optional status filter' })
  @ApiResponse({ status: 200, description: 'Array of goals with aggregate summary' })
  async findAll(@Query() query: ListGoalsQueryDto) {
    return this.listUseCase.execute(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find a goal by ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.findUseCase.execute(id);
  }

  @Get(':id/breakdown')
  @ApiOperation({ summary: 'Per-company breakdown for a goal' })
  async breakdown(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: GoalBreakdownQueryDto,
  ) {
    const project = query.project === 'true';
    return this.breakdownUseCase.execute(id, project);
  }

  @Get(':id/export')
  @ApiOperation({ summary: 'Export breakdown as CSV' })
  async exportCsv(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: GoalBreakdownQueryDto,
    @Res({ passthrough: false }) res: Response,
  ) {
    const project = query.project === 'true';
    const csv = await this.exportUseCase.execute(id, project);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="goal-breakdown-${id}.csv"`);
    res.send(csv);
  }

  @Roles('ADMINISTRATOR')
  @Post()
  @ApiOperation({ summary: 'Create a new goal' })
  @ApiResponse({ status: 201, description: 'Goal created' })
  @ApiResponse({ status: 409, description: 'A goal for this period already exists' })
  async create(@Body() dto: CreateGoalDto, @CurrentUser() user: AuthenticatedUser) {
    return this.createUseCase.execute(dto, user.userId);
  }

  @Roles('ADMINISTRATOR')
  @Put(':id')
  @ApiOperation({ summary: 'Update goal metadata (period identity is immutable)' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGoalDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.updateUseCase.execute(id, dto, user.userId);
  }

  @Roles('ADMINISTRATOR')
  @Post(':id/archive')
  @ApiOperation({ summary: 'Toggle archived state of a goal' })
  async archive(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.archiveUseCase.execute(id, user.userId);
  }

  @Roles('ADMINISTRATOR')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an upcoming goal' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.deleteUseCase.execute(id);
  }
}
