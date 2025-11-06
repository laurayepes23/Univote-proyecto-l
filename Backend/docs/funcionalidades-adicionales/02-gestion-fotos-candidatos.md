# 02 - Gestión de Fotos de Candidatos

## 📸 Introducción

Este documento describe la estrategia completa para implementar la carga, optimización y almacenamiento de fotos de candidatos en UniVote, con conversión automática a formato WebP y nomenclatura estandarizada.

---

## 1. Flujo General del Proceso

### 1.1 Diagrama de Flujo

```
┌─────────────────────────────────────────────────────────────┐
│              FLUJO DE CARGA DE FOTO                          │
└─────────────────────────────────────────────────────────────┘

1. Candidato selecciona imagen (jpg, jpeg, png)
                    ↓
2. Frontend valida formato y tamaño (<5MB)
                    ↓
3. Preview de la imagen en pantalla
                    ↓
4. Candidato confirma y sube
                    ↓
5. Backend recibe archivo con Multer
                    ↓
6. Validación de formato y tamaño
                    ↓
7. Conversión a WebP con Sharp
                    ↓
8. Optimización (calidad 80%, max 800x800px)
                    ↓
9. Renombrar: nombres_apellidos.webp
                    ↓
10. Guardar en /Backend/uploads/candidatos/
                    ↓
11. Actualizar BD con URL de la foto
                    ↓
12. Respuesta con URL para mostrar en frontend
```

### 1.2 Estructura de Archivos

```
Backend/
├── uploads/
│   └── candidatos/
│       ├── juan_perez.webp
│       ├── maria_garcia.webp
│       └── carlos_rodriguez.webp
└── src/
    └── candidates/
        ├── candidates.controller.ts
        ├── candidates.service.ts
        └── upload.config.ts
```

---

## 2. Implementación Backend

### 2.1 Instalar Dependencias

```bash
cd Backend

# Multer para upload de archivos
npm install @nestjs/platform-express multer

# Sharp para procesamiento de imágenes
npm install sharp

# Types para TypeScript
npm install -D @types/multer
```

### 2.2 Crear Directorio de Uploads

```bash
mkdir -p Backend/uploads/candidatos
```

**Agregar a .gitignore:**

```
# Archivos subidos
uploads/
```

### 2.3 Configuración de Multer

**Archivo**: `Backend/src/candidates/upload.config.ts`

```typescript
import { diskStorage } from 'multer';
import { extname } from 'path';
import { BadRequestException } from '@nestjs/common';

export const multerConfig = {
  // Almacenamiento temporal (antes de procesar)
  storage: diskStorage({
    destination: './uploads/temp',
    filename: (req, file, callback) => {
      // Nombre temporal único
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = extname(file.originalname);
      callback(null, `temp-${uniqueSuffix}${ext}`);
    },
  }),

  // Límites
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },

  // Filtro de archivos
  fileFilter: (req, file, callback) => {
    // Validar tipo de archivo
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      return callback(
        new BadRequestException(
          'Solo se permiten imágenes en formato JPG, JPEG o PNG'
        ),
        false
      );
    }

    callback(null, true);
  },
};
```

### 2.4 Servicio de Procesamiento de Imágenes

**Archivo**: `Backend/src/candidates/image-processor.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import * as sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ImageProcessorService {
  private readonly logger = new Logger(ImageProcessorService.name);
  private readonly uploadsDir = path.join(
    process.cwd(),
    'uploads',
    'candidatos'
  );

  constructor() {
    // Crear directorio si no existe
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
      this.logger.log(`Directorio creado: ${this.uploadsDir}`);
    }
  }

  /**
   * Procesar imagen: convertir a WebP, optimizar y renombrar
   */
  async processImage(
    tempFilePath: string,
    nombre: string,
    apellido: string
  ): Promise<string> {
    try {
      // Limpiar nombres (remover caracteres especiales)
      const cleanNombre = this.cleanFileName(nombre);
      const cleanApellido = this.cleanFileName(apellido);

      // Nombre final del archivo
      const fileName = `${cleanNombre}_${cleanApellido}.webp`;
      const outputPath = path.join(this.uploadsDir, fileName);

      // Procesar imagen con Sharp
      await sharp(tempFilePath)
        .resize(800, 800, {
          fit: 'inside', // Mantener proporción
          withoutEnlargement: true, // No agrandar si es más pequeña
        })
        .webp({
          quality: 80, // Calidad 80%
          effort: 6, // Esfuerzo de compresión (0-6)
        })
        .toFile(outputPath);

      // Eliminar archivo temporal
      fs.unlinkSync(tempFilePath);

      this.logger.log(`Imagen procesada: ${fileName}`);

      // Retornar URL relativa
      return `/uploads/candidatos/${fileName}`;
    } catch (error) {
      this.logger.error('Error al procesar imagen:', error);

      // Limpiar archivo temporal si existe
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }

      throw new Error('Error al procesar la imagen');
    }
  }

  /**
   * Limpiar nombre de archivo (remover acentos, espacios, caracteres especiales)
   */
  private cleanFileName(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD') // Descomponer caracteres con acentos
      .replace(/[\u0300-\u036f]/g, '') // Remover acentos
      .replace(/[^a-z0-9]/g, '_') // Reemplazar caracteres especiales con _
      .replace(/_+/g, '_') // Remover guiones bajos múltiples
      .replace(/^_|_$/g, ''); // Remover guiones bajos al inicio/final
  }

  /**
   * Eliminar foto anterior de candidato
   */
  async deleteImage(fotoCandidato: string): Promise<void> {
    if (!fotoCandidato) return;

    try {
      // Extraer nombre del archivo de la URL
      const fileName = path.basename(fotoCandidato);
      const filePath = path.join(this.uploadsDir, fileName);

      // Verificar si existe y eliminar
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        this.logger.log(`Imagen eliminada: ${fileName}`);
      }
    } catch (error) {
      this.logger.error('Error al eliminar imagen:', error);
      // No lanzar error, solo registrar
    }
  }

  /**
   * Verificar si una imagen existe
   */
  imageExists(fotoCandidato: string): boolean {
    if (!fotoCandidato) return false;

    const fileName = path.basename(fotoCandidato);
    const filePath = path.join(this.uploadsDir, fileName);

    return fs.existsSync(filePath);
  }
}
```

### 2.5 Actualizar CandidatesService

**Archivo**: `Backend/src/candidates/candidates.service.ts`

```typescript
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ImageProcessorService } from './image-processor.service';
import { UpdateCandidateDto } from './dto/update-candidate.dto';

@Injectable()
export class CandidatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly imageProcessor: ImageProcessorService
  ) {}

  /**
   * Subir foto de candidato
   */
  async uploadPhoto(candidateId: number, file: Express.Multer.File) {
    // Buscar candidato
    const candidate = await this.prisma.candidate.findUnique({
      where: { id: candidateId },
    });

    if (!candidate) {
      throw new NotFoundException('Candidato no encontrado');
    }

    try {
      // Eliminar foto anterior si existe
      if (candidate.fotoCandidato) {
        await this.imageProcessor.deleteImage(candidate.fotoCandidato);
      }

      // Procesar nueva imagen
      const photoUrl = await this.imageProcessor.processImage(
        file.path,
        candidate.nombre,
        candidate.apellido
      );

      // Actualizar en base de datos
      const updatedCandidate = await this.prisma.candidate.update({
        where: { id: candidateId },
        data: { fotoCandidato: photoUrl },
      });

      return {
        message: 'Foto subida exitosamente',
        fotoCandidato: updatedCandidate.fotoCandidato,
      };
    } catch (error) {
      throw new BadRequestException('Error al procesar la imagen');
    }
  }

  /**
   * Eliminar foto de candidato
   */
  async deletePhoto(candidateId: number) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id: candidateId },
    });

    if (!candidate) {
      throw new NotFoundException('Candidato no encontrado');
    }

    if (!candidate.fotoCandidato) {
      throw new BadRequestException('El candidato no tiene foto');
    }

    // Eliminar archivo
    await this.imageProcessor.deleteImage(candidate.fotoCandidato);

    // Actualizar BD
    await this.prisma.candidate.update({
      where: { id: candidateId },
      data: { fotoCandidato: null },
    });

    return {
      message: 'Foto eliminada exitosamente',
    };
  }

  /**
   * Obtener candidato con foto
   */
  async findOne(id: number) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id },
      include: {
        career: true,
        election: true,
      },
    });

    if (!candidate) {
      throw new NotFoundException('Candidato no encontrado');
    }

    return candidate;
  }
}
```

### 2.6 Actualizar CandidatesController

**Archivo**: `Backend/src/candidates/candidates.controller.ts`

```typescript
import {
  Controller,
  Post,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  ParseIntPipe,
  Get,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CandidatesService } from './candidates.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { multerConfig } from './upload.config';

@Controller('candidates')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CandidatesController {
  constructor(private readonly candidatesService: CandidatesService) {}

  /**
   * Subir foto de candidato
   * Solo el candidato puede subir su propia foto
   */
  @Post(':id/photo')
  @Roles('candidato')
  @UseInterceptors(FileInterceptor('photo', multerConfig))
  async uploadPhoto(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any
  ) {
    // Verificar que el candidato solo pueda subir su propia foto
    if (user.userId !== id) {
      throw new BadRequestException(
        'Solo puedes subir tu propia foto de perfil'
      );
    }

    if (!file) {
      throw new BadRequestException('No se ha proporcionado ninguna imagen');
    }

    return this.candidatesService.uploadPhoto(id, file);
  }

  /**
   * Eliminar foto de candidato
   */
  @Delete(':id/photo')
  @Roles('candidato', 'administrador')
  async deletePhoto(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any
  ) {
    // Candidato solo puede eliminar su propia foto
    if (user.rol === 'candidato' && user.userId !== id) {
      throw new BadRequestException(
        'Solo puedes eliminar tu propia foto de perfil'
      );
    }

    return this.candidatesService.deletePhoto(id);
  }

  /**
   * Obtener candidato (incluye foto)
   */
  @Get(':id')
  @Roles('candidato', 'votante', 'administrador')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.candidatesService.findOne(id);
  }
}
```

### 2.7 Actualizar CandidatesModule

**Archivo**: `Backend/src/candidates/candidates.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { CandidatesService } from './candidates.service';
import { CandidatesController } from './candidates.controller';
import { ImageProcessorService } from './image-processor.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CandidatesController],
  providers: [CandidatesService, ImageProcessorService],
  exports: [CandidatesService],
})
export class CandidatesModule {}
```

### 2.8 Servir Archivos Estáticos

**Archivo**: `Backend/src/main.ts`

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Servir archivos estáticos
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads',
  });

  // Validación global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // CORS
  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
  });

  await app.listen(3000);
}
bootstrap();
```

---

## 3. Implementación Frontend

### 3.1 Crear Componente de Upload

**Archivo**: `Frontend/src/components/PhotoUpload.jsx`

```javascript
import { useState, useRef } from 'react';
import axios from '../api/axios';

const PhotoUpload = ({ candidateId, currentPhoto, onUploadSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(currentPhoto || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    // Validar tipo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setError('Solo se permiten imágenes JPG, JPEG o PNG');
      return;
    }

    // Validar tamaño (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no debe superar los 5 MB');
      return;
    }

    setError('');
    setSelectedFile(file);

    // Crear preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Por favor selecciona una imagen');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('photo', selectedFile);

      const response = await axios.post(
        `/candidates/${candidateId}/photo`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      // Callback de éxito
      if (onUploadSuccess) {
        onUploadSuccess(response.data.fotoCandidato);
      }

      setSelectedFile(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al subir la imagen');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de eliminar tu foto de perfil?')) {
      return;
    }

    setUploading(true);
    setError('');

    try {
      await axios.delete(`/candidates/${candidateId}/photo`);

      setPreview(null);
      setSelectedFile(null);

      if (onUploadSuccess) {
        onUploadSuccess(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al eliminar la imagen');
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreview(currentPhoto);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Foto de Perfil</h3>

      {/* Preview de la imagen */}
      <div className="mb-4 flex justify-center">
        <div className="relative w-48 h-48 rounded-full overflow-hidden bg-gray-200 border-4 border-gray-300">
          {preview ? (
            <img
              src={
                preview.startsWith('data:')
                  ? preview
                  : `http://localhost:3000${preview}`
              }
              alt="Preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <svg
                className="w-20 h-20"
                fill="currentColor"
                viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Mensajes de error */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
          {error}
        </div>
      )}

      {/* Input de archivo (oculto) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Botones */}
      <div className="space-y-2">
        {!selectedFile ? (
          <>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
              Seleccionar Imagen
            </button>

            {currentPhoto && (
              <button
                onClick={handleDelete}
                disabled={uploading}
                className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50">
                {uploading ? 'Eliminando...' : 'Eliminar Foto'}
              </button>
            )}
          </>
        ) : (
          <>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50">
              {uploading ? (
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
                  Subiendo...
                </span>
              ) : (
                'Subir Foto'
              )}
            </button>

            <button
              onClick={handleCancel}
              disabled={uploading}
              className="w-full bg-gray-400 text-white py-2 px-4 rounded-lg hover:bg-gray-500 transition-colors disabled:opacity-50">
              Cancelar
            </button>
          </>
        )}
      </div>

      {/* Información */}
      <div className="mt-4 text-xs text-gray-500 space-y-1">
        <p>• Formatos permitidos: JPG, JPEG, PNG</p>
        <p>• Tamaño máximo: 5 MB</p>
        <p>• La imagen se convertirá automáticamente a WebP</p>
        <p>• Dimensiones recomendadas: 800x800 px</p>
      </div>
    </div>
  );
};

export default PhotoUpload;
```

### 3.2 Usar el Componente en Perfil de Candidato

**Archivo**: `Frontend/src/pages/MiPerfilCandidato.jsx`

```javascript
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import NavbarCandidato from '../components/NavbarCandidato';
import PhotoUpload from '../components/PhotoUpload';
import axios from '../api/axios';

const MiPerfilCandidato = () => {
  const { user } = useAuth();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCandidateData();
  }, [user]);

  const fetchCandidateData = async () => {
    try {
      const response = await axios.get(`/candidates/${user.userId}`);
      setCandidate(response.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUploadSuccess = (newPhotoUrl) => {
    setCandidate((prev) => ({
      ...prev,
      fotoCandidato: newPhotoUrl,
    }));
  };

  if (loading) {
    return (
      <div>
        <NavbarCandidato />
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <NavbarCandidato />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Mi Perfil</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Columna izquierda: Foto */}
          <div className="md:col-span-1">
            <PhotoUpload
              candidateId={user.userId}
              currentPhoto={candidate?.fotoCandidato}
              onUploadSuccess={handlePhotoUploadSuccess}
            />
          </div>

          {/* Columna derecha: Información */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold mb-4">
                Información Personal
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-600">Nombre</label>
                  <p className="text-lg font-medium">
                    {candidate?.nombre} {candidate?.apellido}
                  </p>
                </div>

                <div>
                  <label className="text-sm text-gray-600">Correo</label>
                  <p className="text-lg">{candidate?.correo}</p>
                </div>

                <div>
                  <label className="text-sm text-gray-600">Documento</label>
                  <p className="text-lg">{candidate?.documento}</p>
                </div>

                <div>
                  <label className="text-sm text-gray-600">Carrera</label>
                  <p className="text-lg">{candidate?.career?.nombre}</p>
                </div>

                <div>
                  <label className="text-sm text-gray-600">Estado</label>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      candidate?.estado === 'aprobado'
                        ? 'bg-green-100 text-green-800'
                        : candidate?.estado === 'pendiente'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                    {candidate?.estado}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiPerfilCandidato;
```

### 3.3 Mostrar Foto en Lista de Candidatos

**Archivo**: `Frontend/src/pages/CandidatosVotante.jsx`

```javascript
import { useState, useEffect } from 'react';
import axios from '../api/axios';
import NavbarVotante from '../components/NavbarVotante';

const CandidatosVotante = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      const response = await axios.get('/candidates');
      setCandidates(response.data);
    } catch (error) {
      console.error('Error al cargar candidatos:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <NavbarVotante />
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <NavbarVotante />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Candidatos</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {candidates.map((candidate) => (
            <div
              key={candidate.id}
              className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              {/* Foto del candidato */}
              <div className="h-48 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                {candidate.fotoCandidato ? (
                  <img
                    src={`http://localhost:3000${candidate.fotoCandidato}`}
                    alt={`${candidate.nombre} ${candidate.apellido}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <svg
                    className="w-24 h-24 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>

              {/* Información */}
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">
                  {candidate.nombre} {candidate.apellido}
                </h3>

                <p className="text-gray-600 mb-2">{candidate.career?.nombre}</p>

                <div className="flex items-center justify-between mt-4">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      candidate.estado === 'aprobado'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                    {candidate.estado}
                  </span>

                  <button className="text-blue-600 hover:text-blue-800 font-medium">
                    Ver Propuestas →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CandidatosVotante;
```

---

## 4. Testing

### 4.1 Probar Upload desde Postman

```bash
# Crear request POST
URL: http://localhost:3000/candidates/1/photo
Method: POST
Headers:
  Authorization: Bearer [tu-token-jwt]

Body:
  Type: form-data
  Key: photo
  Type: File
  Value: Seleccionar una imagen JPG/PNG
```

### 4.2 Verificar Procesamiento

1. **Revisar directorio:**

```bash
ls Backend/uploads/candidatos/
# Debe aparecer: juan_perez.webp
```

2. **Verificar tamaño:**

```bash
du -h Backend/uploads/candidatos/juan_perez.webp
# Debe ser menor que la imagen original
```

3. **Verificar en navegador:**

```
http://localhost:3000/uploads/candidatos/juan_perez.webp
```

### 4.3 Probar desde Frontend

1. Login como candidato
2. Ir a "Mi Perfil"
3. Seleccionar una imagen
4. Verificar preview
5. Subir imagen
6. Verificar que se muestra correctamente
7. Probar eliminar foto
8. Verificar que desaparece

---

## 5. Optimizaciones y Mejoras

### 5.1 Validaciones Adicionales

```typescript
// En upload.config.ts
fileFilter: (req, file, callback) => {
  // Validar dimensiones mínimas
  const image = sharp(file.buffer);
  image.metadata().then((metadata) => {
    if (metadata.width < 200 || metadata.height < 200) {
      return callback(
        new BadRequestException('La imagen debe ser de al menos 200x200 px'),
        false,
      );
    }
    callback(null, true);
  });
},
```

### 5.2 Agregar Drag & Drop en Frontend

```javascript
const PhotoUpload = ({ candidateId, currentPhoto, onUploadSuccess }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      // Simular selección de archivo
      handleFileSelect({ target: { files: [file] } });
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-lg p-6 ${
        isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
      }`}>
      {/* Contenido del componente */}
    </div>
  );
};
```

### 5.3 Lazy Loading de Imágenes

```javascript
const LazyImage = ({ src, alt, className }) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative">
      {!loaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse"></div>
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} ${
          loaded ? 'opacity-100' : 'opacity-0'
        } transition-opacity`}
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
};
```

---

## 6. Seguridad y Mejores Prácticas

### 6.1 Validaciones de Seguridad

✅ **Validar tipo MIME**: No solo extensión
✅ **Limitar tamaño**: Máximo 5 MB
✅ **Sanitizar nombres**: Remover caracteres especiales
✅ **Verificar ownership**: Solo el candidato puede subir su foto
✅ **Rate limiting**: Limitar subidas por tiempo

### 6.2 Protección contra Malware

```typescript
// Opcional: Escanear archivos con antivirus
import * as ClamScan from 'clamscan';

const scanFile = async (filePath: string): Promise<boolean> => {
  const clamscan = await new ClamScan().init();
  const { isInfected } = await clamscan.isInfected(filePath);
  return !isInfected;
};
```

### 6.3 Backup de Imágenes

```bash
# Crear cron job para backup diario
0 2 * * * tar -czf /backup/candidatos-$(date +\%Y\%m\%d).tar.gz /var/www/univote/Backend/uploads/candidatos/
```

---

## 7. Checklist de Implementación

```
✅ Backend
├─ [ ] Sharp y Multer instalados
├─ [ ] Directorio uploads/candidatos creado
├─ [ ] upload.config.ts configurado
├─ [ ] ImageProcessorService implementado
├─ [ ] CandidatesService con upload/delete
├─ [ ] CandidatesController actualizado
├─ [ ] main.ts sirve archivos estáticos
├─ [ ] Testing con Postman funciona
└─ [ ] Imágenes se convierten a WebP

✅ Frontend
├─ [ ] PhotoUpload component creado
├─ [ ] Preview de imagen funciona
├─ [ ] Upload funciona correctamente
├─ [ ] Delete funciona
├─ [ ] Fotos se muestran en lista
├─ [ ] Validaciones de tamaño/tipo
└─ [ ] UX es fluida y clara

✅ Testing
├─ [ ] Upload de JPG funciona
├─ [ ] Upload de PNG funciona
├─ [ ] Conversión a WebP exitosa
├─ [ ] Nomenclatura correcta
├─ [ ] Delete funciona
└─ [ ] Tamaño optimizado (<100KB típicamente)
```

---

## 8. Troubleshooting

### Problema: Sharp no se instala

```bash
# Solución: Reinstalar con rebuild
npm uninstall sharp
npm install sharp --build-from-source
```

### Problema: Permisos de escritura

```bash
# Solución: Dar permisos al directorio
chmod 755 Backend/uploads
chmod 755 Backend/uploads/candidatos
```

### Problema: Imagen no se muestra en frontend

```
Solución:
1. Verificar que main.ts sirve archivos estáticos
2. Verificar URL completa: http://localhost:3000/uploads/candidatos/...
3. Verificar CORS en backend
4. Verificar que el archivo existe en el servidor
```

---

**Documento**: 02-gestion-fotos-candidatos.md  
**Versión**: 1.0  
**Última actualización**: Octubre 2025  
**Anterior**: [01-recuperacion-contrasena.md](./01-recuperacion-contrasena.md)  
**Índice**: [README.md](./README.md)
