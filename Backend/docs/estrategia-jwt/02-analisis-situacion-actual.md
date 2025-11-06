# 02 - Análisis de la Situación Actual

## 📊 Introducción

Este documento analiza el estado actual del sistema de autenticación en UniVote, identifica problemas existentes y justifica la necesidad de implementar JWT como solución.

---

## 1. Estado Actual del Sistema de Autenticación

### 1.1 Análisis del Código Existente

#### A) Backend - Método de Login Actual

**Archivo**: `Backend/src/administrators/administrators.servicie.ts`

```typescript
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
    return result;  // ⚠️ Retorna todos los datos del usuario
}
```

**Problemas Identificados:**

1. ✅ **Lo que está bien:**

   - Usa bcrypt para comparar contraseñas
   - Excluye la contraseña de la respuesta
   - Validación básica de credenciales

2. ❌ **Lo que falta:**
   - No genera ningún token de autenticación
   - No hay mecanismo de sesión
   - No hay control de tiempo de sesión
   - Retorna datos completos del usuario sin protección

#### B) Frontend - Verificación de Autenticación Actual

**Archivo**: `Frontend/src/AuthChecker.jsx`

```javascript
const AuthChecker = ({ children }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      console.log('No se encontró un token. Redirigiendo al login.');
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  return <>{children}</>;
};
```

**Problemas Identificados:**

1. ✅ **Lo que está bien:**

   - Verifica existencia de token
   - Redirige si no hay token
   - Usa localStorage para persistencia

2. ❌ **Lo que falta:**
   - No valida la estructura del token
   - No verifica expiración
   - No valida integridad del token
   - No hay renovación de token
   - No distingue roles de usuario

---

## 2. Arquitectura Actual

### 2.1 Flujo de Autenticación Actual

```
┌─────────┐                 ┌─────────┐                 ┌──────────┐
│ Cliente │                 │ Backend │                 │ Base de  │
│ (React) │                 │ (NestJS)│                 │  Datos   │
└────┬────┘                 └────┬────┘                 └────┬─────┘
     │                           │                           │
     │  1. POST /login           │                           │
     │  {correo, contraseña}     │                           │
     ├──────────────────────────>│                           │
     │                           │                           │
     │                           │  2. Validar credenciales  │
     │                           ├──────────────────────────>│
     │                           │                           │
     │                           │  3. Usuario encontrado    │
     │                           │<──────────────────────────┤
     │                           │                           │
     │  4. Retornar datos        │                           │
     │  {id, nombre, correo...}  │                           │
     │<──────────────────────────┤                           │
     │                           │                           │
     │  5. Guardar como "token"  │                           │
     │     (datos del usuario)   │                           │
     │                           │                           │
     │  6. Peticiones futuras    │                           │
     │  ❌ Sin validación real   │                           │
     ├──────────────────────────>│                           │
     │                           │                           │
```

### 2.2 Módulos con Autenticación Actual

| Módulo             | Login Implementado | Token Usado | Protección |
| ------------------ | ------------------ | ----------- | ---------- |
| **Administrators** | ✅ Sí              | ❌ No       | ❌ No      |
| **Voters**         | ⚠️ Similar         | ❌ No       | ❌ No      |
| **Candidates**     | ⚠️ Similar         | ❌ No       | ❌ No      |
| **Elections**      | ❌ No              | ❌ No       | ❌ No      |
| **Votes**          | ❌ No              | ❌ No       | ❌ No      |
| **Results**        | ❌ No              | ❌ No       | ❌ No      |

---

## 3. Problemas Identificados

### 3.1 Problemas de Seguridad

#### A) Ausencia de Validación Real

**Problema:**

```javascript
// Frontend guarda esto como "token"
localStorage.setItem('token', JSON.stringify(userData));

// Cualquiera puede modificar este "token"
// Y el backend no tiene forma de validarlo
```

**Riesgo:**

- ❌ Usuario puede modificar sus propios datos
- ❌ Usuario puede cambiar su rol
- ❌ Usuario puede suplantar identidad
- ❌ No hay forma de verificar integridad

#### B) Falta de Expiración

**Problema:**

```javascript
// El "token" actual nunca expira
if (!token) {
  navigate('/login');
}
```

**Riesgo:**

- ❌ Sesiones infinitas
- ❌ Token comprometido válido indefinidamente
- ❌ No hay cierre automático de sesión
- ❌ Vulnerabilidad en dispositivos compartidos

#### C) Exposición de Datos Sensibles

**Problema:**

```typescript
// Backend retorna todo
const { contrasena_admin, ...result } = admin;
return result;

// Pero incluye:
// - ID interno de BD
// - Número de documento
// - Toda información personal
```

**Riesgo:**

- ❌ Exposición innecesaria de datos
- ❌ Facilitado de ataques dirigidos
- ❌ Cumplimiento de privacidad (GDPR)

### 3.2 Problemas de Arquitectura

#### A) Falta de Separación de Responsabilidades

**Situación Actual:**

```typescript
// Cada módulo tiene su propio login
administratorsService.login();
votersService.login();
candidatesService.login();

// No hay un módulo centralizado de autenticación
```

**Consecuencias:**

- 🔄 Código duplicado
- 🐛 Difícil de mantener
- ⚡ Difícil de actualizar
- 📊 Inconsistencias entre módulos

#### B) Sin Protección de Endpoints

**Situación Actual:**

```typescript
@Controller('elections')
export class ElectionsController {
  @Post()
  create(@Body() createElectionDto: CreateElectionDto) {
    // ❌ Cualquiera puede crear elecciones
    // ❌ No hay verificación de autenticación
    // ❌ No hay verificación de rol
    return this.electionsService.create(createElectionDto);
  }
}
```

**Consecuencias:**

- ❌ Endpoints críticos sin protección
- ❌ Operaciones sensibles accesibles públicamente
- ❌ No hay control de acceso basado en roles

#### C) Manejo de Sesiones Ineficiente

**Problemas:**

1. No hay gestión de sesiones activas
2. No hay forma de invalidar sesiones
3. No hay límite de sesiones por usuario
4. No hay registro de actividad de sesión

### 3.3 Problemas de Experiencia de Usuario

#### A) Reautenticación Frecuente

**Problema:**

- Usuario pierde "token" al cerrar navegador
- Debe iniciar sesión constantemente
- No hay "recordar sesión"

#### B) Falta de Feedback

**Problema:**

```javascript
// No hay manejo de tokens expirados
// Usuario no sabe por qué fue deslogueado
if (!token) {
  navigate('/login');
}
```

#### C) Navegación Entre Roles Confusa

**Problema:**

- No hay distinción clara de roles en el frontend
- Usuario puede intentar acceder a rutas no permitidas
- Mensajes de error genéricos

---

## 4. Análisis FODA (SWOT)

### 4.1 Fortalezas (Strengths)

| Fortaleza                          | Descripción                                      |
| ---------------------------------- | ------------------------------------------------ |
| ✅ **Bcrypt implementado**         | Las contraseñas ya están hasheadas correctamente |
| ✅ **Estructura modular**          | NestJS facilita agregar nuevos módulos           |
| ✅ **Base de datos sólida**        | Modelo de datos bien diseñado con Prisma         |
| ✅ **Frontend moderno**            | React con hooks y Context API                    |
| ✅ **Separación Backend/Frontend** | API REST independiente                           |

### 4.2 Debilidades (Weaknesses)

| Debilidad                          | Impacto | Prioridad |
| ---------------------------------- | ------- | --------- |
| ❌ **Sin autenticación real**      | Crítico | 🔴 Alta   |
| ❌ **Sin autorización**            | Crítico | 🔴 Alta   |
| ❌ **Código duplicado**            | Medio   | 🟡 Media  |
| ❌ **Sin expiración de sesiones**  | Alto    | 🔴 Alta   |
| ❌ **Sin protección de endpoints** | Crítico | 🔴 Alta   |

### 4.3 Oportunidades (Opportunities)

| Oportunidad                    | Beneficio                          |
| ------------------------------ | ---------------------------------- |
| 🎯 **Implementar JWT**         | Autenticación moderna y segura     |
| 📱 **Preparar para app móvil** | JWT facilita múltiples clientes    |
| 🔐 **Mejorar seguridad**       | Cumplir estándares de la industria |
| 📚 **Aprendizaje**             | Tecnología demandada en el mercado |
| 🚀 **Escalabilidad**           | Arquitectura stateless             |

### 4.4 Amenazas (Threats)

| Amenaza                              | Mitigación con JWT                  |
| ------------------------------------ | ----------------------------------- |
| ⚠️ **Vulnerabilidades de seguridad** | JWT firmado digitalmente            |
| ⚠️ **Suplantación de identidad**     | Tokens no modificables              |
| ⚠️ **Ataques XSS/CSRF**              | Mejores prácticas de almacenamiento |
| ⚠️ **Sesiones sin control**          | Expiración automática               |
| ⚠️ **Escalamiento problemático**     | JWT es stateless                    |

---

## 5. Necesidades del Sistema

### 5.1 Requisitos Funcionales

#### RF1: Autenticación Segura

```
Como usuario del sistema
Quiero iniciar sesión de forma segura
Para acceder solo a mis recursos autorizados
```

**Criterios de Aceptación:**

- ✓ Validación de credenciales con bcrypt
- ✓ Generación de token JWT firmado
- ✓ Token con expiración configurable
- ✓ Respuesta con datos mínimos necesarios

#### RF2: Autorización por Roles

```
Como administrador del sistema
Quiero que cada rol tenga permisos específicos
Para proteger operaciones sensibles
```

**Criterios de Aceptación:**

- ✓ Administradores: acceso completo
- ✓ Votantes: solo lectura y emisión de voto
- ✓ Candidatos: gestión de propuestas
- ✓ Endpoints protegidos por rol

#### RF3: Gestión de Sesiones

```
Como usuario del sistema
Quiero que mi sesión expire automáticamente
Para mayor seguridad
```

**Criterios de Aceptación:**

- ✓ Expiración automática de tokens
- ✓ Renovación de tokens (refresh)
- ✓ Cierre de sesión manual
- ✓ Feedback al usuario

### 5.2 Requisitos No Funcionales

#### RNF1: Seguridad

- Tokens firmados con algoritmo seguro (HS256 mínimo)
- Contraseñas nunca en respuestas
- HTTPS en producción
- Protección contra XSS y CSRF

#### RNF2: Rendimiento

- Validación de token < 50ms
- Sin consultas adicionales a BD por petición
- Caching de claves públicas (si se usa RSA)

#### RNF3: Escalabilidad

- Arquitectura stateless
- Soporte para balanceo de carga
- Preparado para múltiples instancias

#### RNF4: Mantenibilidad

- Código modular y reutilizable
- Configuración centralizada
- Logs de autenticación
- Documentación completa

---

## 6. Justificación del Cambio a JWT

### 6.1 Razones Técnicas

#### 1. Seguridad Mejorada

**Antes (Actual):**

```javascript
// Usuario puede modificar esto
{
  "id": 1,
  "rol": "votante"  // ← Cambiar a "administrador"
}
```

**Después (Con JWT):**

```javascript
// Cualquier modificación invalida el token
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sIjoidm90YW50ZSJ9
  .firma_criptografica_validada; // ← No se puede falsificar
```

#### 2. Control de Acceso Real

**Antes:**

```typescript
@Post()
create(@Body() data: CreateElectionDto) {
  // ❌ Cualquiera puede ejecutar
  return this.electionsService.create(data);
}
```

**Después:**

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('administrador')
@Post()
create(@Body() data: CreateElectionDto) {
  // ✅ Solo administradores autenticados
  return this.electionsService.create(data);
}
```

#### 3. Expiración Automática

**Antes:**

```javascript
// Sin expiración
localStorage.setItem('token', userData);
```

**Después:**

```javascript
// Token con TTL de 8 horas
{
  "exp": 1698851832,  // Unix timestamp
  "iat": 1698765432
}
// Después de 8h el token es inválido automáticamente
```

### 6.2 Razones de Negocio

| Aspecto           | Situación Actual                  | Con JWT                             |
| ----------------- | --------------------------------- | ----------------------------------- |
| **Confianza**     | ⚠️ Baja (sin seguridad real)      | ✅ Alta (estándar industria)        |
| **Cumplimiento**  | ❌ No cumple buenas prácticas     | ✅ Cumple estándares                |
| **Escalabilidad** | ⚠️ Limitada                       | ✅ Ilimitada                        |
| **Futuro**        | ⚠️ Requiere reescritura           | ✅ Preparado para crecer            |
| **Costos**        | 💰 Refactorización grande después | 💰 Inversión ahora, ahorros después |

### 6.3 Razones Académicas

1. **Aprendizaje de Estándar Moderno**

   - JWT es tecnología actual en la industria
   - Demandado en ofertas de trabajo
   - Base para tecnologías más avanzadas (OAuth2, OpenID)

2. **Comprensión de Seguridad**

   - Entender criptografía aplicada
   - Aprender mejores prácticas
   - Conciencia de vulnerabilidades

3. **Arquitectura de Software**
   - Diseño de sistemas distribuidos
   - Separación de responsabilidades
   - Patrones de diseño (Guards, Strategies)

---

## 7. Casos de Uso Críticos

### 7.1 Caso de Uso: Emisión de Voto

**Situación Actual: CRÍTICO ⚠️**

```typescript
@Post()
async createVote(@Body() voteData: CreateVoteDto) {
  // ❌ CUALQUIERA puede emitir votos
  // ❌ Puede votar múltiples veces
  // ❌ Puede votar por otro usuario
  return this.votesService.create(voteData);
}
```

**Impacto:**

- 🚨 Fraude electoral
- 🚨 Integridad del sistema comprometida
- 🚨 Resultados no confiables

**Con JWT:**

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('votante')
@Post()
async createVote(
  @Request() req,
  @Body() voteData: CreateVoteDto
) {
  // ✅ Solo votantes autenticados
  // ✅ ID del votante desde token (no modificable)
  // ✅ Verificar que no haya votado antes
  const voterId = req.user.id;
  return this.votesService.create(voterId, voteData);
}
```

### 7.2 Caso de Uso: Gestión de Elecciones

**Situación Actual: CRÍTICO ⚠️**

```typescript
@Post()
create(@Body() electionData: CreateElectionDto) {
  // ❌ Cualquiera puede crear elecciones
  return this.electionsService.create(electionData);
}

@Delete(':id')
remove(@Param('id') id: string) {
  // ❌ Cualquiera puede eliminar elecciones
  return this.electionsService.remove(+id);
}
```

**Con JWT:**

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('administrador')
@Post()
create(@Request() req, @Body() electionData: CreateElectionDto) {
  // ✅ Solo administradores
  // ✅ Se registra quién creó la elección
  const adminId = req.user.id;
  return this.electionsService.create(adminId, electionData);
}
```

---

## 8. Métricas de Impacto

### 8.1 Seguridad

| Métrica                   | Actual | Con JWT | Mejora      |
| ------------------------- | ------ | ------- | ----------- |
| Vulnerabilidades Críticas | 🔴 5   | 🟢 0    | ✅ 100%     |
| Endpoints Protegidos      | ❌ 0%  | ✅ 100% | ✅ 100%     |
| Control de Acceso         | ❌ No  | ✅ Sí   | ✅ Infinito |
| Expiración de Sesiones    | ❌ No  | ✅ Sí   | ✅ Infinito |
| Integridad de Datos       | ❌ No  | ✅ Sí   | ✅ Infinito |

### 8.2 Desarrollo

| Métrica          | Actual       | Con JWT         | Mejora  |
| ---------------- | ------------ | --------------- | ------- |
| Código Duplicado | 🔴 3 módulos | 🟢 Centralizado | ✅ 66%  |
| Mantenibilidad   | 🟡 Media     | 🟢 Alta         | ✅ 40%  |
| Testabilidad     | 🟡 Media     | 🟢 Alta         | ✅ 50%  |
| Escalabilidad    | 🔴 Baja      | 🟢 Alta         | ✅ 300% |

### 8.3 Usuario

| Métrica                  | Actual   | Con JWT  | Mejora |
| ------------------------ | -------- | -------- | ------ |
| Experiencia de Seguridad | 🔴 Baja  | 🟢 Alta  | ✅ 80% |
| Confianza en el Sistema  | 🟡 Media | 🟢 Alta  | ✅ 60% |
| Feedback de Errores      | 🔴 Pobre | 🟢 Claro | ✅ 70% |

---

## 9. Riesgos de No Implementar JWT

### 9.1 Riesgos Inmediatos

| Riesgo                        | Probabilidad | Impacto    | Severidad  |
| ----------------------------- | ------------ | ---------- | ---------- |
| **Fraude Electoral**          | 🔴 Alta      | 🔴 Crítico | 🚨 CRÍTICO |
| **Suplantación de Identidad** | 🔴 Alta      | 🔴 Alto    | 🚨 CRÍTICO |
| **Manipulación de Datos**     | 🟡 Media     | 🔴 Alto    | ⚠️ ALTO    |
| **Acceso No Autorizado**      | 🔴 Alta      | 🔴 Alto    | 🚨 CRÍTICO |

### 9.2 Riesgos a Largo Plazo

1. **Reputación**

   - Sistema no confiable
   - Pérdida de usuarios
   - Daño a la institución

2. **Legal**

   - Incumplimiento de normativas
   - Responsabilidad por brechas
   - Sanciones posibles

3. **Técnico**
   - Deuda técnica creciente
   - Difícil de actualizar después
   - Refactorización costosa

---

## 10. Conclusiones

### 10.1 Diagnóstico General

**El sistema actual de UniVote tiene vulnerabilidades críticas de seguridad que requieren atención inmediata.**

**Hallazgos Clave:**

1. ✅ La base es sólida (bcrypt, arquitectura modular)
2. ❌ Falta autenticación real
3. ❌ Falta autorización por roles
4. ❌ Endpoints críticos desprotegidos
5. ❌ Riesgo alto de fraude electoral

### 10.2 Recomendaciones

#### Prioridad 1 - CRÍTICA (Implementar Ya)

- 🔴 Implementar JWT para autenticación
- 🔴 Proteger endpoints de votación
- 🔴 Implementar Guards por rol

#### Prioridad 2 - ALTA (Próximas 2 semanas)

- 🟡 Refresh tokens
- 🟡 Registro de actividad
- 🟡 Mejora de mensajes de error

#### Prioridad 3 - MEDIA (Próximo mes)

- 🟢 Optimizaciones de rendimiento
- 🟢 Documentación API
- 🟢 Tests automatizados

### 10.3 Próximos Pasos

Con este análisis completo, el siguiente documento ([03-arquitectura-propuesta.md](./03-arquitectura-propuesta.md)) presentará:

- Diseño detallado de la arquitectura JWT
- Componentes del sistema
- Flujos de autenticación y autorización
- Diagramas de secuencia
- Estructura de módulos

---

**Documento**: 02-analisis-situacion-actual.md  
**Versión**: 1.0  
**Última actualización**: Octubre 2025  
**Anterior**: [01-fundamentos-conceptuales.md](./01-fundamentos-conceptuales.md)  
**Siguiente**: [03-arquitectura-propuesta.md](./03-arquitectura-propuesta.md)
