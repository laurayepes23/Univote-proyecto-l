# 01 - Recuperación de Contraseña con Código de Verificación

## 🔐 Introducción

Este documento describe la estrategia completa para implementar un sistema de recuperación de contraseña en UniVote utilizando códigos de verificación enviados por email.

---

## 1. Flujo General del Proceso

### 1.1 Diagrama de Flujo

```
┌─────────────────────────────────────────────────────────────┐
│                 FLUJO DE RECUPERACIÓN                        │
└─────────────────────────────────────────────────────────────┘

1. Usuario hace clic en "¿Olvidaste tu contraseña?"
                    ↓
2. Ingresa su correo electrónico
                    ↓
3. Sistema valida que el correo existe
                    ↓
4. Sistema genera código de 6 dígitos
                    ↓
5. Código se guarda en BD con expiración (15 min)
                    ↓
6. Sistema envía email con el código
                    ↓
7. Usuario recibe email e ingresa código
                    ↓
8. Sistema valida código y expiración
                    ↓
9. Usuario ingresa nueva contraseña
                    ↓
10. Sistema actualiza contraseña (hasheada)
                    ↓
11. Usuario puede hacer login con nueva contraseña
```

### 1.2 Casos de Uso

| Caso      | Descripción                                       | Resultado                                    |
| --------- | ------------------------------------------------- | -------------------------------------------- |
| **UC-01** | Usuario solicita recuperación con email válido    | Código enviado exitosamente                  |
| **UC-02** | Usuario solicita recuperación con email inválido  | Error: "Email no registrado"                 |
| **UC-03** | Usuario ingresa código correcto dentro del tiempo | Permite cambiar contraseña                   |
| **UC-04** | Usuario ingresa código incorrecto                 | Error: "Código inválido"                     |
| **UC-05** | Usuario ingresa código expirado                   | Error: "Código expirado, solicita uno nuevo" |
| **UC-06** | Usuario solicita múltiples códigos (spam)         | Rate limiting: máximo 3 por hora             |

---

## 2. Implementación Backend

### 2.1 Actualizar Schema de Prisma

**Archivo**: `Backend/prisma/schema.prisma`

```prisma
model PasswordResetToken {
  id        Int      @id @default(autoincrement())
  email     String
  userType  String   // 'administrador', 'votante', 'candidato'
  token     String   @unique
  expiresAt DateTime
  used      Boolean  @default(false)
  createdAt DateTime @default(now())

  @@index([email, userType])
  @@index([token])
  @@index([expiresAt])
}
```

**Ejecutar migración:**

```bash
cd Backend
npx prisma migrate dev --name add_password_reset_tokens
```

### 2.2 Instalar Dependencias

```bash
cd Backend

# Nodemailer para envío de emails
npm install nodemailer

# Types para TypeScript
npm install -D @types/nodemailer
```

### 2.3 Configurar Variables de Entorno

**Archivo**: `Backend/.env`

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=tu-email@gmail.com
EMAIL_PASSWORD=tu-app-password-de-gmail
EMAIL_FROM=noreply@univote.com

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Rate Limiting
PASSWORD_RESET_RATE_LIMIT=3
PASSWORD_RESET_RATE_WINDOW=3600000
```

**⚠️ Nota sobre Gmail:**
Para usar Gmail, debes generar una "Contraseña de aplicación":

1. Ve a tu cuenta de Google
2. Seguridad → Verificación en 2 pasos (activar)
3. Contraseñas de aplicaciones → Generar
4. Usa esa contraseña en `EMAIL_PASSWORD`

### 2.4 Crear EmailService

**Archivo**: `Backend/src/email/email.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('EMAIL_HOST'),
      port: this.configService.get<number>('EMAIL_PORT'),
      secure: this.configService.get<boolean>('EMAIL_SECURE'),
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASSWORD'),
      },
    });
  }

  /**
   * Enviar código de verificación para recuperación de contraseña
   */
  async sendPasswordResetCode(email: string, code: string, userName: string) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');

    const mailOptions = {
      from: this.configService.get<string>('EMAIL_FROM'),
      to: email,
      subject: 'Código de Recuperación de Contraseña - UniVote',
      html: this.getPasswordResetTemplate(code, userName, frontendUrl),
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email enviado a ${email}: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      this.logger.error(`Error al enviar email a ${email}:`, error);
      throw new Error('No se pudo enviar el email');
    }
  }

  /**
   * Template HTML para el email
   */
  private getPasswordResetTemplate(
    code: string,
    userName: string,
    frontendUrl: string
  ): string {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recuperación de Contraseña</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .content {
            padding: 30px;
          }
          .code-box {
            background-color: #f8f9fa;
            border: 2px dashed #667eea;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 20px 0;
          }
          .code {
            font-size: 32px;
            font-weight: bold;
            color: #667eea;
            letter-spacing: 5px;
          }
          .button {
            display: inline-block;
            background-color: #667eea;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
          .warning {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 10px 15px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Recuperación de Contraseña</h1>
            <p>UniVote - Sistema de Votaciones Electrónicas</p>
          </div>
          
          <div class="content">
            <h2>Hola, ${userName}</h2>
            <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en UniVote.</p>
            
            <p>Tu código de verificación es:</p>
            
            <div class="code-box">
              <div class="code">${code}</div>
              <p style="margin-top: 10px; color: #666;">Este código expira en 15 minutos</p>
            </div>
            
            <p>Ingresa este código en la página de recuperación para crear una nueva contraseña.</p>
            
            <div style="text-align: center;">
              <a href="${frontendUrl}/reset-password" class="button">Restablecer Contraseña</a>
            </div>
            
            <div class="warning">
              <strong>⚠️ Importante:</strong>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Este código es de un solo uso</li>
                <li>Expira en 15 minutos</li>
                <li>No compartas este código con nadie</li>
              </ul>
            </div>
            
            <p style="margin-top: 20px;">Si no solicitaste este cambio, ignora este mensaje y tu contraseña permanecerá sin cambios.</p>
          </div>
          
          <div class="footer">
            <p>Este es un mensaje automático, por favor no respondas a este email.</p>
            <p>&copy; 2025 UniVote - SENA. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Verificar configuración de email
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      this.logger.log('Conexión SMTP verificada exitosamente');
      return true;
    } catch (error) {
      this.logger.error('Error en la configuración SMTP:', error);
      return false;
    }
  }
}
```

**Archivo**: `Backend/src/email/email.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { EmailService } from './email.service';

@Module({
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
```

### 2.5 Crear PasswordResetService

**Archivo**: `Backend/src/auth/password-reset.service.ts`

```typescript
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PasswordResetService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService
  ) {}

  /**
   * Generar código de 6 dígitos
   */
  private generateCode(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Solicitar recuperación de contraseña
   */
  async requestPasswordReset(email: string, userType: string) {
    // Validar que el email existe según el tipo de usuario
    let user;
    let userName;

    if (userType === 'administrador') {
      user = await this.prisma.administrador.findUnique({
        where: { correo: email },
      });
      userName = user ? `${user.nombre} ${user.apellido}` : null;
    } else if (userType === 'votante') {
      user = await this.prisma.voter.findUnique({
        where: { correo: email },
      });
      userName = user ? `${user.nombre} ${user.apellido}` : null;
    } else if (userType === 'candidato') {
      user = await this.prisma.candidate.findUnique({
        where: { correo: email },
      });
      userName = user ? `${user.nombre} ${user.apellido}` : null;
    }

    if (!user) {
      throw new NotFoundException(
        'No existe una cuenta registrada con este correo'
      );
    }

    // Verificar rate limiting (máximo 3 intentos por hora)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentAttempts = await this.prisma.passwordResetToken.count({
      where: {
        email,
        userType,
        createdAt: { gte: oneHourAgo },
      },
    });

    if (recentAttempts >= 3) {
      throw new BadRequestException(
        'Has excedido el límite de intentos. Intenta de nuevo en 1 hora'
      );
    }

    // Generar código
    const code = this.generateCode();

    // Guardar en base de datos
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    await this.prisma.passwordResetToken.create({
      data: {
        email,
        userType,
        token: code,
        expiresAt,
      },
    });

    // Enviar email
    await this.emailService.sendPasswordResetCode(email, code, userName);

    return {
      message: 'Código de verificación enviado a tu correo electrónico',
      expiresIn: '15 minutos',
    };
  }

  /**
   * Verificar código de recuperación
   */
  async verifyResetCode(email: string, code: string, userType: string) {
    const resetToken = await this.prisma.passwordResetToken.findFirst({
      where: {
        email,
        userType,
        token: code,
        used: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!resetToken) {
      throw new UnauthorizedException('Código de verificación inválido');
    }

    // Verificar expiración
    if (new Date() > resetToken.expiresAt) {
      throw new UnauthorizedException(
        'El código ha expirado. Solicita uno nuevo'
      );
    }

    return {
      message: 'Código verificado correctamente',
      resetToken: resetToken.id,
    };
  }

  /**
   * Restablecer contraseña
   */
  async resetPassword(
    email: string,
    code: string,
    newPassword: string,
    userType: string
  ) {
    // Verificar código nuevamente
    const resetToken = await this.prisma.passwordResetToken.findFirst({
      where: {
        email,
        userType,
        token: code,
        used: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!resetToken) {
      throw new UnauthorizedException('Código de verificación inválido');
    }

    if (new Date() > resetToken.expiresAt) {
      throw new UnauthorizedException('El código ha expirado');
    }

    // Hashear nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña según tipo de usuario
    if (userType === 'administrador') {
      await this.prisma.administrador.update({
        where: { correo: email },
        data: { contrasena: hashedPassword },
      });
    } else if (userType === 'votante') {
      await this.prisma.voter.update({
        where: { correo: email },
        data: { contrasena: hashedPassword },
      });
    } else if (userType === 'candidato') {
      await this.prisma.candidate.update({
        where: { correo: email },
        data: { contrasena: hashedPassword },
      });
    }

    // Marcar token como usado
    await this.prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true },
    });

    // Invalidar todos los otros tokens del usuario
    await this.prisma.passwordResetToken.updateMany({
      where: {
        email,
        userType,
        used: false,
        id: { not: resetToken.id },
      },
      data: { used: true },
    });

    return {
      message: 'Contraseña actualizada exitosamente',
    };
  }
}
```

### 2.6 Crear DTOs

**Archivo**: `Backend/src/auth/dto/request-password-reset.dto.ts`

```typescript
import { IsEmail, IsIn, IsNotEmpty } from 'class-validator';

export class RequestPasswordResetDto {
  @IsEmail({}, { message: 'Debe ser un correo electrónico válido' })
  @IsNotEmpty({ message: 'El correo es obligatorio' })
  email: string;

  @IsIn(['administrador', 'votante', 'candidato'], {
    message: 'Tipo de usuario inválido',
  })
  @IsNotEmpty({ message: 'El tipo de usuario es obligatorio' })
  userType: string;
}
```

**Archivo**: `Backend/src/auth/dto/verify-reset-code.dto.ts`

```typescript
import { IsEmail, IsString, Length, IsIn } from 'class-validator';

export class VerifyResetCodeDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(6, 6, { message: 'El código debe tener 6 dígitos' })
  code: string;

  @IsIn(['administrador', 'votante', 'candidato'])
  userType: string;
}
```

**Archivo**: `Backend/src/auth/dto/reset-password.dto.ts`

```typescript
import { IsEmail, IsString, Length, MinLength, IsIn } from 'class-validator';

export class ResetPasswordDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(6, 6)
  code: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  newPassword: string;

  @IsIn(['administrador', 'votante', 'candidato'])
  userType: string;
}
```

### 2.7 Actualizar AuthController

**Archivo**: `Backend/src/auth/auth.controller.ts`

```typescript
import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { PasswordResetService } from './password-reset.service';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { VerifyResetCodeDto } from './dto/verify-reset-code.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  constructor(private readonly passwordResetService: PasswordResetService) {}

  /**
   * Solicitar código de recuperación
   * Rate limit: 3 intentos por hora
   */
  @Post('password-reset/request')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 3600000 } }) // 3 por hora
  async requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    return this.passwordResetService.requestPasswordReset(
      dto.email,
      dto.userType
    );
  }

  /**
   * Verificar código de recuperación
   */
  @Post('password-reset/verify')
  @HttpCode(HttpStatus.OK)
  async verifyResetCode(@Body() dto: VerifyResetCodeDto) {
    return this.passwordResetService.verifyResetCode(
      dto.email,
      dto.code,
      dto.userType
    );
  }

  /**
   * Restablecer contraseña
   */
  @Post('password-reset/reset')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.passwordResetService.resetPassword(
      dto.email,
      dto.code,
      dto.newPassword,
      dto.userType
    );
  }
}
```

### 2.8 Actualizar AuthModule

**Archivo**: `Backend/src/auth/auth.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PasswordResetService } from './password-reset.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    PrismaModule,
    EmailModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, PasswordResetService],
  exports: [AuthService],
})
export class AuthModule {}
```

---

## 3. Implementación Frontend

### 3.1 Crear Servicios API

**Archivo**: `Frontend/src/api/password-reset.api.js`

```javascript
import axios from './axios';

export const passwordResetAPI = {
  /**
   * Solicitar código de recuperación
   */
  requestReset: async (email, userType) => {
    try {
      const response = await axios.post('/auth/password-reset/request', {
        email,
        userType,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error en el servidor' };
    }
  },

  /**
   * Verificar código
   */
  verifyCode: async (email, code, userType) => {
    try {
      const response = await axios.post('/auth/password-reset/verify', {
        email,
        code,
        userType,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error en el servidor' };
    }
  },

  /**
   * Restablecer contraseña
   */
  resetPassword: async (email, code, newPassword, userType) => {
    try {
      const response = await axios.post('/auth/password-reset/reset', {
        email,
        code,
        newPassword,
        userType,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error en el servidor' };
    }
  },
};
```

### 3.2 Actualizar Login.jsx con Enlace

**Archivo**: `Frontend/src/pages/Login.jsx`

```javascript
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Login = () => {
  const navigate = useNavigate();
  const { login, loading } = useAuth();
  const [formData, setFormData] = useState({
    correo: '',
    contrasena: '',
    tipo: 'votante',
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.correo || !formData.contrasena) {
      setError('Por favor complete todos los campos');
      return;
    }

    try {
      const data = await login(formData);

      const redirectPath =
        data.user.tipo === 'administrador'
          ? '/Administrador'
          : data.user.tipo === 'votante'
          ? '/Votante'
          : data.user.tipo === 'candidato'
          ? '/Candidato'
          : '/';

      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">Iniciar Sesión</h2>
          <p className="text-gray-600 mt-2">UniVote - Sistema de Votaciones</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-4">
          {/* Tipo de usuario */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Usuario
            </label>
            <select
              name="tipo"
              value={formData.tipo}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required>
              <option value="votante">Votante</option>
              <option value="candidato">Candidato</option>
              <option value="administrador">Administrador</option>
            </select>
          </div>

          {/* Correo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Correo Electrónico
            </label>
            <input
              type="email"
              name="correo"
              value={formData.correo}
              onChange={handleChange}
              placeholder="correo@ejemplo.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Contraseña */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <input
              type="password"
              name="contrasena"
              value={formData.contrasena}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Enlace a recuperación de contraseña */}
          <div className="text-right">
            <Link
              to="/forgot-password"
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          {/* Botón de submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {loading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Iniciando sesión...
              </span>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>

        {/* Enlaces adicionales */}
        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-gray-600">
            ¿No tienes cuenta?{' '}
            <Link
              to="/RegistroVotante"
              className="text-blue-600 hover:text-blue-800 hover:underline font-medium">
              Regístrate como votante
            </Link>
          </p>
          <p className="text-sm text-gray-600">
            <Link
              to="/Registro_candidato"
              className="text-blue-600 hover:text-blue-800 hover:underline font-medium">
              Regístrate como candidato
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
```

### 3.3 Crear Página ForgotPassword.jsx

**Archivo**: `Frontend/src/pages/ForgotPassword.jsx`

```javascript
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { passwordResetAPI } from '../api/password-reset.api';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: email, 2: código, 3: nueva contraseña
  const [formData, setFormData] = useState({
    email: '',
    userType: 'votante',
    code: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  // Paso 1: Solicitar código
  const handleRequestCode = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await passwordResetAPI.requestReset(
        formData.email,
        formData.userType
      );
      setSuccess(response.message);
      setStep(2);
    } catch (err) {
      setError(err.message || 'Error al enviar el código');
    } finally {
      setLoading(false);
    }
  };

  // Paso 2: Verificar código
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await passwordResetAPI.verifyCode(
        formData.email,
        formData.code,
        formData.userType
      );
      setSuccess(response.message);
      setStep(3);
    } catch (err) {
      setError(err.message || 'Código inválido');
    } finally {
      setLoading(false);
    }
  };

  // Paso 3: Restablecer contraseña
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (formData.newPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setLoading(true);

    try {
      const response = await passwordResetAPI.resetPassword(
        formData.email,
        formData.code,
        formData.newPassword,
        formData.userType
      );
      setSuccess(response.message);

      // Redirigir al login después de 2 segundos
      setTimeout(() => {
        navigate('/Login');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Error al restablecer la contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-100 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-purple-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-800">
            Recuperar Contraseña
          </h2>
          <p className="text-gray-600 mt-2">
            {step === 1 && 'Ingresa tu correo electrónico'}
            {step === 2 && 'Ingresa el código de verificación'}
            {step === 3 && 'Crea tu nueva contraseña'}
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((num) => (
              <div
                key={num}
                className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    step >= num
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                  {num}
                </div>
                {num < 3 && (
                  <div
                    className={`w-20 h-1 mx-2 ${
                      step > num ? 'bg-purple-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Mensajes */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            {success}
          </div>
        )}

        {/* Paso 1: Solicitar código */}
        {step === 1 && (
          <form
            onSubmit={handleRequestCode}
            className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Usuario
              </label>
              <select
                name="userType"
                value={formData.userType}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                required>
                <option value="votante">Votante</option>
                <option value="candidato">Candidato</option>
                <option value="administrador">Administrador</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Correo Electrónico
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="correo@ejemplo.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {loading ? 'Enviando...' : 'Enviar Código'}
            </button>
          </form>
        )}

        {/* Paso 2: Verificar código */}
        {step === 2 && (
          <form
            onSubmit={handleVerifyCode}
            className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Código de Verificación
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                placeholder="123456"
                maxLength={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-center text-2xl font-bold tracking-widest"
                required
              />
              <p className="text-sm text-gray-500 mt-2 text-center">
                Ingresa el código de 6 dígitos enviado a tu correo
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {loading ? 'Verificando...' : 'Verificar Código'}
            </button>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full text-purple-600 hover:text-purple-800 py-2 text-sm font-medium">
              Volver a solicitar código
            </button>
          </form>
        )}

        {/* Paso 3: Nueva contraseña */}
        {step === 3 && (
          <form
            onSubmit={handleResetPassword}
            className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nueva Contraseña
              </label>
              <input
                type="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Mínimo 8 caracteres</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Contraseña
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {loading ? 'Actualizando...' : 'Restablecer Contraseña'}
            </button>
          </form>
        )}

        {/* Link de regreso */}
        <div className="mt-6 text-center">
          <Link
            to="/Login"
            className="text-sm text-gray-600 hover:text-gray-800 hover:underline">
            ← Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
```

### 3.4 Actualizar App.jsx

**Archivo**: `Frontend/src/App.jsx`

```javascript
import { Routes, Route } from 'react-router-dom';

// ... imports existentes ...
import ForgotPassword from './pages/ForgotPassword';

function App() {
  return (
    <Routes>
      {/* Rutas públicas */}
      <Route
        path="/"
        element={<Home />}
      />
      <Route
        path="/Login"
        element={<Login />}
      />
      <Route
        path="/forgot-password"
        element={<ForgotPassword />}
      />
      <Route
        path="/RegistroVotante"
        element={<RegistroVotante />}
      />
      <Route
        path="/Registro_candidato"
        element={<Registro_candidato />}
      />

      {/* ... resto de rutas ... */}
    </Routes>
  );
}

export default App;
```

---

## 4. Testing

### 4.1 Probar Envío de Email (Backend)

```bash
# En terminal de Backend
cd Backend
npm run start:dev

# Probar endpoint con curl
curl -X POST http://localhost:3000/auth/password-reset/request \
  -H "Content-Type: application/json" \
  -d '{
    "email": "tu-email@ejemplo.com",
    "userType": "votante"
  }'
```

### 4.2 Verificar Email Recibido

1. Revisa tu bandeja de entrada
2. Debes recibir un email con:
   - Código de 6 dígitos
   - Diseño HTML profesional
   - Botón para restablecer contraseña
   - Advertencias de seguridad

### 4.3 Probar Flujo Completo

1. **Solicitar código:**

   - Ir a http://localhost:5173/forgot-password
   - Ingresar email y tipo de usuario
   - Verificar que llega el email

2. **Verificar código:**

   - Ingresar código de 6 dígitos
   - Debe avanzar al paso 3

3. **Cambiar contraseña:**

   - Ingresar nueva contraseña
   - Confirmar
   - Redirige a login

4. **Login con nueva contraseña:**
   - Usar nueva contraseña
   - Debe funcionar correctamente

---

## 5. Seguridad y Mejores Prácticas

### 5.1 Medidas de Seguridad Implementadas

✅ **Rate Limiting**: Máximo 3 intentos por hora
✅ **Expiración de códigos**: 15 minutos
✅ **Códigos de un solo uso**: Se marcan como usados
✅ **Hasheado de contraseñas**: Bcrypt con salt
✅ **Validación de inputs**: Class-validator en DTOs
✅ **HTTPS recomendado**: En producción

### 5.2 Recomendaciones Adicionales

```typescript
// Agregar logging de intentos
this.logger.warn(`Password reset requested for ${email}`);

// Limitar longitud de contraseña
@MaxLength(128, { message: 'La contraseña es demasiado larga' })

// Verificar contraseña anterior (opcional)
const isSamePassword = await bcrypt.compare(newPassword, user.contrasena);
if (isSamePassword) {
  throw new BadRequestException('La nueva contraseña debe ser diferente');
}
```

---

## 6. Checklist de Implementación

```
✅ Backend
├─ [ ] Schema de Prisma actualizado
├─ [ ] Migración ejecutada
├─ [ ] Nodemailer instalado y configurado
├─ [ ] EmailService creado
├─ [ ] PasswordResetService implementado
├─ [ ] DTOs creados
├─ [ ] AuthController actualizado
├─ [ ] Variables de entorno configuradas
└─ [ ] Testing con Postman/curl

✅ Frontend
├─ [ ] API service creado
├─ [ ] Login.jsx actualizado con enlace
├─ [ ] ForgotPassword.jsx creado
├─ [ ] App.jsx actualizado con ruta
├─ [ ] Testing manual del flujo completo
└─ [ ] Validación de errores funciona

✅ Email
├─ [ ] Cuenta SMTP configurada
├─ [ ] Template HTML funciona
├─ [ ] Emails se envían correctamente
└─ [ ] Links en email funcionan
```

---

## 7. Troubleshooting

### Problema: Email no se envía

```
Solución:
1. Verificar variables de entorno (EMAIL_USER, EMAIL_PASSWORD)
2. Para Gmail, generar "Contraseña de aplicación"
3. Verificar firewall (permitir puerto 587)
4. Revisar logs del servidor
```

### Problema: Código inválido siempre

```
Solución:
1. Verificar que el código sea de 6 dígitos
2. Revisar expiración (15 minutos)
3. Verificar que email y userType coincidan
4. Revisar tabla PasswordResetToken en BD
```

### Problema: Rate limiting muy estricto

```
Solución:
Ajustar en .env:
PASSWORD_RESET_RATE_LIMIT=5  # Aumentar de 3 a 5
PASSWORD_RESET_RATE_WINDOW=7200000  # 2 horas en lugar de 1
```

---

**Documento**: 01-recuperacion-contrasena.md  
**Versión**: 1.0  
**Última actualización**: Octubre 2025  
**Siguiente**: [02-gestion-fotos-candidatos.md](./02-gestion-fotos-candidatos.md)
