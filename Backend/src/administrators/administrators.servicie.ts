import { Injectable, NotFoundException, ConflictException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAdministratorDto } from './dto/create-administrator.dto';
import { UpdateAdministratorDto } from './dto/update-administrator.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdministratorsService {
    constructor(private prisma: PrismaService) { }

    // Método para obtener todos los administradores
    findAll() {
        return this.prisma.administrador.findMany({
            include: {
                elections: true
            }
        });
    }

    // Buscar administrador por id
    async findOne(id: number) {
        const admin = await this.prisma.administrador.findUnique({
            where: { id_admin: id },
            include: {
                elections: true
            }
        });

        if (!admin) {
            throw new NotFoundException(`Administrador con ID ${id} no encontrado`);
        }

        const { contrasena_admin, ...result } = admin;
        return result;
    }

    // Crear nuevo administrador
    async create(newAdministrator: CreateAdministratorDto) {
        // Verificar si el email ya existe
        const existingAdmin = await this.prisma.administrador.findFirst({
            where: { correo_admin: newAdministrator.correo_admin }
        });

        if (existingAdmin) {
            throw new ConflictException('El correo electrónico ya está registrado');
        }

        // Hashear la contraseña antes de guardarla
        const hashedPassword = await bcrypt.hash(newAdministrator.contrasena_admin, 10);

        return await this.prisma.administrador.create({
            data: {
                ...newAdministrator,
                contrasena_admin: hashedPassword
            },
            include: {
                elections: true
            }
        });
    }

    // Método para iniciar sesión de administrador
    async login(correo: string, contrasena: string) {
        const admin = await this.prisma.administrador.findFirst({
            where: { correo_admin: correo },
        });

        if (!admin) {
            throw new NotFoundException('Correo o contraseña incorrectos.');
        }

        const isMatch = await bcrypt.compare(contrasena, admin.contrasena_admin);

        if (!isMatch) {
            throw new NotFoundException('Correo o contraseña incorrectos.');
        }

        const { contrasena_admin, ...result } = admin;
        return result;
    }

    // ✅ NUEVO MÉTODO: Validar contraseña
    async validatePassword(adminId: number, password: string) {
        const admin = await this.prisma.administrador.findUnique({
            where: { id_admin: adminId },
        });

        if (!admin) {
            throw new NotFoundException('Administrador no encontrado');
        }

        const isValid = await bcrypt.compare(password, admin.contrasena_admin);
        return { valid: isValid };
    }

    // Actualizar administrador
    async update(id: number, updateAdministratorDto: UpdateAdministratorDto) {
        try {
            // Si se está actualizando la contraseña, hashearla
            if (updateAdministratorDto.contrasena_admin) {
                updateAdministratorDto.contrasena_admin = await bcrypt.hash(updateAdministratorDto.contrasena_admin, 10);
            }

            const updatedAdmin = await this.prisma.administrador.update({
                where: { id_admin: id },
                data: updateAdministratorDto,
                include: {
                    elections: true
                }
            });

            const { contrasena_admin, ...result } = updatedAdmin;
            return result;
        } catch (error) {
            throw new NotFoundException(`Administrador con ID ${id} no encontrado`);
        }
    }

    // Eliminar administrador
    async remove(id: number) {
        try {
            await this.prisma.administrador.delete({
                where: { id_admin: id }
            });

            return {
                success: true,
                message: `Administrador con ID ${id} eliminado correctamente`
            };
        } catch (error) {
            throw new NotFoundException(`Administrador con ID ${id} no encontrado`);
        }
    }
}