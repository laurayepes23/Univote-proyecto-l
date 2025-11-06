import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, UseGuards, Request } from '@nestjs/common';
import { VotersService } from './voters.service';
import { CreateVoterDto } from './dto/create-voter.dto';
import { UpdateVoterDto } from './dto/update-voter.dto';
import { LoginVoterDto } from './dto/login-voter.dto';
import { VoterJwtGuard } from '../auth/guards/voter-jwt.guard';
import { VoterAuthService } from '../auth/services/voter-auth.service';

@Controller('voters')
export class VotersController {
    constructor(
        private readonly votersService: VotersService,
        private readonly voterAuthService: VoterAuthService
    ) { }

    @Post()
    create(@Body() createVoterDto: CreateVoterDto) {
        console.log('🆕 Creando nuevo votante');
        return this.votersService.create(createVoterDto);
    }

    @HttpCode(HttpStatus.OK)
    @Post('login')
    async login(@Body() loginVoterDto: LoginVoterDto) {
        console.log('🔐 Inicio de sesión votante');
        return this.voterAuthService.login(loginVoterDto.correo_voter, loginVoterDto.contrasena_voter);
    }

    @UseGuards(VoterJwtGuard)
    @Get('profile')
    getProfile(@Request() req) {
        return req.user;
    }

    @Post('validate-password')
    @HttpCode(HttpStatus.OK)
    async validatePassword(@Body() validatePasswordDto: { voterId: number; password: string }) {
        console.log('🔐 Validando contraseña - Voter ID:', validatePasswordDto.voterId);
        return this.votersService.validatePassword(validatePasswordDto.voterId, validatePasswordDto.password);
    }

    @Get()
    findAll() {
        console.log('📋 Obteniendo todos los votantes');
        return this.votersService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        console.log('🔍 Endpoint findOne llamado - ID:', id);
        try {
            const voterId = parseInt(id);
            if (isNaN(voterId)) {
                throw new Error('ID inválido');
            }
            const result = await this.votersService.findOne(voterId);
            console.log('✅ findOne completado exitosamente');
            return result;
        } catch (error) {
            console.error('❌ Error en endpoint findOne:', error);
            throw error;
        }
    }

    @UseGuards(VoterJwtGuard)
    @Patch(':id')
    async update(@Param('id') id: string, @Body() updateVoterDto: UpdateVoterDto) {
        console.log('🔄 Endpoint update llamado - ID:', id, 'Data:', updateVoterDto);
        try {
            const voterId = parseInt(id);
            if (isNaN(voterId)) {
                throw new Error('ID inválido');
            }
            const result = await this.votersService.update(voterId, updateVoterDto);
            console.log('✅ Update completado exitosamente');
            return result;
        } catch (error) {
            console.error('❌ Error en endpoint update:', error);
            throw error;
        }
    }

    @UseGuards(VoterJwtGuard)
    @Delete(':id')
    remove(@Param('id') id: string) {
        console.log('🗑️ Eliminando votante ID:', id);
        return this.votersService.remove(+id);
    }
}