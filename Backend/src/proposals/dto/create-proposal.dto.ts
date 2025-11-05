import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum } from 'class-validator';

export class CreateProposalDto {
  @IsString()
  @IsNotEmpty()
  titulo_proposal: string;

  @IsString()
  @IsNotEmpty()
  descripcion_proposal: string;

  @IsString()
  @IsOptional()
  @IsEnum(['Activa', 'Inactiva'])
  estado_proposal?: string;

  @IsNumber()
  @IsNotEmpty()
  candidateId: number;
}