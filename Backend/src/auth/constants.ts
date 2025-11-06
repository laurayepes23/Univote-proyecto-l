export const jwtConstants = {
    secret: process.env.JWT_SECRET || 'tu_clave_secreta_aqui',
    expiresIn: '24h'
};