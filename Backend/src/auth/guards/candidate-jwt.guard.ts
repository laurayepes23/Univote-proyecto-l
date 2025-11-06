import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class CandidateJwtGuard extends AuthGuard('candidate-jwt') {}