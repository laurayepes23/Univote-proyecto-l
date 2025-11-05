import { diskStorage } from 'multer';
import { extname } from 'path';
import { BadRequestException } from '@nestjs/common';

export const multerConfig = {
  storage: diskStorage({
    destination: './uploads/temp',
    filename: (req, file, callback) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = extname(file.originalname);
      callback(null, `temp-${uniqueSuffix}${ext}`);
    },
  }),

  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },

  fileFilter: (req, file, callback) => {
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