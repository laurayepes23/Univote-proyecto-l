import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { JWT_CONFIG } from '../../config/constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private prisma: PrismaService) {
        super({
            // Extraer el token del header de Authorization
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: JWT_CONFIG.secret,
        });
    }

    // Validar el payload del token y devolver el usuario
    async validate(payload: any) {
        const user = await this.prisma.administrador.findUnique({
            where: { id_admin: payload.sub },
        });

        if (!user) {
            throw new UnauthorizedException('Usuario no autorizado');
        }

        // No enviamos la contraseña en el request
        const { contrasena_admin, ...result } = user;
        return result;
    }
}