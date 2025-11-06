# Backend - UniVote

![NestJS](https://img.shields.io/badge/NestJS-11.0-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-6.15-2D3748?style=for-the-badge&logo=prisma&logoColor=white)

## 📋 Descripción

API RESTful desarrollada con NestJS para el sistema de votaciones universitarias UniVote. Proporciona todos los endpoints necesarios para la gestión de elecciones, votantes, candidatos y votaciones.

## 🏗️ Arquitectura

El backend sigue una arquitectura modular basada en el patrón MVC adaptado a NestJS:

```
src/
├── administrators/              # Módulo de administradores
│   ├── dto/                    # Data Transfer Objects
│   │   ├── create-administrator.dto.ts
│   │   ├── login-admin.dto.ts
│   │   └── update-administrator.dto.ts
│   ├── administrators.controller.ts
│   ├── administrators.module.ts
│   └── administrators.service.ts
├── auth/                       # Módulo de autenticación JWT
│   ├── dto/                    # DTOs de autenticación
│   │   └── login.dto.ts
│   ├── guards/                 # Guards de protección
│   │   └── jwt-auth.guard.ts
│   ├── strategies/            # Estrategias de autenticación
│   │   └── jwt.strategy.ts
│   ├── auth.controller.ts
│   ├── auth.module.ts
│   └── auth.service.ts
├── candidates/                 # Módulo de candidatos
│   ├── dto/
│   ├── candidates.controller.ts
│   ├── candidates.module.ts
│   └── candidates.service.ts
├── careers/                    # Módulo de carreras
│   ├── dto/
│   ├── careers.controller.ts
│   ├── careers.module.ts
│   └── careers.service.ts
├── config/                     # Configuraciones globales
│   └── constants.ts           # Constantes de configuración
├── elections/                  # Módulo de elecciones
│   ├── dto/
│   ├── elections.controller.ts
│   ├── elections.module.ts
│   └── elections.service.ts
├── interceptors/              # Interceptores globales
│   └── bigint.interceptor.ts  # Manejo de BigInt
├── prisma/                    # Módulo de Prisma
│   ├── prisma.module.ts
│   └── prisma.service.ts
├── proposals/                 # Módulo de propuestas
│   ├── dto/
│   ├── proposals.controller.ts
│   ├── proposals.module.ts
│   └── proposals.service.ts
├── results/                   # Módulo de resultados
│   ├── dto/
│   ├── results.controller.ts
│   ├── results.module.ts
│   └── results.service.ts
├── role/                      # Módulo de roles
│   ├── dto/
│   ├── role.controller.ts
│   ├── role.module.ts
│   └── role.service.ts
├── voters/                    # Módulo de votantes
│   ├── dto/
│   ├── voters.controller.ts
│   ├── voters.module.ts
│   └── voters.service.ts
├── votes/                     # Módulo de votos
│   ├── dto/
│   ├── votes.controller.ts
│   ├── votes.module.ts
│   └── votes.service.ts
├── app.controller.ts          # Controlador principal
├── app.module.ts             # Módulo raíz de la aplicación
├── app.service.ts            # Servicio principal
└── main.ts                   # Punto de entrada de la aplicación
```

## 🚀 Características

### Módulos Principales

#### 👨‍💼 Administradores

- Registro y autenticación de administradores
- CRUD completo de administradores
- Gestión de elecciones
- Aprobación de candidatos

#### 🗳️ Votantes (Voters)

- Registro de votantes
- Autenticación y validación
- Consulta de elecciones disponibles
- Emisión de votos

#### 🎯 Candidatos (Candidates)

- Registro de candidatos
- Postulación a elecciones
- Gestión de perfiles
- Estado de aprobación

#### 🏛️ Elecciones (Elections)

- Creación de elecciones
- Gestión de estados (pendiente, activa, cerrada)
- Fechas de inicio y fin
- Vinculación con candidatos y votantes

#### 📝 Propuestas (Proposals)

- Creación de propuestas de campaña
- Gestión por candidato
- Estados de propuestas

#### 📊 Resultados (Results)

- Conteo de votos
- Resultados por elección
- Estadísticas de participación

## 🗄️ Modelo de Base de Datos

### Entidades Principales

```prisma
// Administrador
model Administrador {
  id_admin         Int
  nombre_admin     String
  apellido_admin   String
  tipo_doc_admin   String
  num_doc_admin    BigInt
  correo_admin     String @unique
  contrasena_admin String
  elections        Election[]
}

// Votante
model Voter {
  id_voter         Int
  nombre_voter     String
  apellido_voter   String
  tipo_doc_voter   String
  num_doc_voter    BigInt @unique
  correo_voter     String @unique
  estado_voter     String
  contrasena_voter String
  roleId           Int
  electionId       Int?
  careerId         Int
}

// Candidato
model Candidate {
  id_candidate         Int
  nombre_candidate     String
  apellido_candidate   String
  tipo_doc_candidate   String
  num_doc_candidate    BigInt @unique
  correo_candidate     String @unique
  estado_candidate     String
  foto_candidate       String?
  contrasena_candidate String
  roleId               Int
  careerId             Int
  electionId           Int?
}

// Elección
model Election {
  id_election     Int
  nombre_election String
  fecha_inicio    DateTime
  fecha_fin       DateTime
  estado_election String
  admin_id        Int
}

// Voto
model Vote {
  id_vote     Int
  fecha_vote  DateTime
  hora_vote   DateTime
  voterId     Int
  candidateId Int?
  electionId  Int?
}
```

## 🔧 Configuración

### Variables de Entorno

Crea un archivo `.env.local` en el directorio `Backend/`:

```env
# Base de datos
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/univote?schema=public"

# Puerto
PORT=3000

# CORS
FRONTEND_URL=http://localhost:5173

# Autenticación JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=24h
```

Para Docker, crea `.env.docker`:

```env
# PostgreSQL
POSTGRES_USER=univote
POSTGRES_PASSWORD=tu_contraseña_segura
POSTGRES_DB=univote

# Database URL
DATABASE_URL="postgresql://univote:tu_contraseña_segura@db:5432/univote?schema=public"
```

## 🚀 Instalación y Ejecución

### Instalación

```bash
# Instalar dependencias
npm install

# Generar cliente de Prisma
npx prisma generate

# Ejecutar migraciones
npx prisma migrate dev

# (Opcional) Poblar base de datos
npx prisma db seed
```

### Modo Desarrollo (Local)

```bash
# Con base de datos local
npm run dev:local

# O simplemente
npm run start:dev
```

### Modo Desarrollo (Docker)

```bash
# Con Docker Compose
docker-compose up -d

# O con npm
npm run dev:docker
```

### Modo Producción

```bash
# Compilar
npm run build

# Ejecutar
npm run start:prod
```

## 📡 API Endpoints

### Autenticación
```http
# Login y Token JWT
POST   /auth/login             # Obtener token JWT
GET    /auth/profile          # Obtener perfil (requiere JWT)

# Formato del token en headers
Authorization: Bearer <token>

# Ejemplo de respuesta login
{
    "access_token": "eyJhbGciOiJIUzI1...",
    "expires_in": "24h",
    "user": {
        "id": 1,
        "email": "admin@example.com",
        "nombre": "Admin",
        "apellido": "Test"
    }
}
```

### Administradores

```http
GET    /administrators           # Listar todos
GET    /administrators/:id       # Obtener por ID
POST   /administrators           # Crear nuevo
PATCH  /administrators/:id       # Actualizar
DELETE /administrators/:id       # Eliminar
```

### Votantes

```http
GET    /voters                   # Listar todos
GET    /voters/:id               # Obtener por ID
POST   /voters                   # Registrar votante
PATCH  /voters/:id               # Actualizar
DELETE /voters/:id               # Eliminar
POST   /voters/login             # Login de votante
```

### Candidatos

```http
GET    /candidates               # Listar todos
GET    /candidates/:id           # Obtener por ID
POST   /candidates               # Registrar candidato
PATCH  /candidates/:id           # Actualizar
DELETE /candidates/:id           # Eliminar
PATCH  /candidates/:id/approve   # Aprobar candidato
POST   /candidates/upload-photo  # Subir foto
```

### Elecciones

```http
GET    /elections                # Listar todas
GET    /elections/:id            # Obtener por ID
POST   /elections                # Crear elección
PATCH  /elections/:id            # Actualizar
DELETE /elections/:id            # Eliminar
PATCH  /elections/:id/start      # Iniciar elección
PATCH  /elections/:id/close      # Cerrar elección
```

### Votos

```http
POST   /votes                    # Emitir voto
GET    /votes/election/:id       # Votos por elección
GET    /votes/voter/:id          # Verificar si votó
```

### Propuestas

```http
GET    /proposals                      # Listar todas
GET    /proposals/candidate/:id        # Por candidato
POST   /proposals                      # Crear propuesta
PATCH  /proposals/:id                  # Actualizar
DELETE /proposals/:id                  # Eliminar
```

### Resultados

```http
GET    /results/election/:id           # Resultados de elección
GET    /results/candidate/:id          # Resultados de candidato
```

## 🔒 Seguridad

### Autenticación y Autorización

#### Sistema JWT
- Autenticación basada en JSON Web Tokens
- Tokens con expiración de 24 horas
- Estrategia Passport-JWT implementada
- Guards de protección en rutas sensibles

#### Seguridad de Contraseñas
- Hash de contraseñas con Bcrypt (factor 10)
- Validación de credenciales en login
- Protección contra inyección SQL mediante Prisma

#### Protección de Rutas
- Guards JWT en endpoints sensibles
- Validación de tokens en cada petición
- Manejo de expiración de sesiones
- Protección contra manipulación de tokens

### Validación

- Validación de DTOs con class-validator
- Transformación automática de tipos
- Whitelist de propiedades permitidas

### CORS

- Configurado para aceptar peticiones desde el frontend
- Control de orígenes permitidos

## 🧪 Testing

```bash
# Tests unitarios
npm run test

# Tests e2e
npm run test:e2e

# Cobertura
npm run test:cov

# Watch mode
npm run test:watch
```

## 📦 Dependencias Principales

### Producción

- `@nestjs/common` - Core de NestJS
- `@nestjs/core` - Núcleo del framework
- `@nestjs/platform-express` - Plataforma Express
- `@nestjs/config` - Gestión de configuración
- `@nestjs/jwt` - Manejo de JWT
- `@nestjs/passport` - Autenticación con Passport
- `passport` - Middleware de autenticación
- `passport-jwt` - Estrategia JWT para Passport
- `@prisma/client` - Cliente de Prisma ORM
- `bcrypt` - Hash de contraseñas
- `class-validator` - Validación de clases
- `class-transformer` - Transformación de clases
- `axios` - Cliente HTTP

### Desarrollo

- `@nestjs/cli` - CLI de NestJS
- `@nestjs/testing` - Utilidades de testing
- `prisma` - Prisma CLI
- `typescript` - Compilador TypeScript
- `eslint` - Linter
- `jest` - Framework de testing

## 🐳 Docker

### Docker Compose

Incluye servicios para:

- PostgreSQL 15
- Backend NestJS
- Health checks configurados
- Volúmenes persistentes

## 🔄 Migraciones

```bash
# Crear nueva migración
npx prisma migrate dev --name nombre_migracion

# Aplicar migraciones pendientes
npx prisma migrate deploy

# Resetear base de datos (⚠️ Cuidado en producción)
npx prisma migrate reset

# Ver estado de migraciones
npx prisma migrate status
```

## 🛠️ Herramientas de Desarrollo

### Prisma Studio

Interfaz gráfica para explorar y editar datos:

```bash
npx prisma studio
```

Disponible en `http://localhost:5555`

### ESLint

```bash
# Ejecutar linter
npm run lint

# Formatear código
npm run format
```

## 📊 Interceptores y Pipes

### BigIntInterceptor

Maneja la serialización de valores BigInt a JSON convertiendo BigInt a String en las respuestas.

### ValidationPipe

Configuración global que valida y transforma automáticamente los DTOs.

## 📝 DTOs Ejemplo

```typescript
// CreateVoterDto
export class CreateVoterDto {
  @IsString()
  @IsNotEmpty()
  nombre_voter: string;

  @IsString()
  @IsNotEmpty()
  apellido_voter: string;

  @IsString()
  @IsNotEmpty()
  tipo_doc_voter: string;

  @IsNumber()
  @IsPositive()
  num_doc_voter: number;

  @IsEmail()
  correo_voter: string;

  @IsString()
  @MinLength(6)
  contrasena_voter: string;

  @IsNumber()
  roleId: number;

  @IsNumber()
  careerId: number;
}
```

## 🚨 Manejo de Errores

El backend implementa manejo de errores consistente:

```typescript
throw new NotFoundException(`Votante con ID ${id} no encontrado`);
throw new BadRequestException('Email ya registrado');
throw new UnauthorizedException('Credenciales inválidas');
```

## 📈 Mejoras Futuras

- [x] Implementar JWT para autenticación
- [ ] Implementar refresh tokens
- [ ] Agregar sistema de logs
- [ ] Implementar rate limiting
- [ ] Agregar cache con Redis
- [ ] Mejorar cobertura de tests
- [ ] Implementar sistema de notificaciones
- [ ] Agregar documentación Swagger/OpenAPI
- [ ] Implementar WebSockets para resultados en tiempo real
- [ ] Implementar autenticación de dos factores

## 🤝 Contribución

Para contribuir al backend:

1. Crea un módulo siguiendo la estructura estándar de NestJS
2. Implementa DTOs con validaciones apropiadas
3. Asegura cobertura de tests adecuada
4. Documenta los endpoints en este README
5. Ejecuta el linter antes de commit

## 📞 Soporte

Para problemas o preguntas relacionadas con el backend:

- Revisa los logs en `console` o Docker logs
- Verifica la configuración de base de datos
- Asegúrate de que las migraciones estén aplicadas
- Verifica que el puerto 3000 esté disponible

---

**Desarrollado con NestJS y ❤️**
