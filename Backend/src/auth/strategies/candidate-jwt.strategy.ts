import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { JWT_CONFIG } from '../../config/constants';

@Injectable()
export class CandidateJwtStrategy extends PassportStrategy(Strategy, 'candidate-jwt') {
    constructor(private prisma: PrismaService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: JWT_CONFIG.secret,
        });
    }

    async validate(payload: any) {
        const candidate = await this.prisma.candidate.findUnique({
            where: { id_candidate: payload.sub },
            select: {
                id_candidate: true,
                nombre_candidate: true,
                apellido_candidate: true,
                correo_candidate: true,
                tipo_doc_candidate: true,
                estado_candidate: true,
                foto_candidate: true,
                roleId: true,
                careerId: true,
                electionId: true
            }
        });

        if (!candidate) {
            throw new UnauthorizedException('Candidato no autorizado');
        }

        return candidate;
    }
}