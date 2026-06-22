import { Role } from '@prisma/client';
import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

const publicRegistrationRoles = [Role.STUDENT, Role.MERCHANT] as const;

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password!: string;

  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @IsOptional()
  @IsIn(publicRegistrationRoles)
  role?: Role;

  @IsOptional()
  @IsString()
  phone?: string;
}
