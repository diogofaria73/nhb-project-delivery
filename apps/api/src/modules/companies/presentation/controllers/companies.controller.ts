import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '@shared/infrastructure/decorators/roles.decorator';
import { RolesGuard } from '@shared/infrastructure/guards/roles.guard';
import { CreateCompanyDto } from '../../application/dtos/create-company.dto';
import { UpdateCompanyDto } from '../../application/dtos/update-company.dto';
import { ListCompaniesQueryDto } from '../../application/dtos/list-companies-query.dto';
import {
  CreateCompanyUseCase,
  FindCompanyUseCase,
  ListCompaniesUseCase,
  ToggleCompanyStatusUseCase,
  UpdateCompanyUseCase,
} from '../../application/use-cases';

@ApiTags('Companies')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles('ADMINISTRATOR')
@Controller('companies')
export class CompaniesController {
  constructor(
    private readonly createCompanyUseCase: CreateCompanyUseCase,
    private readonly updateCompanyUseCase: UpdateCompanyUseCase,
    private readonly listCompaniesUseCase: ListCompaniesUseCase,
    private readonly findCompanyUseCase: FindCompanyUseCase,
    private readonly toggleCompanyStatusUseCase: ToggleCompanyStatusUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List companies with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Paginated list of companies' })
  async findAll(@Query() query: ListCompaniesQueryDto) {
    return this.listCompaniesUseCase.execute(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find a company by ID' })
  @ApiResponse({ status: 200, description: 'Company found' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.findCompanyUseCase.execute(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new company' })
  @ApiResponse({ status: 201, description: 'Company created' })
  @ApiResponse({ status: 409, description: 'CNPJ already registered' })
  async create(@Body() dto: CreateCompanyDto) {
    return this.createCompanyUseCase.execute(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a company (CNPJ cannot be changed)' })
  @ApiResponse({ status: 200, description: 'Company updated' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCompanyDto,
  ) {
    return this.updateCompanyUseCase.execute(id, dto);
  }

  @Patch(':id/toggle-status')
  @ApiOperation({ summary: 'Activate or deactivate a company' })
  @ApiResponse({ status: 200, description: 'Company status toggled' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async toggleStatus(@Param('id', ParseUUIDPipe) id: string) {
    return this.toggleCompanyStatusUseCase.execute(id);
  }
}
