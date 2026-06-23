import { OrderStatus } from '@prisma/client';
import { IsEnum, IsISO8601, IsOptional } from 'class-validator';

export class StudentOrdersQueryDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsISO8601()
  from?: string;

  @IsOptional()
  @IsISO8601()
  to?: string;
}
