import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { CandidatesService } from "./candidates.service";
import { CreateCandidateDto } from "./dto/create-candidate.dto";
import { LoginCandidateDto } from "./dto/login-candidate.dto";
import { UpdateCandidateDto } from "./dto/update-candidate.dto";
import { ApplyToElectionDto } from "./dto/apply-to-election.dto";
import { multerConfig } from "./upload.config";

@Controller("candidates")
export class CandidatesController {
  constructor(private readonly candidatesService: CandidatesService) {}

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.candidatesService.findOne(id);
  }

  @Post("apply")
  @HttpCode(HttpStatus.OK)
  applyToElection(@Body() applyToElectionDto: ApplyToElectionDto) {
    return this.candidatesService.applyToElection(applyToElectionDto);
  }

  @Get()
  findAll() {
    return this.candidatesService.findAll();
  }

  @Get(":id/proposals")
  findOneWithProposals(@Param("id", ParseIntPipe) id: number) {
    return this.candidatesService.findOneWithProposals(id);
  }

  @Patch(":id")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateCandidateDto: UpdateCandidateDto
  ) {
    return this.candidatesService.update(id, updateCandidateDto);
  }

  @Post("register")
  @UseInterceptors(FileInterceptor("foto_candidate", multerConfig))
  create(
    @Body() createCandidateDto: CreateCandidateDto,
    @UploadedFile() foto_candidate?: Express.Multer.File
  ) {
    return this.candidatesService.create(createCandidateDto, foto_candidate);
  }

  @Post(":id/photo")
  @UseInterceptors(FileInterceptor("photo", multerConfig))
  async uploadPhoto(
    @Param("id", ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File
  ) {
    if (!file) {
      throw new BadRequestException("No se ha proporcionado ninguna imagen");
    }

    return this.candidatesService.uploadPhoto(id, file);
  }

  @Delete(":id/photo")
  async deletePhoto(@Param("id", ParseIntPipe) id: number) {
    return this.candidatesService.deletePhoto(id);
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  login(@Body() loginCandidateDto: LoginCandidateDto) {
    return this.candidatesService.login(loginCandidateDto);
  }

  @Post("validate-password")
  @HttpCode(HttpStatus.OK)
  async validatePassword(
    @Body() validatePasswordDto: { candidateId: number; password: string }
  ) {
    return this.candidatesService.validatePassword(
      validatePasswordDto.candidateId,
      validatePasswordDto.password
    );
  }

  @Patch(":id/withdraw-election")
  @HttpCode(HttpStatus.OK)
  async withdrawFromElection(@Param("id", ParseIntPipe) id: number) {
    return this.candidatesService.withdrawFromElection(id);
  }
}