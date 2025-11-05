import { Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';
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
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
      this.logger.log(`Directorio creado: ${this.uploadsDir}`);
    }
  }

  async processImage(
    tempFilePath: string,
    nombre: string,
    apellido: string
  ): Promise<string> {
    try {
      const cleanNombre = this.cleanFileName(nombre);
      const cleanApellido = this.cleanFileName(apellido);

      const fileName = `${cleanNombre}_${cleanApellido}.webp`;
      const outputPath = path.join(this.uploadsDir, fileName);

      await sharp(tempFilePath)
        .resize(800, 800, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({
          quality: 80,
          effort: 6,
        })
        .toFile(outputPath);

      fs.unlinkSync(tempFilePath);

      this.logger.log(`Imagen procesada: ${fileName}`);

      return `/uploads/candidatos/${fileName}`;
    } catch (error) {
      this.logger.error('Error al procesar imagen:', error);

      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }

      throw new Error('Error al procesar la imagen');
    }
  }

  private cleanFileName(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }

  async deleteImage(fotoCandidato: string): Promise<void> {
    if (!fotoCandidato) return;

    try {
      const fileName = path.basename(fotoCandidato);
      const filePath = path.join(this.uploadsDir, fileName);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        this.logger.log(`Imagen eliminada: ${fileName}`);
      }
    } catch (error) {
      this.logger.error('Error al eliminar imagen:', error);
    }
  }

  imageExists(fotoCandidato: string): boolean {
    if (!fotoCandidato) return false;

    const fileName = path.basename(fotoCandidato);
    const filePath = path.join(this.uploadsDir, fileName);

    return fs.existsSync(filePath);
  }
}