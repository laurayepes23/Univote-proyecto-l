// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BigIntInterceptor } from './interceptors/bigint.interceptor';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 1. Habilitar CORS para permitir peticiones desde el frontend
  app.enableCors({
    origin: 'http://localhost:5173', // URL del frontend
    credentials: true, // Permitir cookies y autenticación
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // Métodos permitidos
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'], // Headers permitidos
  });

  // 2. Servir archivos estáticos para las fotos de candidatos
  // Esto hace que los archivos en la carpeta 'uploads/candidatos' sean accesibles
  app.useStaticAssets(join(__dirname, '..', 'uploads', 'candidatos'), {
    prefix: '/uploads/candidatos/',
    index: false, // No servir index.html
    dotfiles: 'deny', // No servir archivos ocultos
  });

  // 3. Servir archivos estáticos para uploads generales (backup)
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
    index: false,
    dotfiles: 'deny',
  });

  // 4. Aplicar un ValidationPipe globalmente para validar y transformar los DTOs
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Remueve propiedades que no están en el DTO
    forbidNonWhitelisted: true, // Lanza un error si hay propiedades no definidas en el DTO
    transform: true, // Transforma los tipos del body automáticamente
    transformOptions: {
      enableImplicitConversion: true, // Convierte automáticamente strings a numbers, etc.
    },
  }));

  // 5. Aplicar el interceptor global para manejar la serialización de BigInt
  app.useGlobalInterceptors(new BigIntInterceptor());

  // 6. Configuración global para límites de payload (importante para uploads de imágenes)
  app.use((req, res, next) => {
    // Aumentar límite para uploads de imágenes (5MB)
    if (req.url.includes('/candidates/') && (req.method === 'POST' || req.method === 'PATCH')) {
      req.setTimeout(30000); // 30 segundos timeout para uploads
    }
    next();
  });

  // Iniciar la aplicación en el puerto 3000
  await app.listen(3000);
  console.log(`🚀 Application is running on: ${await app.getUrl()}`);
  console.log(`📁 Archivos estáticos servidos desde: ${join(__dirname, '..', 'uploads')}`);
  console.log(`📸 Fotos de candidatos disponibles en: http://localhost:3000/uploads/candidatos/`);
}

bootstrap();