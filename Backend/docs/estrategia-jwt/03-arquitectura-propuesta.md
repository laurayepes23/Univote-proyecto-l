# 03 - Arquitectura Propuesta para JWT

## 🏛️ Introducción

Este documento presenta el diseño arquitectónico completo para la implementación de autenticación y autorización con JWT en el sistema UniVote.

---

## 1. Visión General de la Arquitectura

### 1.1 Principios de Diseño

La arquitectura propuesta se basa en los siguientes principios:

| Principio                           | Descripción                     | Beneficio      |
| ----------------------------------- | ------------------------------- | -------------- |
| **Separación de Responsabilidades** | Módulo Auth independiente       | Mantenibilidad |
| **Stateless**                       | Sin sesiones en servidor        | Escalabilidad  |
| **Reutilizable**                    | Guards y strategies compartidos | DRY            |
| **Seguro por Diseño**               | Validación en cada capa         | Seguridad      |
| **Extensible**                      | Fácil agregar nuevos roles      | Flexibilidad   |

### 1.2 Diagrama de Arquitectura General

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                         │
├──────────────────┬──────────────────┬──────────────────────┤
│  Auth Context    │  API Interceptor │  Protected Routes    │
│  - Estado global │  - Agregar token │  - Guards por rol    │
│  - Login/Logout  │  - Handle 401    │  - Redirect login    │
└──────────────────┴──────────────────┴──────────────────────┘
                            ↕ HTTP
┌─────────────────────────────────────────────────────────────┐
│                     BACKEND (NestJS)                         │
├──────────────────────────────────────────────────────────────┤
│                      Auth Module                             │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │ Auth       │  │  JWT       │  │  Passport  │            │
│  │ Controller │─▶│  Service   │◀─│  Strategy  │            │
│  └────────────┘  └────────────┘  └────────────┘            │
├──────────────────────────────────────────────────────────────┤
│                      Guards Layer                            │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │ JWT Auth   │  │  Roles     │  │  Custom    │            │
│  │ Guard      │  │  Guard     │  │  Guards    │            │
│  └────────────┘  └────────────┘  └────────────┘            │
├──────────────────────────────────────────────────────────────┤
│              Protected Controllers                           │
│  ┌─────────┐ ┌──────────┐ ┌─────────┐ ┌──────────┐        │
│  │Elections│ │Candidates│ │ Votes   │ │ Results  │        │
│  └─────────┘ └──────────┘ └─────────┘ └──────────┘        │
├──────────────────────────────────────────────────────────────┤
│                    Services Layer                            │
│  ┌────────────────────────────────────────────────┐         │
│  │         Prisma Service (Database)              │         │
│  └────────────────────────────────────────────────┘         │
└──────────────────────────────────────────────────────────────┘
                            ↕
                    ┌──────────────┐
                    │  PostgreSQL  │
                    └──────────────┘
```

---

## 2. Componentes del Sistema

### 2.1 Módulo de Autenticación (Auth Module)

#### Propósito

Centralizar toda la lógica de autenticación y generación de tokens JWT.

#### Estructura

```
src/auth/
├── auth.module.ts          # Módulo principal
├── auth.controller.ts      # Endpoints de autenticación
├── auth.service.ts         # Lógica de negocio
├── strategies/
│   └── jwt.strategy.ts     # Estrategia Passport JWT
├── guards/
│   ├── jwt-auth.guard.ts   # Guard de autenticación
│   └── roles.guard.ts      # Guard de autorización
├── decorators/
│   ├── roles.decorator.ts  # Decorator @Roles()
│   └── current-user.decorator.ts  # Decorator @CurrentUser()
└── dto/
    ├── login.dto.ts        # DTO de login
    └── auth-response.dto.ts # DTO de respuesta
```

#### Responsabilidades

1. **Autenticación**

   - Validar credenciales
   - Generar tokens JWT
   - Renovar tokens (refresh)

2. **Autorización**

   - Validar tokens en cada petición
   - Verificar roles y permisos
   - Extraer información del usuario

3. **Seguridad**
   - Hash de contraseñas (delegado a módulos específicos)
   - Validación de firma de tokens
   - Control de expiración

### 2.2 JWT Strategy (Passport)

#### Propósito

Definir cómo se valida un token JWT en cada petición.

#### Configuración

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    // Payload ya está decodificado y verificado por Passport
    return {
      id: payload.sub,
      correo: payload.correo,
      rol: payload.rol,
      tipo: payload.tipo, // 'administrador', 'votante', 'candidato'
    };
  }
}
```

#### Proceso de Validación

```
┌─────────────────────────────────────────────────────────┐
│              Proceso de Validación JWT                  │
└─────────────────────────────────────────────────────────┘

1. Request llega al servidor
   ↓
2. Guard extrae token del header "Authorization: Bearer xxx"
   ↓
3. Passport JWT verifica la firma del token
   ↓
4. ¿Firma válida?
   ├─ No → UnauthorizedException (401)
   └─ Sí → Continuar
   ↓
5. Verifica expiración (exp claim)
   ↓
6. ¿Token expirado?
   ├─ Sí → UnauthorizedException (401)
   └─ No → Continuar
   ↓
7. Extrae payload del token
   ↓
8. Ejecuta método validate() de la Strategy
   ↓
9. Retorna objeto de usuario
   ↓
10. Usuario disponible en request.user
```

### 2.3 Guards (Guardias)

#### A) JWT Auth Guard

**Propósito**: Verificar que la petición tiene un token JWT válido.

```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

**Uso**:

```typescript
@UseGuards(JwtAuthGuard)
@Get('protected')
getProtectedResource() {
  return 'Este endpoint está protegido';
}
```

#### B) Roles Guard

**Propósito**: Verificar que el usuario tiene el rol requerido.

```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true; // Sin requisito de rol
    }

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.includes(user.rol);
  }
}
```

**Uso**:

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('administrador')
@Post()
createElection() {
  return 'Solo administradores';
}
```

#### C) Orden de Ejecución de Guards

```
Request
  ↓
┌──────────────────┐
│  JwtAuthGuard    │  ← Verifica token válido
└────────┬─────────┘
         │ ✓ Token OK
         ↓
┌──────────────────┐
│  RolesGuard      │  ← Verifica rol permitido
└────────┬─────────┘
         │ ✓ Rol OK
         ↓
┌──────────────────┐
│   Controller     │  ← Ejecuta lógica
└──────────────────┘
```

---

## 3. Flujos de Autenticación

### 3.1 Flujo de Login

```
┌─────────┐                 ┌─────────┐                 ┌──────────┐
│ Cliente │                 │  Auth   │                 │  Prisma  │
│         │                 │ Service │                 │  Service │
└────┬────┘                 └────┬────┘                 └────┬─────┘
     │                           │                           │
     │ 1. POST /auth/login       │                           │
     │    {correo, contraseña,   │                           │
     │     tipo: "votante"}      │                           │
     ├──────────────────────────>│                           │
     │                           │                           │
     │                           │ 2. Buscar usuario por     │
     │                           │    correo y tipo          │
     │                           ├──────────────────────────>│
     │                           │                           │
     │                           │ 3. Usuario encontrado     │
     │                           │<──────────────────────────┤
     │                           │                           │
     │                           │ 4. Validar contraseña     │
     │                           │    (bcrypt.compare)       │
     │                           │                           │
     │                           │ 5. Crear payload JWT      │
     │                           │    {                      │
     │                           │      sub: id,             │
     │                           │      correo: correo,      │
     │                           │      rol: rol,            │
     │                           │      tipo: tipo           │
     │                           │    }                      │
     │                           │                           │
     │                           │ 6. Firmar token           │
     │                           │    jwtService.sign()      │
     │                           │                           │
     │ 7. Respuesta              │                           │
     │    {                      │                           │
     │      access_token: "xxx", │                           │
     │      user: {              │                           │
     │        id, nombre, rol    │                           │
     │      }                    │                           │
     │    }                      │                           │
     │<──────────────────────────┤                           │
     │                           │                           │
     │ 8. Guardar token          │                           │
     │    localStorage + Context │                           │
     │                           │                           │
```

### 3.2 Flujo de Petición Autenticada

```
┌─────────┐                 ┌─────────┐                 ┌──────────┐
│ Cliente │                 │  Guard  │                 │Controller│
│         │                 │   JWT   │                 │          │
└────┬────┘                 └────┬────┘                 └────┬─────┘
     │                           │                           │
     │ 1. GET /api/elections     │                           │
     │    Authorization: Bearer  │                           │
     │    eyJhbGc...             │                           │
     ├──────────────────────────>│                           │
     │                           │                           │
     │                           │ 2. Extraer token          │
     │                           │    del header             │
     │                           │                           │
     │                           │ 3. Verificar firma        │
     │                           │    con JWT_SECRET         │
     │                           │                           │
     │                           │ 4. ¿Firma válida?         │
     │                           ├─ No ─> 401 Unauthorized   │
     │                           │                           │
     │                           │ 5. Verificar expiración   │
     │                           │    (exp claim)            │
     │                           │                           │
     │                           │ 6. ¿Expirado?             │
     │                           ├─ Sí ─> 401 Token expired  │
     │                           │                           │
     │                           │ 7. Decodificar payload    │
     │                           │                           │
     │                           │ 8. Ejecutar validate()    │
     │                           │    de Strategy            │
     │                           │                           │
     │                           │ 9. Agregar user a request │
     │                           │    req.user = {id, rol}   │
     │                           │                           │
     │                           │ 10. Permitir acceso       │
     │                           ├──────────────────────────>│
     │                           │                           │
     │                           │                           │ 11. Ejecutar
     │                           │                           │     lógica
     │                           │                           │
     │ 12. Respuesta con datos   │                           │
     │<──────────────────────────┴───────────────────────────┤
     │                           │                           │
```

### 3.3 Flujo de Autorización por Roles

```
┌─────────┐           ┌─────────┐           ┌──────────┐           ┌──────────┐
│ Cliente │           │  JWT    │           │  Roles   │           │Controller│
│         │           │  Guard  │           │  Guard   │           │          │
└────┬────┘           └────┬────┘           └────┬─────┘           └────┬─────┘
     │                     │                     │                       │
     │ POST /elections     │                     │                       │
     │ Bearer token        │                     │                       │
     ├────────────────────>│                     │                       │
     │                     │                     │                       │
     │                     │ Validar token       │                       │
     │                     │                     │                       │
     │                     │ ✓ Token válido      │                       │
     │                     │ req.user = {        │                       │
     │                     │   id: 1,            │                       │
     │                     │   rol: "votante"    │                       │
     │                     │ }                   │                       │
     │                     ├────────────────────>│                       │
     │                     │                     │                       │
     │                     │                     │ Leer @Roles decorator │
     │                     │                     │ Required: "administrador"
     │                     │                     │                       │
     │                     │                     │ Comparar roles        │
     │                     │                     │ "votante" ≠ "administrador"
     │                     │                     │                       │
     │                     │ 403 Forbidden       │                       │
     │<────────────────────┴─────────────────────┤                       │
     │ {                   │                     │                       │
     │   message:          │                     │                       │
     │   "No autorizado"   │                     │                       │
     │ }                   │                     │                       │
     │                     │                     │                       │
```

---

## 4. Estructura del Token JWT

### 4.1 Payload Propuesto

```json
{
  "sub": "123",
  "correo": "juan.perez@univote.edu",
  "rol": "votante",
  "tipo": "votante",
  "nombre": "Juan",
  "apellido": "Pérez",
  "iat": 1698765432,
  "exp": 1698851832
}
```

### 4.2 Claims Explicados

| Claim        | Tipo   | Descripción                        | Ejemplo                                 |
| ------------ | ------ | ---------------------------------- | --------------------------------------- |
| **sub**      | string | Subject (ID del usuario)           | "123"                                   |
| **correo**   | string | Email del usuario                  | "admin@univote.edu"                     |
| **rol**      | string | Rol del usuario                    | "administrador"                         |
| **tipo**     | string | Tipo de usuario                    | "administrador", "votante", "candidato" |
| **nombre**   | string | Nombre del usuario                 | "Juan"                                  |
| **apellido** | string | Apellido del usuario               | "Pérez"                                 |
| **iat**      | number | Issued At (momento de creación)    | 1698765432                              |
| **exp**      | number | Expiration (momento de expiración) | 1698851832                              |

### 4.3 Tiempos de Expiración Recomendados

```typescript
const JWT_EXPIRATION = {
  administrador: '8h', // Uso frecuente, sesión de trabajo
  votante: '24h', // Uso ocasional, puede volver a votar
  candidato: '12h', // Uso moderado, gestión de campaña
};
```

### 4.4 ¿Qué NO incluir en el Token?

❌ **Nunca incluir:**

- Contraseñas (hasheadas o no)
- Números de documento completos
- Información bancaria
- Datos médicos
- Cualquier dato altamente sensible

✅ **Sí incluir:**

- ID de usuario
- Email
- Rol
- Nombre y apellido
- Información de perfil público

---

## 5. Arquitectura de Módulos

### 5.1 Diagrama de Dependencias

```
┌────────────────────────────────────────────────────────┐
│                     App Module                          │
└────────────────────────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
          ↓               ↓               ↓
┌─────────────────┐ ┌──────────┐ ┌──────────────┐
│   Auth Module   │ │  Prisma  │ │Config Module │
│                 │ │  Module  │ │              │
│ - AuthService   │ │          │ │              │
│ - JwtStrategy   │ └──────────┘ └──────────────┘
│ - Guards        │       ↑
└────────┬────────┘       │
         │                │
         └────────────────┘
         (usa PrismaService)
              │
              │ (exporta Guards)
              │
    ┌─────────┼─────────┬──────────┐
    ↓         ↓         ↓          ↓
┌─────────┐ ┌──────┐ ┌──────┐ ┌──────┐
│Elections│ │Voters│ │Votes │ │Etc...│
│ Module  │ │Module│ │Module│ │      │
└─────────┘ └──────┘ └──────┘ └──────┘
(usan JwtAuthGuard y RolesGuard)
```

### 5.2 Configuración de Módulos

#### Auth Module

```typescript
@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: '24h',
        },
      }),
      inject: [ConfigService],
    }),
    PrismaModule,
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
```

---

## 6. Patrones de Diseño Aplicados

### 6.1 Strategy Pattern (Passport)

**Propósito**: Encapsular la lógica de validación de diferentes estrategias de autenticación.

**Beneficio**: Fácil agregar nuevas estrategias (Local, OAuth, etc.) sin modificar código existente.

### 6.2 Guard Pattern (NestJS)

**Propósito**: Interceptar peticiones antes de llegar al controller para validar autenticación/autorización.

**Beneficio**: Separación de responsabilidades, código más limpio.

### 6.3 Decorator Pattern

**Propósito**: Agregar metadata a routes para especificar requisitos de autorización.

**Beneficio**: Sintaxis declarativa, fácil de leer y mantener.

```typescript
@Roles('administrador', 'candidato')
@UseGuards(JwtAuthGuard, RolesGuard)
@Post()
create() {
  // Solo administradores y candidatos pueden crear
}
```

### 6.4 Dependency Injection

**Propósito**: Inyectar servicios necesarios en constructores.

**Beneficio**: Testabilidad, bajo acoplamiento, alta cohesión.

---

## 7. Configuración de Seguridad

### 7.1 Variables de Entorno

```env
# JWT Configuration
JWT_SECRET=tu_clave_super_secreta_de_al_menos_32_caracteres
JWT_EXPIRATION_ADMIN=8h
JWT_EXPIRATION_VOTER=24h
JWT_EXPIRATION_CANDIDATE=12h

# Refresh Token (Opcional)
JWT_REFRESH_SECRET=otra_clave_secreta_diferente
JWT_REFRESH_EXPIRATION=7d
```

### 7.2 Generación de Secret

**Recomendación**: Usar secreto aleatorio y seguro.

```bash
# Generar secreto fuerte
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 7.3 Configuración de CORS

```typescript
// main.ts
app.enableCors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

---

## 8. Manejo de Errores

### 8.1 Excepciones Personalizadas

```typescript
// Unauthorized (401)
throw new UnauthorizedException('Token inválido o expirado');

// Forbidden (403)
throw new ForbiddenException('No tiene permisos para esta acción');

// Bad Request (400)
throw new BadRequestException('Credenciales incorrectas');
```

### 8.2 Filtro Global de Excepciones

```typescript
@Catch(UnauthorizedException)
export class JwtExceptionFilter implements ExceptionFilter {
  catch(exception: UnauthorizedException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    response.status(401).json({
      statusCode: 401,
      message: 'Sesión expirada. Por favor, inicie sesión nuevamente.',
      timestamp: new Date().toISOString(),
    });
  }
}
```

---

## 9. Testing de la Arquitectura

### 9.1 Tests Unitarios

**AuthService**:

```typescript
describe('AuthService', () => {
  it('debe generar un token JWT válido al hacer login', async () => {
    const result = await authService.login('admin@test.com', 'password');
    expect(result).toHaveProperty('access_token');
    expect(typeof result.access_token).toBe('string');
  });

  it('debe lanzar UnauthorizedException si las credenciales son incorrectas', async () => {
    await expect(
      authService.login('admin@test.com', 'wrongpassword')
    ).rejects.toThrow(UnauthorizedException);
  });
});
```

**Guards**:

```typescript
describe('RolesGuard', () => {
  it('debe permitir acceso si el usuario tiene el rol requerido', () => {
    const result = guard.canActivate(mockExecutionContext);
    expect(result).toBe(true);
  });

  it('debe denegar acceso si el usuario no tiene el rol requerido', () => {
    const result = guard.canActivate(mockExecutionContext);
    expect(result).toBe(false);
  });
});
```

### 9.2 Tests de Integración

```typescript
describe('Auth E2E', () => {
  it('/auth/login (POST) debe retornar token', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({
        correo: 'admin@test.com',
        contraseña: 'password',
        tipo: 'administrador',
      })
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('access_token');
      });
  });

  it('endpoints protegidos deben rechazar sin token', () => {
    return request(app.getHttpServer()).get('/elections').expect(401);
  });

  it('endpoints protegidos deben permitir con token válido', () => {
    return request(app.getHttpServer())
      .get('/elections')
      .set('Authorization', `Bearer ${validToken}`)
      .expect(200);
  });
});
```

---

## 10. Resumen de la Arquitectura

### 10.1 Componentes Clave

| Componente       | Responsabilidad              | Ubicación              |
| ---------------- | ---------------------------- | ---------------------- |
| **Auth Module**  | Lógica de autenticación      | `src/auth/`            |
| **JWT Strategy** | Validación de tokens         | `src/auth/strategies/` |
| **Auth Guard**   | Protección por autenticación | `src/auth/guards/`     |
| **Roles Guard**  | Protección por autorización  | `src/auth/guards/`     |
| **Decorators**   | Metadata de roles            | `src/auth/decorators/` |

### 10.2 Flujos Principales

1. **Login**: Usuario → Controller → Service → Prisma → Generate JWT → Response
2. **Request Autenticado**: Request → Guard → Strategy → Validate → Controller
3. **Autorización**: Request → JwtGuard → RolesGuard → Controller

### 10.3 Próximos Pasos

El siguiente documento ([04-implementacion-backend.md](./04-implementacion-backend.md)) cubrirá:

- Código completo paso a paso
- Instalación de dependencias
- Creación de cada archivo
- Configuración detallada
- Integración con módulos existentes

---

**Documento**: 03-arquitectura-propuesta.md  
**Versión**: 1.0  
**Última actualización**: Octubre 2025  
**Anterior**: [02-analisis-situacion-actual.md](./02-analisis-situacion-actual.md)  
**Siguiente**: [04-implementacion-backend.md](./04-implementacion-backend.md)
