import {
    Injectable,
    UnauthorizedException,
    NotFoundException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../../prisma/prisma.service";
import * as bcrypt from "bcrypt";

@Injectable()
export class VoterAuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    async login(correo_voter: string, contrasena_voter: string) {
        const voter = await this.prisma.voter.findUnique({
            where: { correo_voter },
        });

        if (!voter) {
            throw new NotFoundException("Votante no encontrado");
        }

        const isPasswordValid = await bcrypt.compare(
            contrasena_voter,
            voter.contrasena_voter,
        );

        if (!isPasswordValid) {
            throw new UnauthorizedException("Credenciales inválidas");
        }

        const payload = { sub: voter.id_voter, email: voter.correo_voter, role: "voter" };

        return {
            access_token: this.jwtService.sign(payload),
            voter: {
                id_voter: voter.id_voter,
                nombre_voter: voter.nombre_voter,
                apellido_voter: voter.apellido_voter,
                tipo_doc_voter: voter.tipo_doc_voter,
                num_doc_voter: voter.num_doc_voter,
                correo_voter: voter.correo_voter,
                estado_voter: voter.estado_voter,
                careerId: voter.careerId,
                roleId: voter.roleId
            },
        };
    }
}