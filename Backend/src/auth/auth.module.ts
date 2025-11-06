import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PrismaModule } from '../prisma/prisma.module';
import { JWT_CONFIG } from '../config/constants';
import { VoterJwtStrategy } from './strategies/voter-jwt.strategy';
import { VoterAuthService } from './services/voter-auth.service';
import { CandidateJwtStrategy } from './strategies/candidate-jwt.strategy';
import { CandidateAuthService } from './services/candidate-auth.service';

@Module({
    imports: [
        PrismaModule,
        PassportModule,
        JwtModule.register({
            secret: JWT_CONFIG.secret,
            signOptions: { 
                expiresIn: JWT_CONFIG.expiresIn
            },
        }),
    ],
    controllers: [AuthController],
    providers: [
        AuthService,
        JwtStrategy,
        VoterJwtStrategy,
        VoterAuthService,
        CandidateJwtStrategy,
        CandidateAuthService
    ],
    exports: [AuthService, VoterAuthService, CandidateAuthService],
})
export class AuthModule {}