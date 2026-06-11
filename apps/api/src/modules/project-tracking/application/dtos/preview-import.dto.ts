import { Type } from 'class-transformer';
import { IsInt, Min, Max } from 'class-validator';

export class PreviewImportDto {
  @Type(() => Number)
  @IsInt()
  @Min(2024)
  @Max(2099)
  referenceYear!: number;
}
