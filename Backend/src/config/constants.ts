export const JWT_CONFIG = {
    secret: process.env.JWT_SECRET || 'univote-secret-key-2025',
    expiresIn: '24h' // Valor válido para JWT: 24 horas
} as const;