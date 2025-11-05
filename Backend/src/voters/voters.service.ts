import { Injectable, NotFoundException, ConflictException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVoterDto } from './dto/create-voter.dto';
import { UpdateVoterDto } from './dto/update-voter.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class VotersService {
    constructor(private prisma: PrismaService) { }

    async create(createVoterDto: CreateVoterDto) {
        try {
            const hashedPassword = await bcrypt.hash(createVoterDto.contrasena_voter, 10);

            const existingVoter = await this.prisma.voter.findFirst({
                where: {
                    OR: [
                        { correo_voter: createVoterDto.correo_voter },
                        { num_doc_voter: BigInt(createVoterDto.num_doc_voter) },
                    ],
                },
            });

            if (existingVoter) {
                if (existingVoter.correo_voter === createVoterDto.correo_voter) {
                    throw new ConflictException('El correo electrónico ya está registrado.');
                }
                if (existingVoter.num_doc_voter === BigInt(createVoterDto.num_doc_voter)) {
                    throw new ConflictException('El número de documento ya está registrado.');
                }
            }

            await this.validateRelations(createVoterDto);

            const { id_role, id_career, id_election, ...voterData } = createVoterDto;

            const dataToCreate: any = {
                ...voterData,
                contrasena_voter: hashedPassword,
                num_doc_voter: BigInt(voterData.num_doc_voter),
                role: {
                    connect: { id_role: id_role }
                },
                career: {
                    connect: { id_career: id_career }
                }
            };

            if (id_election) {
                dataToCreate.election = { connect: { id_election: id_election } };
            }

            const result = await this.prisma.voter.create({
                data: dataToCreate,
                include: {
                    role: {
                        select: {
                            id_role: true,
                            nombre_role: true
                        }
                    },
                    election: {
                        select: {
                            id_election: true,
                            nombre_election: true
                        }
                    },
                    career: {
                        select: {
                            id_career: true,
                            nombre_career: true
                        }
                    }
                }
            });

            const { contrasena_voter, ...voterWithoutPassword } = result;
            return {
                ...voterWithoutPassword,
                num_doc_voter: voterWithoutPassword.num_doc_voter.toString()
            };

        } catch (error) {
            console.error('❌ Error en VotersService.create:', error);
            if (error instanceof ConflictException || error instanceof NotFoundException) {
                throw error;
            }
            throw new InternalServerErrorException('Error interno del servidor al crear votante');
        }
    }

    async login(correo: string, contrasena: string) {
        try {
            const voter = await this.prisma.voter.findUnique({
                where: { correo_voter: correo },
            });

            if (!voter) {
                throw new NotFoundException('Correo o contraseña incorrectos.');
            }

            const isMatch = await bcrypt.compare(contrasena, voter.contrasena_voter);

            if (!isMatch) {
                throw new NotFoundException('Correo o contraseña incorrectos.');
            }

            const { contrasena_voter, ...result } = voter;
            return {
                ...result,
                num_doc_voter: result.num_doc_voter.toString()
            };
        } catch (error) {
            console.error('❌ Error en VotersService.login:', error);
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new InternalServerErrorException('Error interno del servidor al iniciar sesión');
        }
    }

    async findAll() {
        try {
            const voters = await this.prisma.voter.findMany({
                include: {
                    role: {
                        select: {
                            id_role: true,
                            nombre_role: true
                        }
                    },
                    election: {
                        select: {
                            id_election: true,
                            nombre_election: true
                        }
                    },
                    career: {
                        select: {
                            id_career: true,
                            nombre_career: true
                        }
                    }
                },
                orderBy: { id_voter: 'asc' }
            });

            if (voters.length === 0) {
                throw new HttpException(
                    'No hay votantes registrados',
                    HttpStatus.NOT_FOUND
                );
            }

            return voters.map(voter => {
                const { contrasena_voter, ...voterWithoutPassword } = voter;
                return {
                    ...voterWithoutPassword,
                    num_doc_voter: voterWithoutPassword.num_doc_voter.toString()
                };
            });
        } catch (error) {
            console.error('❌ Error en VotersService.findAll:', error);
            if (error instanceof HttpException) {
                throw error;
            }
            throw new InternalServerErrorException('Error interno del servidor al obtener votantes');
        }
    }

    async findOne(id: number) {
        try {
            console.log('🔍 Buscando votante con ID:', id);
            
            const voter = await this.prisma.voter.findUnique({
                where: { id_voter: id },
                include: {
                    role: {
                        select: {
                            id_role: true,
                            nombre_role: true
                        }
                    },
                    election: {
                        select: {
                            id_election: true,
                            nombre_election: true,
                            estado_election: true
                        }
                    },
                    career: {
                        select: {
                            id_career: true,
                            nombre_career: true,
                            facultad_career: true
                        }
                    },
                    vote: {
                        select: {
                            id_vote: true,
                            fecha_vote: true,
                            hora_vote: true
                        }
                    }
                }
            });

            console.log('📊 Votante encontrado:', voter ? 'Sí' : 'No');

            if (!voter) {
                throw new NotFoundException(`Votante con ID ${id} no encontrado`);
            }

            const { contrasena_voter, ...result } = voter;
            
            // Convertir BigInt a string para evitar problemas de serialización
            const formattedResult = {
                ...result,
                num_doc_voter: result.num_doc_voter.toString()
            };

            console.log('✅ Votante procesado exitosamente');
            return formattedResult;
        } catch (error) {
            console.error('❌ Error en VotersService.findOne:', error);
            console.error('❌ Detalles del error:', {
                message: error.message,
                code: error.code,
                stack: error.stack
            });
            
            if (error instanceof NotFoundException) {
                throw error;
            }
            
            throw new InternalServerErrorException('Error interno del servidor al obtener votante');
        }
    }

    async update(id: number, updateVoterDto: UpdateVoterDto) {
        try {
            console.log('📥 Actualizando votante ID:', id);
            console.log('📥 Datos recibidos:', updateVoterDto);

            // Verificar que el votante existe
            const existingVoter = await this.prisma.voter.findUnique({
                where: { id_voter: id }
            });

            if (!existingVoter) {
                throw new NotFoundException(`Votante con ID ${id} no encontrado`);
            }

            // Preparar datos para actualizar
            const updateData: any = {};

            // Solo actualizar correo si se proporciona
            if (updateVoterDto.correo_voter !== undefined) {
                updateData.correo_voter = updateVoterDto.correo_voter;
            }

            // Solo actualizar contraseña si se proporciona
            if (updateVoterDto.contrasena_voter) {
                console.log('🔐 Hasheando nueva contraseña');
                updateData.contrasena_voter = await bcrypt.hash(updateVoterDto.contrasena_voter, 10);
            }

            // Si no hay datos para actualizar, retornar error
            if (Object.keys(updateData).length === 0) {
                throw new BadRequestException('No se proporcionaron datos para actualizar');
            }

            const updatedVoter = await this.prisma.voter.update({
                where: { id_voter: id },
                data: updateData,
                include: {
                    role: {
                        select: {
                            id_role: true,
                            nombre_role: true
                        }
                    },
                    election: {
                        select: {
                            id_election: true,
                            nombre_election: true
                        }
                    },
                    career: {
                        select: {
                            id_career: true,
                            nombre_career: true
                        }
                    }
                }
            });

            const { contrasena_voter, ...result } = updatedVoter;
            
            const formattedResult = {
                ...result,
                num_doc_voter: result.num_doc_voter.toString()
            };

            console.log('✅ Votante actualizado exitosamente');
            return formattedResult;
        } catch (error) {
            console.error('❌ Error en VotersService.update:', error);
            
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            
            if (error.code === 'P2002') {
                const target = error.meta?.target;
                if (target.includes('correo_voter')) {
                    throw new ConflictException('El correo electrónico ya está registrado.');
                }
            }
            
            throw new InternalServerErrorException('Error interno del servidor al actualizar votante');
        }
    }

    async validatePassword(voterId: number, password: string) {
        try {
            console.log('🔐 Validando contraseña para votante ID:', voterId);
            
            const voter = await this.prisma.voter.findUnique({
                where: { id_voter: voterId },
            });

            if (!voter) {
                throw new NotFoundException('Votante no encontrado');
            }

            const isValid = await bcrypt.compare(password, voter.contrasena_voter);
            console.log('✅ Resultado validación contraseña:', isValid);
            return { valid: isValid };
        } catch (error) {
            console.error('❌ Error validando contraseña:', error);
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new InternalServerErrorException('Error interno del servidor al validar contraseña');
        }
    }

    async remove(id: number) {
        try {
            const voter = await this.prisma.voter.findUnique({
                where: { id_voter: id }
            });

            if (!voter) {
                throw new NotFoundException(`Votante con ID ${id} no encontrado.`);
            }

            await this.prisma.voter.delete({
                where: { id_voter: id }
            });

            return { 
                success: true, 
                message: `Votante con ID ${id} eliminado correctamente` 
            };

        } catch (error) {
            console.error('❌ Error en VotersService.remove:', error);
            
            if (error instanceof NotFoundException) {
                throw error;
            }
            
            if (error.code === 'P2025') {
                throw new NotFoundException(`Votante con ID ${id} no encontrado.`);
            }
            
            if (error.code === 'P2003') {
                throw new ConflictException('No se puede eliminar el votante porque tiene votos asociados.');
            }

            throw new InternalServerErrorException('Error interno del servidor al eliminar votante');
        }
    }

    private async validateRelations(createVoterDto: CreateVoterDto) {
        try {
            const [role, career] = await Promise.all([
                this.prisma.role.findUnique({ where: { id_role: createVoterDto.id_role } }),
                this.prisma.career.findUnique({ where: { id_career: createVoterDto.id_career } })
            ]);

            if (!role) {
                throw new NotFoundException('Rol no encontrado.');
            }
            if (!career) {
                throw new NotFoundException('Carrera no encontrada.');
            }
        } catch (error) {
            console.error('❌ Error en validateRelations:', error);
            throw error;
        }
    }
}