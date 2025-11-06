# Funcionalidades Adicionales - UniVote

## 📚 Índice de Documentación

Esta carpeta contiene la documentación técnica para funcionalidades adicionales del sistema UniVote.

---

## 📋 Documentos Disponibles

### 1. [Recuperación de Contraseña](./01-recuperacion-contrasena.md)

**Descripción:** Estrategia completa para implementar recuperación de contraseña con código de verificación enviado por email.

**Contenido:**

- Flujo de recuperación de contraseña
- Generación de códigos de verificación
- Envío de emails con Nodemailer
- Validación y expiración de códigos
- Interfaz de usuario en React
- Seguridad y mejores prácticas

**Tecnologías:**

- Backend: NestJS, Prisma, Nodemailer
- Frontend: React, React Router
- Email: SMTP (Gmail, SendGrid, etc.)

---

### 2. [Gestión de Fotos de Candidatos](./02-gestion-fotos-candidatos.md)

**Descripción:** Estrategia para subir, optimizar y almacenar fotos de candidatos con conversión automática a WebP.

**Contenido:**

- Upload de imágenes (jpg, jpeg, png)
- Conversión automática a WebP
- Optimización de tamaño y calidad
- Nomenclatura: nombres_apellidos.webp
- Almacenamiento en servidor
- Guardado de URL en base de datos
- Validaciones y límites de tamaño

**Tecnologías:**

- Backend: NestJS, Multer, Sharp
- Frontend: React, Drag & Drop
- Almacenamiento: Sistema de archivos local
- Optimización: Sharp (librería de imágenes)

---

## 🎯 Objetivo General

Mejorar la experiencia de usuario y la funcionalidad del sistema UniVote agregando:

1. **Recuperación de contraseña**: Permitir a los usuarios recuperar acceso a sus cuentas de forma segura.
2. **Gestión de fotos**: Mejorar la presentación visual de candidatos con imágenes optimizadas.

---

## 🚀 Orden de Implementación Recomendado

```
Fase 1: Recuperación de Contraseña (1-2 semanas)
├─ Semana 1: Backend (generación de códigos, emails)
└─ Semana 2: Frontend (formularios, validaciones)

Fase 2: Gestión de Fotos (1-2 semanas)
├─ Semana 1: Backend (upload, conversión, almacenamiento)
└─ Semana 2: Frontend (interfaz de carga, preview)
```

---

## 📊 Estimación de Esfuerzo

| Funcionalidad              | Backend | Frontend | Testing | Total   |
| -------------------------- | ------- | -------- | ------- | ------- |
| Recuperación de Contraseña | 12h     | 8h       | 4h      | 24h     |
| Gestión de Fotos           | 10h     | 6h       | 4h      | 20h     |
| **Total**                  | **22h** | **14h**  | **8h**  | **44h** |

---

## 🔗 Enlaces Relacionados

- [Documentación Principal](../../README.md)
- [Backend README](../../Backend/README.md)
- [Frontend README](../../Frontend/README.md)
- [Estrategia JWT](../estrategia-jwt/README.md)

---

## 👥 Contribución

Estos documentos fueron creados como parte del proyecto académico UniVote del SENA.

**Fecha de creación:** Octubre 2025  
**Versión:** 1.0  
**Autores:** Equipo de desarrollo UniVote

---

## 📝 Notas Importantes

- Ambas funcionalidades son independientes y pueden implementarse en cualquier orden
- Se recomienda tener JWT implementado antes de estas funcionalidades
- Las pruebas deben realizarse en entorno de desarrollo antes de producción
- Considerar límites de rate limiting para prevenir abuso

---

**Actualizado:** Octubre 2025
