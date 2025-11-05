import { Module } from '@nestjs/common';
import { CandidatesService } from './candidates.service';
import { CandidatesController } from './candidates.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ImageProcessorService } from './image-processor.service';

@Module({
  imports: [PrismaModule],
  controllers: [CandidatesController],
  providers: [CandidatesService, ImageProcessorService],
  exports: [CandidatesService],
})
export class CandidatesModule {}