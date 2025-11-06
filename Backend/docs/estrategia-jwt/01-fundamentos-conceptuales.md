# 01 - Fundamentos Conceptuales de JWT

## 📚 Introducción

Este documento establece las bases teóricas necesarias para comprender la implementación de autenticación mediante JSON Web Tokens (JWT) en el sistema UniVote.

---

## 1. ¿Qué es JWT?

### Definición

**JWT (JSON Web Token)** es un estándar abierto (RFC 7519) que define una forma compacta y autónoma de transmitir información de manera segura entre partes como un objeto JSON. Esta información puede ser verificada y confiada porque está firmada digitalmente.

### Características Principales

- **Compacto**: Su tamaño reducido permite transmitirlo fácilmente vía URL, POST parameter o HTTP header
- **Autónomo**: Contiene toda la información necesaria sobre el usuario, evitando consultas adicionales a la base de datos
- **Seguro**: Está firmado digitalmente usando algoritmos como HMAC o RSA
- **Stateless**: No requiere almacenar sesiones en el servidor

---

## 2. ¿Para Qué Sirve JWT?

### Propósitos Principales

#### 2.1 Autenticación

Después de que un usuario inicia sesión, cada petición subsecuente incluirá el JWT, permitiendo al usuario acceder a rutas, servicios y recursos que están permitidos con ese token.

#### 2.2 Intercambio de Información

Los JWT pueden ser firmados, lo que permite verificar que los emisores son quienes dicen ser y que el contenido no ha sido alterado.

### Casos de Uso en UniVote

```
┌─────────────────────────────────────────────────────┐
│                  Casos de Uso JWT                   │
├─────────────────────────────────────────────────────┤
│ 1. Login de Administradores                         │
│ 2. Login de Votantes                                │
│ 3. Login de Candidatos                              │
│ 4. Protección de endpoints de API                   │
│ 5. Validación de permisos por rol                   │
│ 6. Acceso a recursos protegidos                     │
│ 7. Emisión de votos (votante autenticado)          │
│ 8. Gestión de elecciones (admin autenticado)       │
└─────────────────────────────────────────────────────┘
```

---

## 3. ¿Cómo Funciona JWT?

### 3.1 Estructura de un Token JWT

Un JWT consta de **tres partes** separadas por puntos (`.`):

```
xxxxx.yyyyy.zzzzz
```

#### Ejemplo Real:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

### 3.2 Componentes del Token

#### A) Header (Encabezado)

Contiene dos partes:

- **typ**: Tipo de token (JWT)
- **alg**: Algoritmo de firma (HS256, RS256, etc.)

```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

**Codificado en Base64Url**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`

#### B) Payload (Carga útil)

Contiene las **claims** (declaraciones) sobre una entidad (usuario) y metadata adicional.

**Tipos de Claims:**

1. **Registered Claims** (Estándar)

   - `iss` (issuer): Emisor del token
   - `sub` (subject): Sujeto del token (ID del usuario)
   - `aud` (audience): Audiencia del token
   - `exp` (expiration): Tiempo de expiración
   - `iat` (issued at): Momento de emisión
   - `nbf` (not before): No válido antes de

2. **Public Claims** (Públicos)

   - Definidos en el registro IANA o como URI

3. **Private Claims** (Privados)
   - Personalizados para compartir información entre partes

**Ejemplo para UniVote:**

```json
{
  "sub": "12345",
  "correo": "admin@univote.edu",
  "rol": "administrador",
  "nombre": "Juan",
  "apellido": "Pérez",
  "iat": 1698765432,
  "exp": 1698851832
}
```

**Codificado en Base64Url**: `eyJzdWIiOiIxMjM0NSIsImNvcnJlbyI6ImFkbWluQHVuaXZvdGUuZWR1Ii...`

#### C) Signature (Firma)

Se crea tomando el header codificado, el payload codificado, una clave secreta y el algoritmo especificado en el header.

```javascript
HMACSHA256(base64UrlEncode(header) + '.' + base64UrlEncode(payload), secret);
```

**Propósito de la Firma:**

- Verificar que el mensaje no fue alterado
- Verificar la identidad del emisor (si se usa clave privada)

---

## 4. Flujo de Autenticación JWT

### 4.1 Diagrama de Flujo Completo

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
     │                           │  2. Buscar usuario        │
     │                           ├──────────────────────────>│
     │                           │                           │
     │                           │  3. Usuario encontrado    │
     │                           │<──────────────────────────┤
     │                           │                           │
     │                           │  4. Verificar contraseña  │
     │                           │     (bcrypt.compare)      │
     │                           │                           │
     │                           │  5. Generar JWT           │
     │                           │     - Header              │
     │                           │     - Payload             │
     │                           │     - Signature           │
     │                           │                           │
     │  6. Respuesta con token   │                           │
     │  {access_token: "xxx..."}│                           │
     │<──────────────────────────┤                           │
     │                           │                           │
     │  7. Guardar token         │                           │
     │     localStorage/context  │                           │
     │                           │                           │
     │  8. GET /api/protected    │                           │
     │  Header: Bearer xxx...    │                           │
     ├──────────────────────────>│                           │
     │                           │                           │
     │                           │  9. Validar token         │
     │                           │     - Verificar firma     │
     │                           │     - Verificar expiración│
     │                           │                           │
     │                           │ 10. Extraer datos usuario │
     │                           │                           │
     │ 11. Respuesta autorizada  │                           │
     │<──────────────────────────┤                           │
     │                           │                           │
```

### 4.2 Proceso Paso a Paso

#### **Paso 1: Solicitud de Autenticación**

El cliente envía credenciales (correo y contraseña) al servidor.

#### **Paso 2: Validación de Credenciales**

El servidor:

1. Busca al usuario en la base de datos por correo
2. Compara la contraseña hasheada con bcrypt
3. Valida que el usuario esté activo

#### **Paso 3: Generación del Token**

Si las credenciales son válidas:

1. Se crea el payload con información del usuario
2. Se firma el payload con la clave secreta
3. Se genera el token completo

#### **Paso 4: Envío del Token**

El servidor responde con el token JWT al cliente.

#### **Paso 5: Almacenamiento del Token**

El cliente guarda el token (localStorage, sessionStorage, o memoria).

#### **Paso 6: Uso del Token**

En cada petición subsecuente:

1. El cliente incluye el token en el header Authorization
2. Formato: `Authorization: Bearer <token>`

#### **Paso 7: Validación del Token**

El servidor:

1. Extrae el token del header
2. Verifica la firma
3. Verifica la expiración
4. Extrae los datos del usuario

#### **Paso 8: Autorización**

El servidor decide si permite o niega el acceso basándose en:

- Validez del token
- Rol del usuario
- Permisos específicos

---

## 5. Ventajas de JWT

### 5.1 Ventajas Técnicas

| Ventaja           | Descripción                                | Impacto en UniVote                     |
| ----------------- | ------------------------------------------ | -------------------------------------- |
| **Stateless**     | No requiere almacenar sesiones en servidor | Escalabilidad mejorada                 |
| **Independencia** | Funciona en múltiples dominios             | Arquitectura de microservicios posible |
| **Compacto**      | Tamaño pequeño, fácil de transmitir        | Menor uso de ancho de banda            |
| **Seguro**        | Firmado digitalmente                       | Integridad de datos garantizada        |
| **Autocontenido** | Contiene toda la info necesaria            | Menos consultas a BD                   |
| **Estándar**      | RFC 7519, ampliamente adoptado             | Compatibilidad con librerías           |

### 5.2 Beneficios para UniVote

1. **Mejor Rendimiento**

   - Reduce consultas a base de datos
   - Validación rápida de autenticación

2. **Escalabilidad**

   - Permite balanceo de carga
   - No requiere sticky sessions

3. **Seguridad Mejorada**

   - Tokens con expiración
   - Difíciles de falsificar
   - Rotación de tokens posible

4. **Mejor Experiencia de Usuario**

   - Sesiones más largas
   - Login único (SSO posible)
   - Menos reautenticaciones

5. **Facilita Integraciones**
   - API más accesible
   - Posibilidad de app móvil futura
   - Integración con servicios externos

---

## 6. Desventajas y Consideraciones

### 6.1 Desventajas

| Desventaja        | Descripción                        | Mitigación                             |
| ----------------- | ---------------------------------- | -------------------------------------- |
| **Tamaño**        | Mayor que una session ID           | Usar claims mínimos necesarios         |
| **Revocación**    | Difícil invalidar antes de expirar | Implementar refresh tokens             |
| **Seguridad XSS** | Vulnerable si se almacena mal      | Usar httpOnly cookies o secure storage |
| **No encriptado** | Payload es visible (base64)        | No almacenar datos sensibles           |

### 6.2 Consideraciones para UniVote

1. **Tiempo de Expiración**

   - Votantes: 24 horas (uso ocasional)
   - Administradores: 8 horas (uso frecuente)
   - Candidatos: 12 horas (uso moderado)

2. **Información en el Token**

   - ✅ Incluir: ID, correo, rol, nombre
   - ❌ No incluir: contraseña, datos sensibles

3. **Almacenamiento en Frontend**
   - Usar Context API + sessionStorage
   - Limpiar al cerrar sesión
   - Validar antes de cada petición

---

## 7. JWT vs Sesiones Tradicionales

### 7.1 Comparación

```
┌─────────────────────┬──────────────────────┬──────────────────────┐
│   Característica    │   Sesiones Cookie    │         JWT          │
├─────────────────────┼──────────────────────┼──────────────────────┤
│ Almacenamiento      │ Servidor (memoria/BD)│ Cliente (token)      │
│ Escalabilidad       │ Difícil (sticky)     │ Fácil (stateless)    │
│ Tamaño              │ Pequeño (ID)         │ Mayor (datos)        │
│ Base de datos       │ Consultas frecuentes │ Consultas mínimas    │
│ Revocación          │ Inmediata            │ Compleja             │
│ Compartir entre     │ Difícil              │ Fácil                │
│ dominios            │                      │                      │
│ Rendimiento         │ Medio                │ Alto                 │
│ Complejidad         │ Baja                 │ Media                │
└─────────────────────┴──────────────────────┴──────────────────────┘
```

### 7.2 Por Qué JWT para UniVote

**Razones Técnicas:**

1. Sistema en crecimiento que necesita escalar
2. Posibilidad de futuras apps móviles
3. API RESTful que será consumida por diferentes clientes
4. Reducción de carga en base de datos

**Razones Académicas:**

1. Tecnología moderna y demandada
2. Estándar de la industria
3. Mejor para aprendizaje de arquitecturas distribuidas

---

## 8. Conceptos Relacionados

### 8.1 Access Token vs Refresh Token

**Access Token:**

- Corta duración (minutos/horas)
- Usado para acceder a recursos
- Se envía en cada petición

**Refresh Token:**

- Larga duración (días/semanas)
- Usado para obtener nuevos access tokens
- Se almacena de forma más segura

### 8.2 Claims Estándar Útiles

```javascript
{
  "iss": "https://univote.edu",          // Emisor
  "sub": "12345",                        // ID del usuario
  "aud": "univote-app",                  // Audiencia
  "exp": 1698851832,                     // Expiración (Unix timestamp)
  "nbf": 1698765432,                     // No válido antes de
  "iat": 1698765432,                     // Emitido en
  "jti": "unique-token-id-123"           // ID único del token
}
```

### 8.3 Algoritmos de Firma

| Algoritmo | Tipo       | Uso Recomendado                 |
| --------- | ---------- | ------------------------------- |
| **HS256** | Simétrico  | Desarrollo, apps pequeñas       |
| **HS384** | Simétrico  | Mayor seguridad                 |
| **HS512** | Simétrico  | Máxima seguridad simétrica      |
| **RS256** | Asimétrico | Producción, múltiples servicios |
| **RS384** | Asimétrico | Alta seguridad                  |
| **RS512** | Asimétrico | Máxima seguridad asimétrica     |

**Recomendación para UniVote:**

- **Desarrollo**: HS256 (más simple)
- **Producción**: RS256 (más seguro, permite verificación sin exponer clave)

---

## 9. Glosario de Términos

| Término       | Definición                                              |
| ------------- | ------------------------------------------------------- |
| **Token**     | Cadena de texto que representa credenciales de acceso   |
| **Claim**     | Pieza de información sobre una entidad                  |
| **Payload**   | Datos contenidos en el JWT                              |
| **Signature** | Firma criptográfica del token                           |
| **Bearer**    | Esquema de autenticación donde el portador tiene acceso |
| **Base64Url** | Codificación que hace el texto seguro para URLs         |
| **HMAC**      | Hash-based Message Authentication Code                  |
| **RSA**       | Algoritmo de cifrado asimétrico                         |
| **Stateless** | Sin estado, no almacena sesiones en servidor            |
| **TTL**       | Time To Live, tiempo de vida del token                  |

---

## 10. Recursos para Profundizar

### 10.1 Documentación Oficial

- [RFC 7519 - JWT Specification](https://tools.ietf.org/html/rfc7519)
- [JWT.io - Debugger y Librerías](https://jwt.io/)
- [Auth0 - JWT Handbook](https://auth0.com/resources/ebooks/jwt-handbook)

### 10.2 Herramientas

- **JWT.io Debugger**: Decodificar y verificar tokens
- **Postman**: Probar APIs con JWT
- **Chrome DevTools**: Inspeccionar tokens en aplicaciones

### 10.3 Seguridad

- [OWASP JWT Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- [JWT Security Best Practices](https://curity.io/resources/learn/jwt-best-practices/)

---

## 📝 Resumen Ejecutivo

### Puntos Clave

1. **JWT es un estándar** para transmitir información de forma segura
2. **Consta de tres partes**: Header, Payload y Signature
3. **Es stateless**: No requiere almacenar sesiones en servidor
4. **Ideal para APIs**: Especialmente en arquitecturas modernas
5. **Requiere consideraciones de seguridad**: Expiración, almacenamiento, claims

### Preparación para Siguiente Documento

Ahora que comprendes los fundamentos de JWT, el siguiente documento ([02-analisis-situacion-actual.md](./02-analisis-situacion-actual.md)) analizará:

- El estado actual del sistema de autenticación en UniVote
- Problemas identificados
- Por qué necesitamos cambiar a JWT
- Qué beneficios específicos obtendremos

---

**Documento**: 01-fundamentos-conceptuales.md  
**Versión**: 1.0  
**Última actualización**: Octubre 2025  
**Siguiente**: [02-analisis-situacion-actual.md](./02-analisis-situacion-actual.md)
