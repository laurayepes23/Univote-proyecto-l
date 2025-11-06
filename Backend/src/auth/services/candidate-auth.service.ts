import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JWT_CONFIG } from '../../config/constants';

@Injectable()
export class CandidateAuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService
    ) {}

    async validateCandidate(correo: string, contrasena: string) {
        const candidate = await this.prisma.candidate.findFirst({
            where: { correo_candidate: correo }
        });

        if (!candidate) {
            throw new UnauthorizedException('Credenciales inválidas');
        }

        const isPasswordValid = await bcrypt.compare(contrasena, candidate.contrasena_candidate);
        
        if (!isPasswordValid) {
            throw new UnauthorizedException('Credenciales inválidas');
        }

        return candidate;
    }

    async login(correo: string, contrasena: string) {
        const candidate = await this.validateCandidate(correo, contrasena);

        const payload = {
            sub: candidate.id_candidate,
            email: candidate.correo_candidate,
            nombre: candidate.nombre_candidate,
            apellido: candidate.apellido_candidate,
            tipo: 'candidate'
        };

        return {
            access_token: this.jwtService.sign(payload),
            expires_in: JWT_CONFIG.expiresIn,
            user: {
                id: candidate.id_candidate,
                email: candidate.correo_candidate,
                nombre: candidate.nombre_candidate,
                apellido: candidate.apellido_candidate,
                estado: candidate.estado_candidate
            }
        };
    }

    async validateToken(token: string) {
        try {
            const payload = await this.jwtService.verify(token);
            return payload;
        } catch (error) {
            throw new UnauthorizedException('Token inválido');
        }
    }
}