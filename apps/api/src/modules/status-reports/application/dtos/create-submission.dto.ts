import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateSubmissionDto {
  @IsUUID()
  @IsNotEmpty()
  companyId!: string;

  /**
   * Reference month in YYYY-MM format. The use case normalizes it to the first
   * day of the month at 00:00 UTC.
   */
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'referenceMonth must be in YYYY-MM format',
  })
  referenceMonth!: string;

  @IsEmail()
  @IsNotEmpty()
  deliveryEmail!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
