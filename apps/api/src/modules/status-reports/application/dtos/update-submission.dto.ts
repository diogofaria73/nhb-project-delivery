import { IsEmail, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class UpdateSubmissionDto {
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/)
  referenceMonth?: string;

  @IsOptional()
  @IsEmail()
  deliveryEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string | null;
}
