# 06 - Seguridad y Mejores Prácticas

## 🔒 Introducción

Este documento presenta las mejores prácticas de seguridad para la implementación de JWT en UniVote, cubriendo desde la protección básica hasta estrategias avanzadas de seguridad.

---

## 1. Fundamentos de Seguridad JWT

### 1.1 Principios Básicos

#### **Confidencialidad**

```
Objetivo: Proteger información sensible
Estrategia: Encriptación, HTTPS, almacenamiento seguro
```

#### **Integridad**

```
Objetivo: Evitar modificación de tokens
Estrategia: Firma digital, validación en cada request
```

#### **Autenticidad**

```
Objetivo: Verificar identidad del emisor
Estrategia: Secret key robusta, algoritmos seguros
```

#### **Disponibilidad**

```
Objetivo: Sistema siempre accesible
Estrategia: Manejo de errores, tokens de respaldo
```

---

## 2. Almacenamiento Seguro de Tokens

### 2.1 Comparación de Métodos

| Método              | Seguridad | XSS           | CSRF          | Persistencia | Recomendación                    |
| ------------------- | --------- | ------------- | ------------- | ------------ | -------------------------------- |
| **localStorage**    | Media     | ❌ Vulnerable | ✅ Protegido  | ✅ Sí        | ⚠️ Aceptable con precauciones    |
| **sessionStorage**  | Media     | ❌ Vulnerable | ✅ Protegido  | ❌ No        | ⚠️ Solo para sesiones temporales |
| **Cookie HttpOnly** | Alta      | ✅ Protegido  | ❌ Vulnerable | ✅ Sí        | ✅ **Recomendado**               |
| **Memory (Estado)** | Alta      | ✅ Protegido  | ✅ Protegido  | ❌ No        | ⚠️ Solo para apps SPA            |

### 2.2 Implementación Recomendada: HttpOnly Cookies

#### **Backend - Configuración de Cookies**

**Archivo**: `Backend/src/auth/auth.controller.ts`

```typescript
import {
  Controller,
  Post,
  Body,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response
  ) {
    const result = await this.authService.login(loginDto);

    // Configurar cookie HttpOnly con el token
    response.cookie('access_token', result.access_token, {
      httpOnly: true, // No accesible desde JavaScript
      secure: true, // Solo HTTPS en producción
      sameSite: 'strict', // Protección CSRF
      maxAge: 8 * 60 * 60 * 1000, // 8 horas
      path: '/',
    });

    // Retornar solo datos del usuario (sin token)
    return {
      user: result.user,
      message: 'Login exitoso',
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) response: Response) {
    // Limpiar cookie
    response.clearCookie('access_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
    });

    return { message: 'Logout exitoso' };
  }
}
```

#### **Backend - Extraer Token de Cookie**

**Archivo**: `Backend/src/auth/strategies/jwt.strategy.ts`

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService
  ) {
    super({
      // Extraer token desde cookie en lugar de header
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies?.access_token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    // Validar que el usuario aún existe
    let user;

    if (payload.tipo === 'administrador') {
      user = await this.prisma.administrador.findUnique({
        where: { id: payload.sub },
      });
    } else if (payload.tipo === 'votante') {
      user = await this.prisma.voter.findUnique({
        where: { id: payload.sub },
      });
    } else if (payload.tipo === 'candidato') {
      user = await this.prisma.candidate.findUnique({
        where: { id: payload.sub },
      });
    }

    if (!user) {
      throw new UnauthorizedException('Usuario no válido');
    }

    return {
      userId: payload.sub,
      correo: payload.correo,
      tipo: payload.tipo,
      rol: payload.rol,
    };
  }
}
```

#### **Backend - Habilitar Cookies en CORS**

**Archivo**: `Backend/src/main.ts`

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar cookie-parser
  app.use(cookieParser());

  // Configurar CORS para permitir cookies
  app.enableCors({
    origin: 'http://localhost:5173', // URL del frontend
    credentials: true, // Permitir cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  await app.listen(3000);
}
bootstrap();
```

**Instalación**:

```bash
npm install cookie-parser
npm install -D @types/cookie-parser
```

#### **Frontend - Configurar Axios con Cookies**

**Archivo**: `Frontend/src/api/axios.js`

```javascript
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  withCredentials: true, // ⭐ Enviar cookies automáticamente
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Ya no necesitas interceptor para agregar token
// Las cookies se envían automáticamente

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('user');
      window.location.href = '/Login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
```

---

## 3. Protección contra XSS (Cross-Site Scripting)

### 3.1 ¿Qué es XSS?

```
XSS es un ataque donde un atacante inyecta código JavaScript malicioso
en tu aplicación web para robar tokens, sesiones o datos sensibles.

Ejemplo:
Si un usuario puede escribir: <script>alert(localStorage.getItem('access_token'))</script>
Y esto se ejecuta, el atacante puede robar el token.
```

### 3.2 Estrategias de Protección

#### **A. Sanitizar Inputs del Usuario**

**Archivo**: `Frontend/src/utils/sanitize.js`

```javascript
import DOMPurify from 'dompurify';

/**
 * Sanitizar HTML para prevenir XSS
 */
export const sanitizeHTML = (dirtyHTML) => {
  return DOMPurify.sanitize(dirtyHTML, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: [],
  });
};

/**
 * Escapar caracteres especiales
 */
export const escapeHTML = (text) => {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  return text.replace(/[&<>"'/]/g, (char) => map[char]);
};
```

**Instalación**:

```bash
npm install dompurify
```

**Uso en Componentes**:

```javascript
import { sanitizeHTML } from '../utils/sanitize';

const Propuestas = ({ propuesta }) => {
  return (
    <div
      dangerouslySetInnerHTML={{
        __html: sanitizeHTML(propuesta.descripcion),
      }}
    />
  );
};
```

#### **B. Content Security Policy (CSP)**

**Archivo**: `Backend/src/main.ts`

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configurar Helmet para seguridad
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"], // Evitar 'unsafe-inline' en producción
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
    })
  );

  await app.listen(3000);
}
bootstrap();
```

**Instalación**:

```bash
npm install helmet
```

#### **C. Validación en el Backend**

**Archivo**: `Backend/src/proposals/dto/create-proposal.dto.ts`

```typescript
import { IsString, IsNotEmpty, MaxLength, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateProposalDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @Transform(({ value }) => value?.trim())
  titulo: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  @Transform(({ value }) => value?.trim())
  // Regex para evitar scripts
  @Matches(/^[^<>]*$/, {
    message: 'La descripción no puede contener etiquetas HTML',
  })
  descripcion: string;
}
```

---

## 4. Protección contra CSRF (Cross-Site Request Forgery)

### 4.1 ¿Qué es CSRF?

```
CSRF es un ataque donde un sitio malicioso hace que tu navegador
envíe requests no autorizados a otro sitio donde estás autenticado.

Ejemplo:
<img src="http://univote.com/api/votes/123" />
Si usas cookies, esta imagen intentaría emitir un voto sin tu consentimiento.
```

### 4.2 Protección con SameSite Cookies

Ya implementado en la sección 2.2:

```typescript
response.cookie('access_token', result.access_token, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict', // ⭐ Previene CSRF
  maxAge: 8 * 60 * 60 * 1000,
  path: '/',
});
```

**Opciones de SameSite**:

- `strict`: La cookie solo se envía en requests del mismo sitio (más seguro)
- `lax`: Permite en navegación GET, bloquea POST externos
- `none`: No protege contra CSRF (requiere `secure: true`)

### 4.3 CSRF Token (Opcional)

Para mayor seguridad, implementar tokens CSRF:

**Backend**:

```bash
npm install csurf
```

**Archivo**: `Backend/src/main.ts`

```typescript
import * as csurf from 'csurf';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Protección CSRF
  app.use(
    csurf({
      cookie: {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
      },
    })
  );

  await app.listen(3000);
}
bootstrap();
```

---

## 5. Refresh Tokens

### 5.1 Concepto

```
Access Token: Corta duración (15 min - 1 hora)
Refresh Token: Larga duración (7 días - 30 días)

Flujo:
1. Login → Recibe access_token + refresh_token
2. Usar access_token para requests
3. Cuando expira → Usar refresh_token para obtener nuevo access_token
4. Si refresh_token expira → Forzar re-login
```

### 5.2 Actualizar Schema Prisma

**Archivo**: `Backend/prisma/schema.prisma`

```prisma
model RefreshToken {
  id        Int      @id @default(autoincrement())
  token     String   @unique
  userId    Int
  userType  String   // 'administrador', 'votante', 'candidato'
  expiresAt DateTime
  createdAt DateTime @default(now())

  @@index([token])
  @@index([userId, userType])
}
```

**Ejecutar migración**:

```bash
npx prisma migrate dev --name add_refresh_tokens
```

### 5.3 Implementar Refresh Tokens

#### **AuthService - Generar Refresh Token**

**Archivo**: `Backend/src/auth/auth.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto) {
    // ... validación de credenciales ...

    // Generar access token (corta duración)
    const access_token = this.jwtService.sign(payload, {
      expiresIn: '15m', // 15 minutos
    });

    // Generar refresh token (larga duración)
    const refreshToken = crypto.randomBytes(32).toString('hex');
    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7); // 7 días

    // Guardar refresh token en DB
    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        userType: loginDto.tipo,
        expiresAt: refreshTokenExpiry,
      },
    });

    return {
      access_token,
      refresh_token: refreshToken,
      user: { ... },
    };
  }

  async refreshAccessToken(refreshToken: string) {
    // Buscar refresh token en DB
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    // Verificar si expiró
    if (new Date() > tokenRecord.expiresAt) {
      // Eliminar token expirado
      await this.prisma.refreshToken.delete({
        where: { id: tokenRecord.id },
      });
      throw new UnauthorizedException('Refresh token expirado');
    }

    // Buscar usuario
    let user;
    if (tokenRecord.userType === 'administrador') {
      user = await this.prisma.administrador.findUnique({
        where: { id: tokenRecord.userId },
      });
    } else if (tokenRecord.userType === 'votante') {
      user = await this.prisma.voter.findUnique({
        where: { id: tokenRecord.userId },
      });
    } else if (tokenRecord.userType === 'candidato') {
      user = await this.prisma.candidate.findUnique({
        where: { id: tokenRecord.userId },
      });
    }

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    // Generar nuevo access token
    const payload = {
      sub: user.id,
      correo: user.correo,
      tipo: tokenRecord.userType,
      rol: tokenRecord.userType,
    };

    const access_token = this.jwtService.sign(payload, {
      expiresIn: '15m',
    });

    return {
      access_token,
      user: {
        id: user.id,
        correo: user.correo,
        nombre: user.nombre,
        apellido: user.apellido,
        tipo: tokenRecord.userType,
        rol: tokenRecord.userType,
      },
    };
  }

  async revokeRefreshToken(refreshToken: string) {
    await this.prisma.refreshToken.delete({
      where: { token: refreshToken },
    });
  }
}
```

#### **AuthController - Endpoint de Refresh**

```typescript
@Post('refresh')
@HttpCode(HttpStatus.OK)
async refresh(
  @Body('refresh_token') refreshToken: string,
  @Res({ passthrough: true }) response: Response,
) {
  const result = await this.authService.refreshAccessToken(refreshToken);

  // Actualizar cookie con nuevo access token
  response.cookie('access_token', result.access_token, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000, // 15 minutos
    path: '/',
  });

  return {
    user: result.user,
    message: 'Token renovado exitosamente',
  };
}
```

#### **Frontend - Auto-refresh con Axios**

**Archivo**: `Frontend/src/api/axios.js`

```javascript
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Flag para evitar múltiples intentos de refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Si ya se está refrescando, poner en cola
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return axiosInstance(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refresh_token');

      if (!refreshToken) {
        // No hay refresh token, redirigir al login
        localStorage.clear();
        window.location.href = '/Login';
        return Promise.reject(error);
      }

      try {
        // Intentar refrescar el token
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/refresh`,
          { refresh_token: refreshToken },
          { withCredentials: true }
        );

        // Actualizar usuario en localStorage
        localStorage.setItem('user', JSON.stringify(response.data.user));

        isRefreshing = false;
        processQueue(null);

        // Reintentar request original
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        processQueue(refreshError, null);

        // Refresh falló, limpiar y redirigir
        localStorage.clear();
        window.location.href = '/Login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
```

---

## 6. Rate Limiting

### 6.1 Prevenir Ataques de Fuerza Bruta

**Instalación**:

```bash
npm install @nestjs/throttler
```

**Archivo**: `Backend/src/app.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 segundos
        limit: 10, // 10 requests por minuto
      },
    ]),
    // ... otros módulos
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
```

### 6.2 Rate Limiting Personalizado para Login

**Archivo**: `Backend/src/auth/auth.controller.ts`

```typescript
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 intentos por minuto
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response
  ) {
    // ... lógica de login
  }
}
```

---

## 7. Logging y Monitoreo

### 7.1 Logger Personalizado

**Archivo**: `Backend/src/common/logger/custom-logger.service.ts`

```typescript
import { Injectable, LoggerService } from '@nestjs/common';
import * as winston from 'winston';

@Injectable()
export class CustomLoggerService implements LoggerService {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
        }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          ),
        }),
      ],
    });
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context });
  }

  // Métodos específicos para seguridad
  logLoginAttempt(correo: string, tipo: string, success: boolean, ip: string) {
    this.logger.info('Login attempt', {
      correo,
      tipo,
      success,
      ip,
      timestamp: new Date().toISOString(),
    });
  }

  logUnauthorizedAccess(userId: number, resource: string, ip: string) {
    this.logger.warn('Unauthorized access attempt', {
      userId,
      resource,
      ip,
      timestamp: new Date().toISOString(),
    });
  }
}
```

**Instalación**:

```bash
npm install winston
```

### 7.2 Usar Logger en AuthService

```typescript
constructor(
  private readonly prisma: PrismaService,
  private readonly jwtService: JwtService,
  private readonly configService: ConfigService,
  private readonly logger: CustomLoggerService,
) {}

async login(loginDto: LoginDto, ip: string) {
  try {
    // ... lógica de validación ...

    this.logger.logLoginAttempt(loginDto.correo, loginDto.tipo, true, ip);

    return {
      access_token,
      refresh_token,
      user: { ... },
    };
  } catch (error) {
    this.logger.logLoginAttempt(loginDto.correo, loginDto.tipo, false, ip);
    throw error;
  }
}
```

---

## 8. Variables de Entorno Seguras

### 8.1 Archivo .env.example

**Archivo**: `Backend/.env.example`

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/univote"

# JWT
JWT_SECRET="TU_SECRET_MUY_SEGURO_AQUI_MINIMO_32_CARACTERES"
JWT_EXPIRATION="15m"
REFRESH_TOKEN_EXPIRATION="7d"

# CORS
FRONTEND_URL="http://localhost:5173"

# Environment
NODE_ENV="development"

# Rate Limiting
THROTTLE_TTL=60000
THROTTLE_LIMIT=10
```

### 8.2 Generar JWT_SECRET Seguro

```bash
# Linux/Mac
openssl rand -base64 64

# Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

### 8.3 Validar Variables de Entorno

**Instalación**:

```bash
npm install @nestjs/config joi
```

**Archivo**: `Backend/src/config/env.validation.ts`

```typescript
import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  DATABASE_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRATION: Joi.string().default('15m'),
  REFRESH_TOKEN_EXPIRATION: Joi.string().default('7d'),
  FRONTEND_URL: Joi.string().uri().required(),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  THROTTLE_TTL: Joi.number().default(60000),
  THROTTLE_LIMIT: Joi.number().default(10),
});
```

**Archivo**: `Backend/src/app.module.ts`

```typescript
import { ConfigModule } from '@nestjs/config';
import { envValidationSchema } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),
    // ... otros módulos
  ],
})
export class AppModule {}
```

---

## 9. Checklist de Seguridad

### ✅ Autenticación

- [ ] Tokens JWT con firma HS256 o RS256
- [ ] Secret key de al menos 32 caracteres
- [ ] Access tokens de corta duración (15 min - 1 hora)
- [ ] Refresh tokens implementados
- [ ] Logout que invalida tokens

### ✅ Almacenamiento

- [ ] HttpOnly cookies para tokens (recomendado)
- [ ] Secure flag habilitado en producción
- [ ] SameSite=strict para prevenir CSRF
- [ ] No exponer tokens en URLs

### ✅ Protección XSS

- [ ] Sanitización de inputs del usuario
- [ ] Content Security Policy (CSP) configurado
- [ ] Validación en backend con class-validator
- [ ] DOMPurify en frontend para HTML

### ✅ Protección CSRF

- [ ] SameSite cookies
- [ ] CSRF tokens (opcional)
- [ ] Validar origen de requests

### ✅ Validación

- [ ] DTOs con class-validator en todos los endpoints
- [ ] Validación de tipos de usuario
- [ ] Verificar que el usuario existe en cada request
- [ ] Rate limiting en endpoints críticos

### ✅ HTTPS

- [ ] Certificado SSL/TLS configurado
- [ ] Forzar HTTPS en producción
- [ ] HSTS headers habilitados

### ✅ Logging

- [ ] Registrar intentos de login
- [ ] Registrar accesos no autorizados
- [ ] No registrar tokens o contraseñas
- [ ] Logs con timestamps e IP

### ✅ Variables de Entorno

- [ ] .env no está en git (.gitignore)
- [ ] Variables validadas al inicio
- [ ] Diferentes .env para dev/prod
- [ ] Documentación en .env.example

### ✅ Rate Limiting

- [ ] Límite en endpoint de login (5 intentos/min)
- [ ] Límite global (100 requests/min)
- [ ] Límite en endpoints sensibles

### ✅ Otros

- [ ] Helmet configurado
- [ ] CORS restrictivo
- [ ] Timeouts en requests
- [ ] Manejo de errores sin exponer detalles

---

## 10. Guía de Auditoría de Seguridad

### 10.1 Herramientas Recomendadas

```bash
# Escanear vulnerabilidades en dependencias
npm audit

# Arreglar automáticamente
npm audit fix

# Análisis estático de código
npm install -g eslint-plugin-security

# Escanear secrets en código
npm install -g gitleaks
gitleaks detect --source . --verbose
```

### 10.2 Checklist de Revisión Manual

```
1. ¿Los tokens se transmiten solo por HTTPS?
2. ¿Los secretos están en variables de entorno?
3. ¿Los inputs del usuario están sanitizados?
4. ¿Los endpoints críticos tienen rate limiting?
5. ¿Se registran eventos de seguridad?
6. ¿Las cookies tienen httpOnly y secure?
7. ¿Los errores no exponen información sensible?
8. ¿Se validan todos los inputs con DTOs?
9. ¿Se verifica la existencia del usuario en cada request?
10. ¿Los refresh tokens se pueden revocar?
```

---

## 11. Respuesta a Incidentes

### 11.1 Token Comprometido

```
Acciones inmediatas:
1. Revocar todos los refresh tokens del usuario
2. Forzar cambio de contraseña
3. Revisar logs de actividad sospechosa
4. Notificar al usuario
5. Analizar cómo fue comprometido
```

**Implementación**:

```typescript
// AuthService
async revokeAllUserTokens(userId: number, userType: string) {
  await this.prisma.refreshToken.deleteMany({
    where: {
      userId,
      userType,
    },
  });

  this.logger.warn(`All tokens revoked for user ${userId}`, 'Security');
}
```

### 11.2 Detección de Actividad Sospechosa

```typescript
// Middleware para detectar múltiples IPs
@Injectable()
export class SuspiciousActivityMiddleware implements NestMiddleware {
  private userIPs: Map<number, Set<string>> = new Map();

  use(req: Request, res: Response, next: Function) {
    const userId = req['user']?.userId;
    const ip = req.ip;

    if (userId) {
      if (!this.userIPs.has(userId)) {
        this.userIPs.set(userId, new Set());
      }

      const userIPSet = this.userIPs.get(userId);
      userIPSet.add(ip);

      // Si más de 3 IPs diferentes en poco tiempo, alertar
      if (userIPSet.size > 3) {
        this.logger.warn(
          `Suspicious activity: Multiple IPs for user ${userId}`
        );
        // Opcional: Forzar re-autenticación
      }
    }

    next();
  }
}
```

---

## 12. Configuración de Producción

### 12.1 Variables de Entorno de Producción

```env
NODE_ENV=production
DATABASE_URL="postgresql://prod_user:STRONG_PASSWORD@db.example.com:5432/univote_prod"
JWT_SECRET="PRODUCTION_SECRET_VERY_LONG_AND_RANDOM_AT_LEAST_64_CHARACTERS"
JWT_EXPIRATION="15m"
REFRESH_TOKEN_EXPIRATION="7d"
FRONTEND_URL="https://univote.example.com"
THROTTLE_TTL=60000
THROTTLE_LIMIT=10
```

### 12.2 Nginx Configuración (Proxy Reverso)

```nginx
server {
    listen 443 ssl http2;
    server_name api.univote.example.com;

    ssl_certificate /etc/ssl/certs/univote.crt;
    ssl_certificate_key /etc/ssl/private/univote.key;

    # Configuración SSL segura
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Headers de seguridad
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 13. Resumen de Mejores Prácticas

### 🔑 Top 10 Reglas de Oro

1. **Nunca** almacenar contraseñas en texto plano
2. **Siempre** usar HTTPS en producción
3. **Usar** HttpOnly cookies para tokens
4. **Implementar** refresh tokens con rotación
5. **Validar** todos los inputs del usuario
6. **Limitar** intentos de login (rate limiting)
7. **Sanitizar** contenido HTML antes de renderizar
8. **Registrar** eventos de seguridad en logs
9. **Mantener** dependencias actualizadas
10. **Auditar** código regularmente

---

## 14. Próximos Pasos

El siguiente documento ([07-plan-implementacion.md](./07-plan-implementacion.md)) cubrirá:

- Plan de implementación por fases
- Cronograma de migración
- Estrategia de testing
- Rollback plan
- Capacitación del equipo

---

**Documento**: 06-seguridad-mejores-practicas.md  
**Versión**: 1.0  
**Última actualización**: Octubre 2025  
**Anterior**: [05-implementacion-frontend.md](./05-implementacion-frontend.md)  
**Siguiente**: [07-plan-implementacion.md](./07-plan-implementacion.md)
