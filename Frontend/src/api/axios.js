import axios from 'axios';

const instance = axios.create({
    baseURL: 'http://localhost:3000'
});

// Interceptor para manejar headers y errores de autenticación
instance.interceptors.request.use((config) => {
    // Obtener el token
    const token = localStorage.getItem('token');
    
    // Si hay un token, añadirlo a los headers
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }

    // Manejar Content-Type
    if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
    } else {
        config.headers['Content-Type'] = 'application/json';
    }

    // Log para debugging
    const requestInfo = {
        url: config.url,
        method: config.method,
        headers: config.headers,
        token: token,
        data: config.data
    };
    console.log('🔍 Detalles de la petición: %o', requestInfo);

    return config;
}, (error) => {
    return Promise.reject(error);
});

// Interceptor para manejar respuestas y errores
instance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            console.log('❌ Error de autenticación. Token expirado o inválido.');
            // Solo remover el token
            localStorage.removeItem('token');
            // No redirigir aquí, dejar que el componente maneje la redirección
        }
        return Promise.reject(error);
    }
);

export default instance;