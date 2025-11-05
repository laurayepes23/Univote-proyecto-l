// src/voters/dto/update-voter.dto.ts
import { IsString, IsOptional, IsEmail, MinLength } from 'class-validator';

export class UpdateVoterDto {
  @IsOptional()
  @IsEmail()
  correo_voter?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  contrasena_voter?: string;
}