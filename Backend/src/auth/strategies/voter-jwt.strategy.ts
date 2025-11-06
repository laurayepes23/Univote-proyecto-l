import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable } from "@nestjs/common";
import { JWT_CONFIG } from "../../config/constants";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class VoterJwtStrategy extends PassportStrategy(Strategy, "voter-jwt") {
    constructor(private prisma: PrismaService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: JWT_CONFIG.secret,
        });
    }

    async validate(payload: any) {
        const voter = await this.prisma.voter.findUnique({
            where: { id_voter: payload.sub },
            select: {
                id_voter: true,
                nombre_voter: true,
                apellido_voter: true,
                tipo_doc_voter: true,
                num_doc_voter: true,
                correo_voter: true,
                estado_voter: true,
                careerId: true,
                roleId: true
            },
        });
        return voter;
    }
}