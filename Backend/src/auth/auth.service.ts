import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { JWT_CONFIG } from '../config/constants';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService
    ) {}

    // Método para autenticar administrador
    async validateAdmin(correo: string, contrasena: string) {
        const admin = await this.prisma.administrador.findFirst({
            where: { correo_admin: correo }
        });

        if (!admin) {
            throw new UnauthorizedException('Credenciales inválidas');
        }

        const isPasswordValid = await bcrypt.compare(contrasena, admin.contrasena_admin);
        
        if (!isPasswordValid) {
            throw new UnauthorizedException('Credenciales inválidas');
        }

        return admin;
    }

    // Método para generar token JWT
    async login(loginDto: LoginDto) {
        const admin = await this.validateAdmin(loginDto.correo, loginDto.contrasena);

        const payload = {
            sub: admin.id_admin,
            email: admin.correo_admin,
            nombre: admin.nombre_admin,
            apellido: admin.apellido_admin
        };

        return {
            access_token: this.jwtService.sign(payload),
            expires_in: JWT_CONFIG.expiresIn,
            user: {
                id: admin.id_admin,
                email: admin.correo_admin,
                nombre: admin.nombre_admin,
                apellido: admin.apellido_admin
            }
        };
    }

    // Método para validar token
    async validateToken(token: string) {
        try {
            const payload = await this.jwtService.verify(token);
            return payload;
        } catch (error) {
            throw new UnauthorizedException('Token inválido');
        }
    }
}