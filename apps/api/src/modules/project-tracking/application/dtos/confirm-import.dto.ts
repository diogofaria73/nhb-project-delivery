import { Type } from 'class-transformer';
import { IsInt, IsString, Length, Matches, Max, Min } from 'class-validator';

export class ConfirmImportDto {
  @Type(() => Number)
  @IsInt()
  @Min(2024)
  @Max(2099)
  referenceYear!: number;

  @IsString()
  @Length(64, 64)
  @Matches(/^[a-f0-9]{64}$/)
  expectedSha256!: string;
}
