import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { ProposalsService } from './proposals.service';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { UpdateProposalDto } from './dto/update-proposal.dto';

@Controller('proposals')
export class ProposalsController {
  constructor(private readonly proposalsService: ProposalsService) {}

  @Post()
  create(@Body() createProposalDto: CreateProposalDto) {
    return this.proposalsService.create(createProposalDto);
  }

  @Get()
  findAll() {
    return this.proposalsService.findAll();
  }

  @Get('public')
  findAllPublic() {
    return this.proposalsService.findAllPublic();
  }

  @Get('list')
  findAllList() {
    return this.proposalsService.findAllPublic();
  }

  @Get('owner/:candidateId')
  findAllByOwner(@Param('candidateId') candidateId: string) {
    return this.proposalsService.findAllByOwner(+candidateId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.proposalsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProposalDto: UpdateProposalDto) {
    return this.proposalsService.update(+id, updateProposalDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.proposalsService.remove(+id);
  }
}