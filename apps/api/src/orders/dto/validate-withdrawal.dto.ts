import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class ValidateWithdrawalDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  qrToken?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}$/)
  code?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  snackId?: string;
}
