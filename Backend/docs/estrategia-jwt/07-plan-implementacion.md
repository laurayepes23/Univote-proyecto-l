# 07 - Plan de Implementación

## 📋 Introducción

Este documento presenta un plan detallado y estructurado para implementar la estrategia de autenticación JWT en UniVote, dividido en fases con objetivos claros, cronograma y métricas de éxito.

---

## 1. Visión General del Plan

### 1.1 Objetivos Principales

```
1. Migrar del sistema actual inseguro a JWT
2. Implementar autenticación robusta para 3 tipos de usuario
3. Proteger todos los endpoints críticos
4. Garantizar cero pérdida de datos durante la migración
5. Capacitar al equipo en las nuevas prácticas
```

### 1.2 Alcance del Proyecto

| Componente        | Descripción         | Estado Actual               | Estado Objetivo                  |
| ----------------- | ------------------- | --------------------------- | -------------------------------- |
| **Backend**       | API NestJS          | Login básico sin JWT        | JWT completo con guards          |
| **Frontend**      | React SPA           | Token falso en localStorage | Context API + Axios interceptors |
| **Base de Datos** | PostgreSQL + Prisma | Sin tabla de tokens         | RefreshTokens implementado       |
| **Seguridad**     | Protección          | Endpoints abiertos          | Todos protegidos con roles       |
| **Documentación** | Guías               | Incompleta                  | Completa y actualizada           |

### 1.3 Stakeholders

- **Equipo de Desarrollo**: Implementación técnica
- **Administradores del Sistema**: Gestión de usuarios y permisos
- **Votantes y Candidatos**: Usuarios finales
- **Institución Educativa**: Cliente final

---

## 2. Metodología de Implementación

### 2.1 Enfoque Ágil

```
Sprint 1: Backend - Autenticación básica JWT (2 semanas)
Sprint 2: Backend - Guards y protección de endpoints (1.5 semanas)
Sprint 3: Frontend - Context API y Login (2 semanas)
Sprint 4: Frontend - Rutas protegidas (1.5 semanas)
Sprint 5: Seguridad - Refresh tokens y hardening (2 semanas)
Sprint 6: Testing y ajustes finales (1 semana)

Total: 10 semanas (2.5 meses)
```

### 2.2 Principios de Implementación

1. **Desarrollo Incremental**: Funcionalidades en pequeños incrementos
2. **Testing Continuo**: Pruebas después de cada cambio
3. **Backward Compatibility**: Mantener sistema actual durante migración
4. **Zero Downtime**: Implementar sin interrumpir el servicio
5. **Documentación Paralela**: Documentar mientras se implementa

---

## 3. Fase 1: Preparación (Semana 1)

### 3.1 Objetivos

- ✅ Configurar entorno de desarrollo
- ✅ Instalar dependencias necesarias
- ✅ Crear ramas de trabajo en Git
- ✅ Definir estructura de la base de datos

### 3.2 Tareas Técnicas

#### **T1.1: Configurar Repositorio**

```bash
# Crear rama de desarrollo
git checkout -b feature/jwt-implementation

# Crear subramas para backend y frontend
git checkout -b feature/jwt-backend
git checkout -b feature/jwt-frontend
```

#### **T1.2: Instalar Dependencias Backend**

```bash
cd Backend

# Dependencias JWT
npm install @nestjs/jwt @nestjs/passport passport passport-jwt

# Dependencias de seguridad
npm install helmet cookie-parser csurf
npm install @nestjs/throttler

# Dependencias de logging
npm install winston

# Dependencias de validación
npm install joi

# TypeScript types
npm install -D @types/passport-jwt @types/cookie-parser @types/csurf
```

#### **T1.3: Instalar Dependencias Frontend**

```bash
cd Frontend

# Dependencias principales
npm install axios jwt-decode

# Dependencias de seguridad
npm install dompurify

# TypeScript types (si aplica)
npm install -D @types/dompurify
```

#### **T1.4: Crear Migración de Base de Datos**

**Archivo**: `Backend/prisma/schema.prisma`

```prisma
model RefreshToken {
  id        Int      @id @default(autoincrement())
  token     String   @unique
  userId    Int
  userType  String   // 'administrador', 'votante', 'candidato'
  expiresAt DateTime
  createdAt DateTime @default(now())
  isRevoked Boolean  @default(false)

  @@index([token])
  @@index([userId, userType])
  @@index([expiresAt])
}
```

```bash
npx prisma migrate dev --name add_refresh_tokens
```

#### **T1.5: Configurar Variables de Entorno**

**Backend/.env**:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/univote_dev"
JWT_SECRET="dev_secret_key_change_in_production_min_32_chars"
JWT_EXPIRATION="15m"
REFRESH_TOKEN_EXPIRATION="7d"
FRONTEND_URL="http://localhost:5173"
NODE_ENV="development"
```

**Frontend/.env**:

```env
VITE_API_URL=http://localhost:3000
```

### 3.3 Criterios de Aceptación

- [ ] Todas las dependencias instaladas sin errores
- [ ] Migraciones de base de datos ejecutadas exitosamente
- [ ] Variables de entorno configuradas
- [ ] Ramas de Git creadas y sincronizadas

### 3.4 Entregables

- Repositorio configurado con ramas de trabajo
- Dependencias instaladas y documentadas
- Base de datos lista para nuevas tablas

---

## 4. Fase 2: Backend - Autenticación JWT (Semanas 2-3)

### 4.1 Objetivos

- ✅ Implementar AuthModule completo
- ✅ Crear JwtStrategy y Guards básicos
- ✅ Migrar endpoint de login a JWT
- ✅ Probar con los 3 tipos de usuario

### 4.2 Tareas Técnicas

#### **Sprint 1.1: Módulo de Autenticación (3 días)**

**Día 1-2**: Crear AuthModule, AuthService, AuthController

- Implementar `login()` con generación de JWT
- Validar credenciales con bcrypt
- Generar tokens para cada tipo de usuario

**Día 3**: Crear DTOs y validaciones

- `LoginDto` con class-validator
- `JwtPayloadDto` para estructura del token

**Archivos a crear**:

```
src/auth/
├── auth.module.ts
├── auth.service.ts
├── auth.controller.ts
├── dto/
│   ├── login.dto.ts
│   └── jwt-payload.dto.ts
└── interfaces/
    └── jwt-payload.interface.ts
```

#### **Sprint 1.2: JWT Strategy (2 días)**

**Día 1**: Implementar JwtStrategy

- Configurar extracción de token desde headers
- Validar firma del token
- Validar existencia del usuario

**Día 2**: Testing de strategy

- Probar con tokens válidos
- Probar con tokens expirados
- Probar con tokens inválidos

**Archivos a crear**:

```
src/auth/strategies/
└── jwt.strategy.ts
```

#### **Sprint 1.3: Guards y Decorators (3 días)**

**Día 1**: JwtAuthGuard

- Extender de `@nestjs/passport`
- Manejar errores personalizados

**Día 2**: RolesGuard

- Verificar rol del usuario
- Implementar metadata de roles

**Día 3**: Decorators personalizados

- `@Roles()` para definir roles permitidos
- `@CurrentUser()` para obtener usuario actual

**Archivos a crear**:

```
src/auth/guards/
├── jwt-auth.guard.ts
└── roles.guard.ts
src/auth/decorators/
├── roles.decorator.ts
└── current-user.decorator.ts
```

#### **Sprint 1.4: Integración y Testing (2 días)**

**Día 1**: Integrar guards en módulos existentes

- Proteger endpoints de Elections
- Proteger endpoints de Votes
- Proteger endpoints de Candidates

**Día 2**: Testing end-to-end

- Casos de uso exitosos
- Casos de error (401, 403)
- Performance testing

### 4.3 Checklist de Verificación

```
✅ Fase 2 - Backend JWT
├─ [ ] AuthModule creado e importado en AppModule
├─ [ ] AuthService con método login() funcional
├─ [ ] Login soporta 3 tipos de usuario (admin, votante, candidato)
├─ [ ] Tokens JWT se generan correctamente
├─ [ ] JwtStrategy valida tokens
├─ [ ] JwtAuthGuard protege endpoints
├─ [ ] RolesGuard verifica permisos por rol
├─ [ ] Decorators @Roles y @CurrentUser funcionan
├─ [ ] Tests unitarios para AuthService (>80% cobertura)
├─ [ ] Tests e2e para endpoint de login
└─ [ ] Documentación actualizada en README
```

### 4.4 Criterios de Aceptación

1. Login exitoso retorna `{ access_token, user }`
2. Token es válido por 15 minutos (configurable)
3. Endpoints protegidos rechazan requests sin token (401)
4. Endpoints protegidos rechazan usuarios sin permiso (403)
5. Todos los tests pasan sin errores

### 4.5 Rollback Plan

```
Si algo falla:
1. Mantener endpoint antiguo de login funcionando
2. No eliminar código antiguo hasta validar el nuevo
3. Tener backup de base de datos antes de migraciones
4. Documentar problemas encontrados
```

---

## 5. Fase 3: Backend - Protección de Endpoints (Semanas 4-5)

### 5.1 Objetivos

- ✅ Proteger todos los endpoints críticos
- ✅ Implementar control de acceso por roles
- ✅ Agregar refresh tokens
- ✅ Implementar rate limiting

### 5.2 Mapa de Endpoints a Proteger

| Módulo         | Endpoint          | Método | Rol Requerido            | Prioridad  |
| -------------- | ----------------- | ------ | ------------------------ | ---------- |
| **Elections**  | `/elections`      | POST   | Administrador            | 🔴 Alta    |
|                | `/elections`      | GET    | Todos autenticados       | 🟡 Media   |
|                | `/elections/:id`  | PUT    | Administrador            | 🔴 Alta    |
|                | `/elections/:id`  | DELETE | Administrador            | 🔴 Alta    |
| **Votes**      | `/votes`          | POST   | Votante                  | 🔴 Crítica |
|                | `/votes`          | GET    | Administrador            | 🔴 Alta    |
| **Candidates** | `/candidates`     | POST   | Candidato                | 🟡 Media   |
|                | `/candidates/:id` | PUT    | Candidato (propio)       | 🟡 Media   |
|                | `/candidates`     | GET    | Todos autenticados       | 🟢 Baja    |
| **Proposals**  | `/proposals`      | POST   | Candidato                | 🟡 Media   |
|                | `/proposals/:id`  | PUT    | Candidato (propio)       | 🟡 Media   |
| **Voters**     | `/voters`         | GET    | Administrador            | 🔴 Alta    |
|                | `/voters/:id`     | PUT    | Votante (propio) o Admin | 🟡 Media   |

### 5.3 Tareas por Módulo

#### **T3.1: Proteger ElectionsController (1 día)**

```typescript
@Controller('elections')
@UseGuards(JwtAuthGuard)
export class ElectionsController {
  @Post()
  @Roles('administrador')
  @UseGuards(RolesGuard)
  create(@Body() dto: CreateElectionDto, @CurrentUser() user: JwtPayload) {
    return this.electionsService.create(dto, user);
  }

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.electionsService.findAll(user);
  }

  @Patch(':id')
  @Roles('administrador')
  @UseGuards(RolesGuard)
  update(@Param('id') id: string, @Body() dto: UpdateElectionDto) {
    return this.electionsService.update(+id, dto);
  }

  @Delete(':id')
  @Roles('administrador')
  @UseGuards(RolesGuard)
  remove(@Param('id') id: string) {
    return this.electionsService.remove(+id);
  }
}
```

#### **T3.2: Proteger VotesController (2 días)**

**Implementar validaciones especiales**:

- Votante solo puede votar una vez por elección
- Verificar que la elección esté activa
- Registrar IP y timestamp del voto

```typescript
@Controller('votes')
@UseGuards(JwtAuthGuard)
export class VotesController {
  @Post()
  @Roles('votante')
  @UseGuards(RolesGuard)
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 votos por minuto máximo
  async create(
    @Body() dto: CreateVoteDto,
    @CurrentUser() user: JwtPayload,
    @Ip() ip: string
  ) {
    // Validar que no haya votado antes
    const hasVoted = await this.votesService.hasUserVoted(
      user.userId,
      dto.electionId
    );
    if (hasVoted) {
      throw new BadRequestException('Ya has votado en esta elección');
    }

    // Validar que la elección esté activa
    const election = await this.electionsService.findOne(dto.electionId);
    if (election.estado !== 'activa') {
      throw new BadRequestException('La elección no está activa');
    }

    return this.votesService.create(dto, user, ip);
  }

  @Get()
  @Roles('administrador')
  @UseGuards(RolesGuard)
  findAll() {
    return this.votesService.findAll();
  }
}
```

#### **T3.3: Implementar Refresh Tokens (3 días)**

**Día 1**: AuthService - Generar y almacenar refresh tokens
**Día 2**: AuthController - Endpoint de refresh
**Día 3**: Testing y rotación de tokens

```typescript
// auth.service.ts
async generateRefreshToken(userId: number, userType: string): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 días

  await this.prisma.refreshToken.create({
    data: {
      token,
      userId,
      userType,
      expiresAt,
    },
  });

  return token;
}

async refreshAccessToken(refreshToken: string) {
  const tokenRecord = await this.prisma.refreshToken.findUnique({
    where: { token: refreshToken },
  });

  if (!tokenRecord || tokenRecord.isRevoked) {
    throw new UnauthorizedException('Refresh token inválido');
  }

  if (new Date() > tokenRecord.expiresAt) {
    await this.prisma.refreshToken.delete({ where: { id: tokenRecord.id } });
    throw new UnauthorizedException('Refresh token expirado');
  }

  // Buscar usuario y generar nuevo access token
  // ... (ver documento 06)
}
```

#### **T3.4: Rate Limiting (1 día)**

```typescript
// app.module.ts
@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minuto
        limit: 100, // 100 requests por minuto global
      },
    ]),
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

### 5.4 Testing de Fase 3

```bash
# Tests con curl
# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"correo":"admin@univote.com","contrasena":"admin123","tipo":"administrador"}'

# Guardar token
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Crear elección (debe funcionar con admin)
curl -X POST http://localhost:3000/elections \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Elección Representante","descripcion":"..."}'

# Intentar crear elección sin token (debe fallar con 401)
curl -X POST http://localhost:3000/elections \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Elección Representante","descripcion":"..."}'

# Intentar crear elección con token de votante (debe fallar con 403)
# ...
```

### 5.5 Criterios de Aceptación

- [ ] Todos los endpoints críticos están protegidos
- [ ] Control de acceso por roles funciona correctamente
- [ ] Refresh tokens se generan y validan
- [ ] Rate limiting previene abuso de endpoints
- [ ] Tests de integración pasan (100%)
- [ ] No hay regresiones en funcionalidad existente

---

## 6. Fase 4: Frontend - Context y Login (Semanas 6-7)

### 6.1 Objetivos

- ✅ Crear AuthContext con Context API
- ✅ Implementar hook useAuth
- ✅ Actualizar página de Login
- ✅ Configurar Axios con interceptores

### 6.2 Tareas Técnicas

#### **T4.1: Configurar Axios (1 día)**

```javascript
// src/api/axios.js
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  withCredentials: true, // Para cookies
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Interceptor de Request
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de Response
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Intentar refresh token
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/refresh`,
          { refresh_token: refreshToken }
        );

        const newToken = response.data.access_token;
        localStorage.setItem('access_token', newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
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

#### **T4.2: Crear AuthContext (2 días)**

**Día 1**: Implementar contexto con estado de autenticación
**Día 2**: Agregar métodos login, logout, updateUser

```javascript
// src/context/AuthContext.jsx
import { createContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../api/auth.api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay sesión guardada
    const savedToken = localStorage.getItem('access_token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }

    setLoading(false);
  }, []);

  const login = useCallback(async (credentials) => {
    const data = await authAPI.login(credentials);

    setToken(data.access_token);
    setUser(data.user);

    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    localStorage.setItem('user', JSON.stringify(data.user));

    return data;
  }, []);

  const logout = useCallback(async () => {
    await authAPI.logout();

    setUser(null);
    setToken(null);

    localStorage.clear();
  }, []);

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated: () => !!token && !!user,
    hasRole: (roles) => {
      if (!user) return false;
      const rolesArray = Array.isArray(roles) ? roles : [roles];
      return rolesArray.includes(user.rol) || rolesArray.includes(user.tipo);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
```

#### **T4.3: Actualizar Login (2 días)**

**Día 1**: Integrar con AuthContext
**Día 2**: Mejorar UX con loading states y errores

```javascript
// src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const data = await login(formData);

      // Redirigir según tipo
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
    <div className="min-h-screen flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="max-w-md w-full bg-white p-8 rounded shadow">
        {/* ... formulario ... */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded">
          {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
        </button>
      </form>
    </div>
  );
};

export default Login;
```

#### **T4.4: Integrar en App (1 día)**

```javascript
// src/main.jsx
import { AuthProvider } from './context/AuthContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
```

### 6.3 Testing de Fase 4

```javascript
// Tests manuales en navegador
// 1. Login exitoso
console.log(localStorage.getItem('access_token')); // Debe tener token
console.log(JSON.parse(localStorage.getItem('user'))); // Debe tener datos

// 2. Login fallido
// Intentar con credenciales incorrectas
// Debe mostrar error sin crash

// 3. Verificar interceptor
// Hacer request a endpoint protegido
// Token debe enviarse automáticamente en header
```

### 6.4 Criterios de Aceptación

- [ ] Login funciona con los 3 tipos de usuario
- [ ] Token se guarda en localStorage
- [ ] AuthContext es accesible desde cualquier componente
- [ ] Interceptor agrega token automáticamente
- [ ] Manejo de errores es claro y amigable
- [ ] Loading states funcionan correctamente

---

## 7. Fase 5: Frontend - Rutas Protegidas (Semanas 8-9)

### 7.1 Objetivos

- ✅ Crear componentes PrivateRoute y RoleRoute
- ✅ Proteger todas las rutas según rol
- ✅ Actualizar Navbars con logout
- ✅ Implementar redirecciones automáticas

### 7.2 Tareas Técnicas

#### **T5.1: Componentes de Protección (2 días)**

```javascript
// src/components/PrivateRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Verificando sesión...</div>;
  }

  if (!isAuthenticated()) {
    return (
      <Navigate
        to="/Login"
        replace
      />
    );
  }

  return children;
};

export default PrivateRoute;
```

```javascript
// src/components/RoleRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const RoleRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, hasRole, loading, user } = useAuth();

  if (loading) {
    return <div>Verificando permisos...</div>;
  }

  if (!isAuthenticated()) {
    return (
      <Navigate
        to="/Login"
        replace
      />
    );
  }

  if (!hasRole(allowedRoles)) {
    const redirectPath =
      user.tipo === 'administrador'
        ? '/Administrador'
        : user.tipo === 'votante'
        ? '/Votante'
        : user.tipo === 'candidato'
        ? '/Candidato'
        : '/';

    return (
      <Navigate
        to={redirectPath}
        replace
      />
    );
  }

  return children;
};

export default RoleRoute;
```

#### **T5.2: Actualizar App.jsx (3 días)**

**Proteger todas las rutas por rol**:

```javascript
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
    path="/RegistroVotante"
    element={<RegistroVotante />}
  />

  {/* Rutas de Administrador */}
  <Route
    path="/Administrador"
    element={
      <PrivateRoute>
        <RoleRoute allowedRoles={['administrador']}>
          <Administrador />
        </RoleRoute>
      </PrivateRoute>
    }
  />
  {/* ... más rutas de admin ... */}

  {/* Rutas de Votante */}
  <Route
    path="/Votante"
    element={
      <PrivateRoute>
        <RoleRoute allowedRoles={['votante']}>
          <Votante />
        </RoleRoute>
      </PrivateRoute>
    }
  />
  {/* ... más rutas de votante ... */}

  {/* Rutas de Candidato */}
  <Route
    path="/Candidato"
    element={
      <PrivateRoute>
        <RoleRoute allowedRoles={['candidato']}>
          <Candidato />
        </RoleRoute>
      </PrivateRoute>
    }
  />
  {/* ... más rutas de candidato ... */}
</Routes>
```

#### **T5.3: Actualizar Navbars (2 días)**

```javascript
// src/components/Navbar_admin.jsx
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const Navbar_admin = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/Login', { replace: true });
  };

  return (
    <nav>
      <div>UniVote Admin</div>
      <div>
        <span>
          {user?.nombre} {user?.apellido}
        </span>
        <button onClick={handleLogout}>Cerrar Sesión</button>
      </div>
    </nav>
  );
};
```

### 7.3 Testing Completo de Rutas

| Escenario           | Acción                     | Resultado Esperado              |
| ------------------- | -------------------------- | ------------------------------- |
| Sin autenticar      | Acceder a `/Administrador` | Redirige a `/Login`             |
| Votante autenticado | Acceder a `/Administrador` | Redirige a `/Votante`           |
| Admin autenticado   | Acceder a `/Administrador` | Muestra página                  |
| Sesión expirada     | Navegar en la app          | Auto-refresh o redirige a login |
| Logout exitoso      | Hacer logout               | Limpia localStorage y redirige  |

### 7.4 Criterios de Aceptación

- [ ] Todas las rutas están protegidas correctamente
- [ ] Redirecciones funcionan según el rol
- [ ] Logout limpia sesión completamente
- [ ] No hay acceso no autorizado a ninguna ruta
- [ ] UX es fluida sin pantallas en blanco

---

## 8. Fase 6: Seguridad y Hardening (Semana 10)

### 8.1 Objetivos

- ✅ Implementar mejores prácticas de seguridad
- ✅ Agregar logging de eventos críticos
- ✅ Configurar HTTPS y certificados
- ✅ Auditar vulnerabilidades

### 8.2 Checklist de Seguridad

```
✅ Backend
├─ [ ] Helmet configurado con CSP
├─ [ ] CORS restrictivo (solo frontend permitido)
├─ [ ] Rate limiting en login (5 intentos/min)
├─ [ ] HttpOnly cookies habilitadas
├─ [ ] Refresh tokens con rotación
├─ [ ] Logging de intentos de login
├─ [ ] Validación de todos los DTOs
├─ [ ] Variables de entorno seguras
└─ [ ] npm audit sin vulnerabilidades críticas

✅ Frontend
├─ [ ] Sanitización de inputs con DOMPurify
├─ [ ] Tokens no expuestos en consola
├─ [ ] HTTPS en producción
├─ [ ] CSP configurado en index.html
├─ [ ] npm audit sin vulnerabilidades críticas
└─ [ ] Timeout de sesión implementado

✅ Base de Datos
├─ [ ] Contraseñas hasheadas con bcrypt
├─ [ ] Índices en tablas de tokens
├─ [ ] Backup automático configurado
└─ [ ] Usuario de BD con permisos mínimos
```

### 8.3 Implementar HTTPS Local (Desarrollo)

```bash
# Generar certificado autofirmado
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# Configurar en main.ts
const httpsOptions = {
  key: fs.readFileSync('./key.pem'),
  cert: fs.readFileSync('./cert.pem'),
};

const app = await NestFactory.create(AppModule, { httpsOptions });
```

### 8.4 Auditoría de Seguridad

```bash
# Backend
cd Backend
npm audit
npm audit fix

# Frontend
cd Frontend
npm audit
npm audit fix

# Escanear secrets en código
npm install -g gitleaks
gitleaks detect --source . --verbose
```

---

## 9. Fase 7: Testing Final (Semana 11)

### 9.1 Plan de Testing

#### **Testing Unitario**

```bash
# Backend
npm run test
npm run test:cov  # Cobertura mínima: 80%

# Frontend
npm run test
```

#### **Testing de Integración**

```bash
# Backend E2E
npm run test:e2e
```

#### **Testing Manual**

| Caso de Prueba       | Pasos                                                                                                  | Resultado Esperado                       |
| -------------------- | ------------------------------------------------------------------------------------------------------ | ---------------------------------------- |
| Login Admin          | 1. Ir a /Login<br>2. Seleccionar "Administrador"<br>3. Ingresar credenciales<br>4. Hacer clic en Login | Redirige a /Administrador                |
| Crear Elección       | 1. Login como admin<br>2. Ir a Crear Elección<br>3. Llenar formulario<br>4. Enviar                     | Elección creada exitosamente             |
| Votar                | 1. Login como votante<br>2. Ver elecciones<br>3. Seleccionar candidato<br>4. Confirmar voto            | Voto registrado, no puede votar de nuevo |
| Acceso no autorizado | 1. Login como votante<br>2. Intentar acceder a /Administrador                                          | Redirige a /Votante                      |
| Token expirado       | 1. Login<br>2. Esperar 16 minutos<br>3. Hacer request                                                  | Auto-refresh o logout                    |

### 9.2 Testing de Performance

```bash
# Load testing con Artillery
npm install -g artillery

# Crear archivo de prueba
artillery quick --count 10 --num 100 http://localhost:3000/auth/login

# Objetivo: <500ms response time, 0% error rate
```

### 9.3 Criterios de Aprobación

- [ ] Cobertura de tests unitarios >80%
- [ ] Todos los tests E2E pasan
- [ ] 100% de casos de prueba manual exitosos
- [ ] Tiempo de respuesta <500ms en promedio
- [ ] Sin errores en consola del navegador
- [ ] Sin vulnerabilidades críticas (npm audit)

---

## 10. Fase 8: Despliegue y Monitoreo (Semana 12)

### 10.1 Preparación para Producción

#### **Checklist de Deployment**

```
✅ Backend
├─ [ ] Variables de entorno de producción configuradas
├─ [ ] JWT_SECRET generado con openssl (64 bytes)
├─ [ ] Base de datos de producción migrada
├─ [ ] HTTPS configurado con certificado válido
├─ [ ] PM2 o Docker para gestión de procesos
├─ [ ] Nginx como proxy reverso
├─ [ ] Logging a archivo configurado
└─ [ ] Health check endpoint (/health)

✅ Frontend
├─ [ ] Build de producción generado
├─ [ ] Variables de entorno apuntando a prod
├─ [ ] Assets minificados
├─ [ ] CDN configurado (opcional)
└─ [ ] Service Worker para PWA (opcional)

✅ Infraestructura
├─ [ ] Servidor configurado (AWS/DigitalOcean/etc)
├─ [ ] Firewall configurado (solo 80, 443)
├─ [ ] Backup automático de BD (diario)
├─ [ ] SSL/TLS con Let's Encrypt
└─ [ ] Monitoreo con Uptim Robot o similar
```

#### **Script de Deployment**

```bash
#!/bin/bash
# deploy.sh

echo "🚀 Iniciando deployment de UniVote"

# 1. Backup de base de datos
echo "📦 Creando backup..."
pg_dump univote_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Pull código
echo "📥 Descargando código..."
git pull origin main

# 3. Backend
echo "🔧 Instalando dependencias backend..."
cd Backend
npm install --production
npm run build

echo "🗄️ Ejecutando migraciones..."
npx prisma migrate deploy

# 4. Frontend
echo "🎨 Compilando frontend..."
cd ../Frontend
npm install
npm run build

# 5. Reiniciar servicios
echo "🔄 Reiniciando servicios..."
pm2 restart univote-backend
sudo systemctl reload nginx

echo "✅ Deployment completado!"
```

### 10.2 Configuración de Monitoreo

#### **Health Check Endpoint**

```typescript
// src/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    // Verificar conexión a BD
    try {
      await this.prisma.$queryRaw`SELECT 1`;

      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: 'connected',
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error.message,
      };
    }
  }
}
```

#### **Monitoreo con UptimeRobot**

```
Configurar checks cada 5 minutos:
- https://api.univote.com/health
- https://univote.com

Alertas:
- Email al administrador
- SMS en caso crítico (opcional)
```

### 10.3 Plan de Rollback

```
Si algo falla en producción:

1. Detener deployment inmediatamente
2. Restaurar backup de base de datos
3. Revertir a versión anterior del código:
   git checkout [commit_anterior]
   npm run build
   pm2 restart all
4. Notificar al equipo
5. Analizar logs para identificar el problema
6. Documentar el incidente
```

---

## 11. Capacitación del Equipo

### 11.1 Sesiones de Capacitación

| Sesión       | Duración | Audiencia        | Contenido                                |
| ------------ | -------- | ---------------- | ---------------------------------------- |
| **Sesión 1** | 2 horas  | Desarrolladores  | Arquitectura JWT, Backend implementation |
| **Sesión 2** | 2 horas  | Desarrolladores  | Frontend implementation, Context API     |
| **Sesión 3** | 1 hora   | Desarrolladores  | Seguridad, mejores prácticas             |
| **Sesión 4** | 1 hora   | Administradores  | Gestión de usuarios, monitoreo           |
| **Sesión 5** | 30 min   | Usuarios finales | Nuevo proceso de login                   |

### 11.2 Material de Capacitación

- **Documentación técnica**: Los 8 documentos de la estrategia JWT
- **Video tutoriales**: Grabaciones de sesiones prácticas
- **Guías rápidas**: Cheat sheets con comandos comunes
- **FAQ**: Preguntas frecuentes y troubleshooting

---

## 12. Métricas de Éxito

### 12.1 KPIs Técnicos

| Métrica                       | Valor Actual | Objetivo | Estado |
| ----------------------------- | ------------ | -------- | ------ |
| **Cobertura de Tests**        | 0%           | >80%     | 🔴     |
| **Vulnerabilidades Críticas** | ?            | 0        | ⚠️     |
| **Tiempo de Login**           | ~200ms       | <500ms   | ✅     |
| **Disponibilidad**            | ~95%         | >99%     | ⚠️     |
| **Endpoints Protegidos**      | 20%          | 100%     | 🔴     |

### 12.2 KPIs de Negocio

| Métrica                        | Objetivo                          |
| ------------------------------ | --------------------------------- |
| **Adopción de Usuarios**       | >90% login exitoso en 1er intento |
| **Incidentes de Seguridad**    | 0 por semestre                    |
| **Satisfacción de Usuario**    | >8/10                             |
| **Tiempo de Respuesta a Bugs** | <24 horas                         |

---

## 13. Cronograma Visual

```
Semana 1: [████████] Preparación
Semana 2-3: [████████████████] Backend - Autenticación JWT
Semana 4-5: [████████████████] Backend - Protección Endpoints
Semana 6-7: [████████████████] Frontend - Context y Login
Semana 8-9: [████████████████] Frontend - Rutas Protegidas
Semana 10: [████████] Seguridad y Hardening
Semana 11: [████████] Testing Final
Semana 12: [████████] Despliegue y Monitoreo

Total: 12 semanas (3 meses)
```

---

## 14. Riesgos y Mitigación

| Riesgo                     | Probabilidad | Impacto | Mitigación                                       |
| -------------------------- | ------------ | ------- | ------------------------------------------------ |
| **Pérdida de datos**       | Baja         | Crítico | Backups diarios automáticos                      |
| **Tokens comprometidos**   | Media        | Alto    | Refresh tokens con rotación                      |
| **Downtime en deployment** | Media        | Medio   | Plan de rollback, despliegue fuera de horas pico |
| **Bugs en producción**     | Alta         | Medio   | Testing exhaustivo, monitoreo continuo           |
| **Resistencia al cambio**  | Media        | Bajo    | Capacitación, comunicación clara                 |

---

## 15. Checklist Final de Implementación

```
✅ Fase 1: Preparación
├─ [ ] Dependencias instaladas
├─ [ ] Ramas de Git creadas
├─ [ ] Base de datos migrada
└─ [ ] Variables de entorno configuradas

✅ Fase 2: Backend - Autenticación
├─ [ ] AuthModule implementado
├─ [ ] JwtStrategy funcionando
├─ [ ] Guards creados
└─ [ ] Tests unitarios >80%

✅ Fase 3: Backend - Endpoints
├─ [ ] Todos los endpoints protegidos
├─ [ ] Refresh tokens implementados
├─ [ ] Rate limiting configurado
└─ [ ] Logging implementado

✅ Fase 4: Frontend - Context
├─ [ ] AuthContext creado
├─ [ ] Axios configurado
├─ [ ] Login actualizado
└─ [ ] Tests manuales exitosos

✅ Fase 5: Frontend - Rutas
├─ [ ] PrivateRoute y RoleRoute
├─ [ ] Todas las rutas protegidas
├─ [ ] Navbars actualizados
└─ [ ] Redirecciones funcionando

✅ Fase 6: Seguridad
├─ [ ] Helmet y CSP configurados
├─ [ ] Sanitización de inputs
├─ [ ] HTTPS habilitado
└─ [ ] Auditoría sin vulnerabilidades

✅ Fase 7: Testing
├─ [ ] Tests unitarios pasan
├─ [ ] Tests E2E pasan
├─ [ ] Testing manual 100% exitoso
└─ [ ] Performance aceptable

✅ Fase 8: Deployment
├─ [ ] Servidor configurado
├─ [ ] Aplicación desplegada
├─ [ ] Monitoreo activo
└─ [ ] Equipo capacitado
```

---

## 16. Conclusión

Este plan de implementación proporciona una ruta clara y estructurada para migrar UniVote de un sistema inseguro a una arquitectura robusta con JWT.

### Beneficios Esperados

1. **Seguridad**: Protección completa contra fraude electoral
2. **Escalabilidad**: Arquitectura preparada para crecimiento
3. **Mantenibilidad**: Código limpio y bien documentado
4. **Experiencia de Usuario**: Login fluido y seguro
5. **Conformidad**: Cumplimiento de mejores prácticas de seguridad

### Próximo Documento

El documento final ([08-impacto-beneficios.md](./08-impacto-beneficios.md)) analizará en profundidad el impacto y los beneficios de esta implementación.

---

**Documento**: 07-plan-implementacion.md  
**Versión**: 1.0  
**Última actualización**: Octubre 2025  
**Anterior**: [06-seguridad-mejores-practicas.md](./06-seguridad-mejores-practicas.md)  
**Siguiente**: [08-impacto-beneficios.md](./08-impacto-beneficios.md)
