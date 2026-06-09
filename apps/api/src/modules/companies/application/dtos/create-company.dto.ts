import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateCompanyDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  tradeName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  legalName!: string;

  @IsString()
  @IsNotEmpty()
  cnpj!: string;

  @IsEmail()
  @IsNotEmpty()
  contactEmail!: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  contactPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
