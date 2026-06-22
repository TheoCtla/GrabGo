import { IsISO8601, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AvailableSlotsQueryDto {
  @IsString()
  @IsNotEmpty()
  snackId!: string;

  @IsOptional()
  @IsISO8601()
  from?: string;

  @IsOptional()
  @IsISO8601()
  to?: string;
}
