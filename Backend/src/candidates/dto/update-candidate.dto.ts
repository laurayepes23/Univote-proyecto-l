// update-candidate.dto.ts
import { IsString, IsOptional, IsIn, IsEmail, MinLength } from 'class-validator';

export class UpdateCandidateDto {
  @IsString()
  @IsOptional()
  @IsIn(['Aprobado', 'No Aprobado', 'Pendiente'])
  estado_candidate?: string;

  @IsOptional()
  @IsEmail()
  correo_candidate?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  contrasena_candidate?: string;
}
