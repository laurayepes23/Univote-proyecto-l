# 04 - Implementación en el Backend (NestJS)

## 🔧 Introducción

Este documento proporciona una guía paso a paso para implementar JWT en el backend de UniVote usando NestJS, Passport y JWT.

---

## 1. Instalación de Dependencias

### 1.1 Paquetes Necesarios

```bash
# Navegar al directorio del backend
cd Backend

# Instalar dependencias de JWT y Passport
npm install @nestjs/jwt @nestjs/passport passport passport-jwt

# Instalar tipos de TypeScript
npm install --save-dev @types/passport-jwt
```

### 1.2 Dependencias Explicadas

| Paquete               | Propósito                          |
| --------------------- | ---------------------------------- |
| `@nestjs/jwt`         | Módulo de NestJS para manejar JWT  |
| `@nestjs/passport`    | Integración de Passport con NestJS |
| `passport`            | Framework de autenticación         |
| `passport-jwt`        | Estrategia JWT para Passport       |
| `@types/passport-jwt` | Tipos de TypeScript                |

---

## 2. Configuración del Módulo Auth

### 2.1 Crear la Estructura de Archivos

```bash
# Crear módulo Auth
nest g module auth
nest g service auth
nest g controller auth

# Crear subdirectorios
mkdir -p src/auth/strategies
mkdir -p src/auth/guards
mkdir -p src/auth/decorators
mkdir -p src/auth/dto
```

### 2.2 Configurar Variables de Entorno

**Archivo**: `Backend/.env.local`

```env
# Configuración JWT
JWT_SECRET=tu_secreto_super_seguro_de_al_menos_32_caracteres_aqui
JWT_EXPIRATION_ADMIN=8h
JWT_EXPIRATION_VOTER=24h
JWT_EXPIRATION_CANDIDATE=12h

# Base de datos (ya existente)
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/univote?schema=public"

# Puerto
PORT=3000

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

**⚠️ Importante**: Nunca subas el archivo `.env` a control de versiones.

### 2.3 Crear DTOs

#### A) Login DTO

**Archivo**: `src/auth/dto/login.dto.ts`

```typescript
import { IsEmail, IsString, MinLength, IsEnum } from 'class-validator';

export enum TipoUsuario {
  ADMINISTRADOR = 'administrador',
  VOTANTE = 'votante',
  CANDIDATO = 'candidato',
}

export class LoginDto {
  @IsEmail({}, { message: 'El correo debe ser válido' })
  correo: string;

  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  contrasena: string;

  @IsEnum(TipoUsuario, { message: 'El tipo de usuario no es válido' })
  tipo: TipoUsuario;
}
```

#### B) Auth Response DTO

**Archivo**: `src/auth/dto/auth-response.dto.ts`

```typescript
export class AuthResponseDto {
  access_token: string;
  user: {
    id: number;
    correo: string;
    nombre: string;
    apellido: string;
    rol: string;
    tipo: string;
  };
}
```

---

## 3. Implementar el Servicio de Autenticación

### 3.1 Auth Service Completo

**Archivo**: `src/auth/auth.service.ts`

```typescript
import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto, TipoUsuario } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService
  ) {}

  /**
   * Método principal de login que autentica usuarios
   * según su tipo (administrador, votante, candidato)
   */
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { correo, contrasena, tipo } = loginDto;

    // Buscar usuario según el tipo
    let usuario: any;
    let rol: string;

    switch (tipo) {
      case TipoUsuario.ADMINISTRADOR:
        usuario = await this.prisma.administrador.findUnique({
          where: { correo_admin: correo },
        });
        rol = 'administrador';
        break;

      case TipoUsuario.VOTANTE:
        usuario = await this.prisma.voter.findUnique({
          where: { correo_voter: correo },
          include: { role: true, career: true },
        });

        // Validar que el votante esté activo
        if (usuario && usuario.estado_voter !== 'activo') {
          throw new UnauthorizedException(
            'Su cuenta no está activa. Contacte al administrador.'
          );
        }

        rol = usuario?.role?.nombre_role || 'votante';
        break;

      case TipoUsuario.CANDIDATO:
        usuario = await this.prisma.candidate.findUnique({
          where: { correo_candidate: correo },
          include: { role: true, career: true },
        });

        // Validar que el candidato esté aprobado
        if (usuario && usuario.estado_candidate !== 'aprobado') {
          throw new UnauthorizedException(
            'Su candidatura no ha sido aprobada aún.'
          );
        }

        rol = usuario?.role?.nombre_role || 'candidato';
        break;

      default:
        throw new BadRequestException('Tipo de usuario no válido');
    }

    // Validar que el usuario existe
    if (!usuario) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    // Obtener campo de contraseña según el tipo
    const passwordField = this.getPasswordField(tipo);
    const hashedPassword = usuario[passwordField];

    // Validar contraseña
    const isPasswordValid = await bcrypt.compare(contrasena, hashedPassword);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    // Generar token JWT
    const payload = this.createJwtPayload(usuario, tipo, rol);
    const expiresIn = this.getExpirationTime(tipo);

    const access_token = this.jwtService.sign(payload, {
      expiresIn,
      secret: this.configService.get<string>('JWT_SECRET'),
    });

    // Construir respuesta
    return {
      access_token,
      user: this.buildUserResponse(usuario, tipo, rol),
    };
  }

  /**
   * Valida un token JWT y retorna el usuario
   */
  async validateUser(payload: any): Promise<any> {
    const { sub, tipo } = payload;

    let usuario: any;

    switch (tipo) {
      case 'administrador':
        usuario = await this.prisma.administrador.findUnique({
          where: { id_admin: parseInt(sub) },
        });
        break;

      case 'votante':
        usuario = await this.prisma.voter.findUnique({
          where: { id_voter: parseInt(sub) },
          include: { role: true },
        });
        break;

      case 'candidato':
        usuario = await this.prisma.candidate.findUnique({
          where: { id_candidate: parseInt(sub) },
          include: { role: true },
        });
        break;

      default:
        return null;
    }

    if (!usuario) {
      return null;
    }

    return {
      id: sub,
      correo: payload.correo,
      rol: payload.rol,
      tipo: payload.tipo,
      nombre: payload.nombre,
      apellido: payload.apellido,
    };
  }

  /**
   * Crear el payload del JWT
   */
  private createJwtPayload(usuario: any, tipo: TipoUsuario, rol: string) {
    const nameField = this.getNameField(tipo);
    const lastNameField = this.getLastNameField(tipo);
    const idField = this.getIdField(tipo);
    const emailField = this.getEmailField(tipo);

    return {
      sub: usuario[idField].toString(),
      correo: usuario[emailField],
      rol: rol,
      tipo: tipo,
      nombre: usuario[nameField],
      apellido: usuario[lastNameField],
      iat: Math.floor(Date.now() / 1000),
    };
  }

  /**
   * Construir respuesta de usuario
   */
  private buildUserResponse(usuario: any, tipo: TipoUsuario, rol: string) {
    const nameField = this.getNameField(tipo);
    const lastNameField = this.getLastNameField(tipo);
    const idField = this.getIdField(tipo);
    const emailField = this.getEmailField(tipo);

    return {
      id: usuario[idField],
      correo: usuario[emailField],
      nombre: usuario[nameField],
      apellido: usuario[lastNameField],
      rol: rol,
      tipo: tipo,
    };
  }

  /**
   * Obtener tiempo de expiración según tipo de usuario
   */
  private getExpirationTime(tipo: TipoUsuario): string {
    switch (tipo) {
      case TipoUsuario.ADMINISTRADOR:
        return this.configService.get<string>('JWT_EXPIRATION_ADMIN') || '8h';
      case TipoUsuario.VOTANTE:
        return this.configService.get<string>('JWT_EXPIRATION_VOTER') || '24h';
      case TipoUsuario.CANDIDATO:
        return (
          this.configService.get<string>('JWT_EXPIRATION_CANDIDATE') || '12h'
        );
      default:
        return '8h';
    }
  }

  /**
   * Helpers para obtener nombres de campos según el tipo
   */
  private getPasswordField(tipo: TipoUsuario): string {
    const fields = {
      [TipoUsuario.ADMINISTRADOR]: 'contrasena_admin',
      [TipoUsuario.VOTANTE]: 'contrasena_voter',
      [TipoUsuario.CANDIDATO]: 'contrasena_candidate',
    };
    return fields[tipo];
  }

  private getNameField(tipo: TipoUsuario): string {
    const fields = {
      [TipoUsuario.ADMINISTRADOR]: 'nombre_admin',
      [TipoUsuario.VOTANTE]: 'nombre_voter',
      [TipoUsuario.CANDIDATO]: 'nombre_candidate',
    };
    return fields[tipo];
  }

  private getLastNameField(tipo: TipoUsuario): string {
    const fields = {
      [TipoUsuario.ADMINISTRADOR]: 'apellido_admin',
      [TipoUsuario.VOTANTE]: 'apellido_voter',
      [TipoUsuario.CANDIDATO]: 'apellido_candidate',
    };
    return fields[tipo];
  }

  private getIdField(tipo: TipoUsuario): string {
    const fields = {
      [TipoUsuario.ADMINISTRADOR]: 'id_admin',
      [TipoUsuario.VOTANTE]: 'id_voter',
      [TipoUsuario.CANDIDATO]: 'id_candidate',
    };
    return fields[tipo];
  }

  private getEmailField(tipo: TipoUsuario): string {
    const fields = {
      [TipoUsuario.ADMINISTRADOR]: 'correo_admin',
      [TipoUsuario.VOTANTE]: 'correo_voter',
      [TipoUsuario.CANDIDATO]: 'correo_candidate',
    };
    return fields[tipo];
  }
}
```

---

## 4. Implementar la Estrategia JWT

### 4.1 JWT Strategy

**Archivo**: `src/auth/strategies/jwt.strategy.ts`

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  /**
   * Este método es llamado automáticamente después de que
   * Passport verifica la firma del token. Aquí validamos
   * que el usuario aún existe en la base de datos.
   */
  async validate(payload: any) {
    const user = await this.authService.validateUser(payload);

    if (!user) {
      throw new UnauthorizedException('Usuario no válido o token expirado');
    }

    // Este objeto estará disponible en request.user
    return user;
  }
}
```

---

## 5. Implementar Guards

### 5.1 JWT Auth Guard

**Archivo**: `src/auth/guards/jwt-auth.guard.ts`

```typescript
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(
    context: ExecutionContext
  ): boolean | Promise<boolean> | Observable<boolean> {
    // Aquí podrías agregar lógica adicional antes de la validación
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // Si hay un error o no hay usuario, lanza excepción
    if (err || !user) {
      throw err || new UnauthorizedException('Token inválido o expirado');
    }
    return user;
  }
}
```

### 5.2 Roles Guard

**Archivo**: `src/auth/guards/roles.guard.ts`

```typescript
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Obtener los roles requeridos del decorator
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()]
    );

    // Si no hay roles requeridos, permitir acceso
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Obtener usuario del request (ya validado por JwtAuthGuard)
    const { user } = context.switchToHttp().getRequest();

    // Verificar si el usuario tiene alguno de los roles requeridos
    const hasRole = requiredRoles.some((role) => user.rol === role);

    if (!hasRole) {
      throw new ForbiddenException(
        `Se requiere uno de los siguientes roles: ${requiredRoles.join(', ')}`
      );
    }

    return true;
  }
}
```

---

## 6. Crear Decorators

### 6.1 Roles Decorator

**Archivo**: `src/auth/decorators/roles.decorator.ts`

```typescript
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Decorator para especificar los roles permitidos en un endpoint
 * Uso: @Roles('administrador', 'candidato')
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
```

### 6.2 Current User Decorator

**Archivo**: `src/auth/decorators/current-user.decorator.ts`

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator para extraer el usuario actual del request
 * Uso: @CurrentUser() user: any
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  }
);
```

---

## 7. Implementar el Controller

### 7.1 Auth Controller

**Archivo**: `src/auth/auth.controller.ts`

```typescript
import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Endpoint de login
   * POST /auth/login
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  /**
   * Endpoint para verificar el token actual
   * GET /auth/profile
   * Requiere autenticación
   */
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@CurrentUser() user: any) {
    return {
      message: 'Perfil del usuario autenticado',
      user,
    };
  }

  /**
   * Endpoint de logout (lado del cliente)
   * GET /auth/logout
   */
  @Get('logout')
  @UseGuards(JwtAuthGuard)
  logout() {
    return {
      message: 'Sesión cerrada. Elimine el token del cliente.',
    };
  }
}
```

---

## 8. Configurar el Módulo Auth

### 8.1 Auth Module

**Archivo**: `src/auth/auth.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: '24h', // Valor por defecto
        },
      }),
      inject: [ConfigService],
    }),
    PrismaModule,
    ConfigModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule, PassportModule],
})
export class AuthModule {}
```

---

## 9. Integrar con App Module

### 9.1 Actualizar App Module

**Archivo**: `src/app.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Módulos existentes
import { VotersModule } from './voters/voters.module';
import { AdministratorsModule } from './administrators/administrators.module';
import { PrismaModule } from './prisma/prisma.module';
import { CandidatesModule } from './candidates/candidates.module';
import { ElectionsModule } from './elections/elections.module';
import { RolesModule } from './role/role.module';
import { CareersModule } from './careers/careers.module';
import { ProposalsModule } from './proposals/proposals.module';
import { ResultsModule } from './results/results.module';
import { VotesModule } from './votes/votes.module';

// Nuevo módulo de autenticación
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Hace que ConfigModule esté disponible globalmente
      envFilePath: '.env.local', // Archivo de variables de entorno
    }),
    AuthModule, // ← Agregar el módulo de autenticación
    VotersModule,
    AdministratorsModule,
    PrismaModule,
    CandidatesModule,
    VotesModule,
    ElectionsModule,
    RolesModule,
    CareersModule,
    ProposalsModule,
    ResultsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

---

## 10. Proteger Endpoints Existentes

### 10.1 Ejemplo: Proteger Elections Controller

**Archivo**: `src/elections/elections.controller.ts`

```typescript
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ElectionsService } from './elections.service';
import { CreateElectionDto } from './dto/create-election.dto';
import { UpdateElectionDto } from './dto/update-election.dto';

// Importar guards y decorators
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('elections')
@UseGuards(JwtAuthGuard) // ← Proteger todo el controller
export class ElectionsController {
  constructor(private readonly electionsService: ElectionsService) {}

  /**
   * Solo administradores pueden crear elecciones
   */
  @Post()
  @UseGuards(RolesGuard)
  @Roles('administrador')
  create(
    @Body() createElectionDto: CreateElectionDto,
    @CurrentUser() user: any
  ) {
    console.log(`Elección creada por administrador: ${user.correo}`);
    return this.electionsService.create(createElectionDto);
  }

  /**
   * Cualquier usuario autenticado puede ver elecciones
   */
  @Get()
  findAll() {
    return this.electionsService.findAll();
  }

  /**
   * Cualquier usuario autenticado puede ver una elección específica
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.electionsService.findOne(+id);
  }

  /**
   * Solo administradores pueden actualizar elecciones
   */
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('administrador')
  update(
    @Param('id') id: string,
    @Body() updateElectionDto: UpdateElectionDto
  ) {
    return this.electionsService.update(+id, updateElectionDto);
  }

  /**
   * Solo administradores pueden eliminar elecciones
   */
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('administrador')
  remove(@Param('id') id: string) {
    return this.electionsService.remove(+id);
  }
}
```

### 10.2 Ejemplo: Proteger Votes Controller

**Archivo**: `src/votes/votes.controller.ts`

```typescript
import {
  Controller,
  Post,
  Body,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { VotesService } from './votes.service';
import { CreateVoteDto } from './dto/create-vote.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('votes')
@UseGuards(JwtAuthGuard) // Todo el controller requiere autenticación
export class VotesController {
  constructor(private readonly votesService: VotesService) {}

  /**
   * Solo votantes pueden emitir votos
   * El ID del votante se toma del token JWT
   */
  @Post()
  @UseGuards(RolesGuard)
  @Roles('votante')
  async create(@Body() createVoteDto: CreateVoteDto, @CurrentUser() user: any) {
    // El ID del votante viene del token (no se puede falsificar)
    const voterId = parseInt(user.id);

    // Verificar que no haya votado antes en esta elección
    const hasVoted = await this.votesService.hasUserVoted(
      voterId,
      createVoteDto.electionId
    );

    if (hasVoted) {
      throw new ForbiddenException('Ya has emitido tu voto en esta elección');
    }

    // Crear el voto con el ID real del votante
    return this.votesService.create({
      ...createVoteDto,
      voterId, // ← ID desde el token, no del body
    });
  }
}
```

---

## 11. Actualizar Servicios Existentes

### 11.1 Eliminar Métodos de Login Antiguos

Ahora que tenemos un módulo centralizado de autenticación, debemos eliminar los métodos `login()` de los servicios individuales.

**Archivo**: `src/administrators/administrators.service.ts`

```typescript
// ❌ ELIMINAR este método
// async login(correo: string, contrasena: string) { ... }

// El login ahora se maneja en AuthService
```

Lo mismo para `voters.service.ts` y `candidates.service.ts`.

### 11.2 Mantener Solo el Registro

Los servicios individuales deben mantener solo los métodos de registro (con hash de contraseña):

```typescript
async create(createAdministratorDto: CreateAdministratorDto) {
  // Hash de contraseña
  const hashedPassword = await bcrypt.hash(
    createAdministratorDto.contrasena_admin,
    10,
  );

  return this.prisma.administrador.create({
    data: {
      ...createAdministratorDto,
      contrasena_admin: hashedPassword,
    },
  });
}
```

---

## 12. Probar la Implementación

### 12.1 Compilar y Ejecutar

```bash
# Compilar el proyecto
npm run build

# Ejecutar en modo desarrollo
npm run start:dev
```

### 12.2 Probar con cURL o Postman

#### A) Login de Administrador

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "correo": "admin@univote.edu",
    "contrasena": "password123",
    "tipo": "administrador"
  }'
```

**Respuesta Esperada**:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "correo": "admin@univote.edu",
    "nombre": "Juan",
    "apellido": "Pérez",
    "rol": "administrador",
    "tipo": "administrador"
  }
}
```

#### B) Acceder a Endpoint Protegido

```bash
# Usar el token recibido
curl -X GET http://localhost:3000/elections \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### C) Intentar Sin Token (Debe Fallar)

```bash
curl -X GET http://localhost:3000/elections
```

**Respuesta Esperada**:

```json
{
  "statusCode": 401,
  "message": "Token inválido o expirado"
}
```

---

## 13. Manejo de Errores Comunes

### 13.1 "JWT_SECRET is not defined"

**Problema**: No se encontró la variable de entorno.

**Solución**:

```bash
# Verificar que .env.local existe y tiene JWT_SECRET
cat .env.local | grep JWT_SECRET

# Si no existe, agregarlo
echo "JWT_SECRET=$(node -e 'console.log(require(\"crypto\").randomBytes(64).toString(\"hex\"))')" >> .env.local
```

### 13.2 "Cannot find module '@nestjs/jwt'"

**Problema**: Dependencias no instaladas.

**Solución**:

```bash
npm install @nestjs/jwt @nestjs/passport passport passport-jwt
```

### 13.3 "User undefined in RolesGuard"

**Problema**: RolesGuard se ejecuta antes que JwtAuthGuard.

**Solución**: Asegurar el orden correcto:

```typescript
@UseGuards(JwtAuthGuard, RolesGuard) // JwtAuthGuard PRIMERO
@Roles('administrador')
```

---

## 14. Checklist de Implementación

### ✅ Dependencias

- [ ] Instalar `@nestjs/jwt`
- [ ] Instalar `@nestjs/passport`
- [ ] Instalar `passport-jwt`
- [ ] Instalar tipos `@types/passport-jwt`

### ✅ Configuración

- [ ] Crear `.env.local` con `JWT_SECRET`
- [ ] Configurar `ConfigModule` en App Module
- [ ] Definir tiempos de expiración

### ✅ Módulo Auth

- [ ] Crear `AuthModule`
- [ ] Crear `AuthService`
- [ ] Crear `AuthController`
- [ ] Crear DTOs (Login, AuthResponse)

### ✅ Estrategia y Guards

- [ ] Implementar `JwtStrategy`
- [ ] Crear `JwtAuthGuard`
- [ ] Crear `RolesGuard`

### ✅ Decorators

- [ ] Crear `@Roles()` decorator
- [ ] Crear `@CurrentUser()` decorator

### ✅ Integración

- [ ] Importar `AuthModule` en `AppModule`
- [ ] Proteger controllers existentes
- [ ] Eliminar métodos login antiguos
- [ ] Actualizar servicios

### ✅ Pruebas

- [ ] Probar login con Postman
- [ ] Verificar generación de token
- [ ] Probar endpoints protegidos
- [ ] Verificar autorización por roles

---

## 15. Próximos Pasos

Con el backend completamente implementado, el siguiente documento ([05-implementacion-frontend.md](./05-implementacion-frontend.md)) cubrirá:

- Interceptores HTTP en React
- Context API para manejo de autenticación
- Protección de rutas
- Almacenamiento seguro de tokens
- Renovación automática de tokens
- Manejo de errores 401/403

---

**Documento**: 04-implementacion-backend.md  
**Versión**: 1.0  
**Última actualización**: Octubre 2025  
**Anterior**: [03-arquitectura-propuesta.md](./03-arquitectura-propuesta.md)  
**Siguiente**: [05-implementacion-frontend.md](./05-implementacion-frontend.md)
