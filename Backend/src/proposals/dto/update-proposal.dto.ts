import { PartialType } from '@nestjs/mapped-types';
import { CreateProposalDto } from './create-proposal.dto';
import { IsOptional, IsEnum } from 'class-validator';

export class UpdateProposalDto extends PartialType(CreateProposalDto) {
  @IsOptional()
  @IsEnum(['Activa', 'Inactiva'])
  estado_proposal?: string;
}