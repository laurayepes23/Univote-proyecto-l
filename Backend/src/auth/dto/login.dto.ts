import { IsString, IsEmail, MinLength } from 'class-validator';

export class LoginDto {
    @IsEmail({}, { message: 'El correo debe ser válido' })
    correo: string;

    @IsString()
    @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
    contrasena: string;
}