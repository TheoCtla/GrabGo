import { OrderStatus } from '@prisma/client';
import { IsEnum, IsISO8601, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class MerchantOrdersQueryDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  snackId?: string;

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
