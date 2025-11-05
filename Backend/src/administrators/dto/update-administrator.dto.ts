// src/administrators/dto/update-administrator.dto.ts
import { IsString, IsOptional, IsEmail, MinLength } from 'class-validator';

export class UpdateAdministratorDto {
  @IsOptional()
  @IsString()
  nombre_admin?: string;

  @IsOptional()
  @IsString()
  apellido_admin?: string;

  @IsOptional()
  @IsString()
  tipo_doc_admin?: string;

  @IsOptional()
  num_doc_admin?: bigint;

  @IsOptional()
  @IsEmail()
  correo_admin?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  contrasena_admin?: string;
}