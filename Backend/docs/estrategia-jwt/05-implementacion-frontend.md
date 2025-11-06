# 05 - Implementación en el Frontend (React)

## 🎨 Introducción

Este documento proporciona una guía completa para implementar el consumo de JWT en el frontend de UniVote usando React, Context API y Axios.

---

## 1. Estructura del Sistema de Autenticación

### 1.1 Componentes Principales

```
Frontend/src/
├── context/
│   └── AuthContext.jsx       # Context API para estado global
├── api/
│   ├── axios.js              # Configuración de Axios
│   └── auth.api.js           # Servicios de autenticación
├── hooks/
│   └── useAuth.js            # Hook personalizado para auth
├── components/
│   ├── PrivateRoute.jsx      # Componente para rutas protegidas
│   └── RoleRoute.jsx         # Componente para rutas por rol
├── pages/
│   └── Login.jsx             # Página de login actualizada
└── utils/
    └── tokenUtils.js         # Utilidades para manejar tokens
```

---

## 2. Configurar Axios con Interceptores

### 2.1 Crear Instancia de Axios

**Archivo**: `Frontend/src/api/axios.js`

```javascript
import axios from 'axios';

// URL base del backend
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Crear instancia de axios
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 segundos
});

// Interceptor de Request: Agregar token automáticamente
axiosInstance.interceptors.request.use(
  (config) => {
    // Obtener token del localStorage
    const token = localStorage.getItem('access_token');

    // Si existe token, agregarlo al header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de Response: Manejar errores de autenticación
axiosInstance.interceptors.response.use(
  (response) => {
    // Si la respuesta es exitosa, simplemente retornarla
    return response;
  },
  (error) => {
    if (error.response) {
      // El servidor respondió con un código de error
      const status = error.response.status;

      if (status === 401) {
        // Token inválido o expirado
        console.error('Sesión expirada. Redirigiendo al login...');

        // Limpiar localStorage
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');

        // Redirigir al login
        window.location.href = '/Login';
      } else if (status === 403) {
        // No tiene permisos
        console.error('No tienes permisos para realizar esta acción');
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
```

### 2.2 Variables de Entorno

**Archivo**: `Frontend/.env`

```env
VITE_API_URL=http://localhost:3000
```

---

## 3. Servicios de Autenticación

### 3.1 API de Autenticación

**Archivo**: `Frontend/src/api/auth.api.js`

```javascript
import axios from './axios';

/**
 * Servicios de autenticación
 */
export const authAPI = {
  /**
   * Login de usuario
   * @param {Object} credentials - {correo, contrasena, tipo}
   * @returns {Promise} Respuesta con token y datos de usuario
   */
  login: async (credentials) => {
    try {
      const response = await axios.post('/auth/login', credentials);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error en el servidor' };
    }
  },

  /**
   * Obtener perfil del usuario actual
   * @returns {Promise} Datos del usuario autenticado
   */
  getProfile: async () => {
    try {
      const response = await axios.get('/auth/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al obtener perfil' };
    }
  },

  /**
   * Logout (opcional, se hace en el cliente)
   * @returns {Promise}
   */
  logout: async () => {
    try {
      await axios.get('/auth/logout');
      return { message: 'Sesión cerrada exitosamente' };
    } catch (error) {
      // Incluso si falla la petición, cerramos sesión localmente
      return { message: 'Sesión cerrada localmente' };
    }
  },
};
```

---

## 4. Context API para Autenticación

### 4.1 Auth Context

**Archivo**: `Frontend/src/context/AuthContext.jsx`

```javascript
import { createContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../api/auth.api';

// Crear el contexto
export const AuthContext = createContext();

/**
 * Provider de autenticación
 * Maneja el estado global de autenticación
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Inicializar: Verificar si hay sesión guardada
   */
  useEffect(() => {
    const initAuth = async () => {
      try {
        const savedToken = localStorage.getItem('access_token');
        const savedUser = localStorage.getItem('user');

        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));

          // Opcional: Verificar que el token aún sea válido
          try {
            await authAPI.getProfile();
          } catch (error) {
            // Token inválido, limpiar
            logout();
          }
        }
      } catch (error) {
        console.error('Error al inicializar autenticación:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  /**
   * Login: Autenticar usuario
   */
  const login = useCallback(async (credentials) => {
    try {
      setLoading(true);
      setError(null);

      // Llamar al API
      const data = await authAPI.login(credentials);

      // Guardar en estado
      setToken(data.access_token);
      setUser(data.user);

      // Guardar en localStorage
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));

      return data;
    } catch (error) {
      const errorMessage = error.message || 'Error al iniciar sesión';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Logout: Cerrar sesión
   */
  const logout = useCallback(async () => {
    try {
      // Opcional: Llamar al endpoint de logout
      await authAPI.logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      // Limpiar estado
      setUser(null);
      setToken(null);
      setError(null);

      // Limpiar localStorage
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
    }
  }, []);

  /**
   * Verificar si el usuario está autenticado
   */
  const isAuthenticated = useCallback(() => {
    return !!token && !!user;
  }, [token, user]);

  /**
   * Verificar si el usuario tiene un rol específico
   */
  const hasRole = useCallback(
    (roles) => {
      if (!user) return false;

      // Si roles es un string, convertir a array
      const rolesArray = Array.isArray(roles) ? roles : [roles];

      // Verificar si el usuario tiene alguno de los roles
      return rolesArray.includes(user.rol) || rolesArray.includes(user.tipo);
    },
    [user]
  );

  /**
   * Actualizar datos del usuario
   */
  const updateUser = useCallback((newUserData) => {
    setUser((prevUser) => {
      const updatedUser = { ...prevUser, ...newUserData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return updatedUser;
    });
  }, []);

  // Valor del contexto
  const value = {
    user,
    token,
    loading,
    error,
    login,
    logout,
    isAuthenticated,
    hasRole,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
```

### 4.2 Hook Personalizado

**Archivo**: `Frontend/src/hooks/useAuth.js`

```javascript
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * Hook personalizado para acceder al contexto de autenticación
 * Simplifica el uso del contexto en componentes
 */
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }

  return context;
};
```

---

## 5. Integrar Context en la Aplicación

### 5.1 Actualizar main.jsx

**Archivo**: `Frontend/src/main.jsx`

```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';

// Importar el AuthProvider
import { AuthProvider } from './context/AuthContext.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
```

---

## 6. Componentes de Protección de Rutas

### 6.1 Private Route

**Archivo**: `Frontend/src/components/PrivateRoute.jsx`

```javascript
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * Componente para proteger rutas que requieren autenticación
 */
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  // Mostrar loader mientras se verifica autenticación
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="ml-4 text-gray-600">Verificando sesión...</p>
      </div>
    );
  }

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated()) {
    return (
      <Navigate
        to="/Login"
        replace
      />
    );
  }

  // Si está autenticado, mostrar el contenido
  return children;
};

export default PrivateRoute;
```

### 6.2 Role Route

**Archivo**: `Frontend/src/components/RoleRoute.jsx`

```javascript
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * Componente para proteger rutas por rol
 */
const RoleRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, hasRole, loading, user } = useAuth();

  // Mostrar loader mientras se verifica
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="ml-4 text-gray-600">Verificando permisos...</p>
      </div>
    );
  }

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated()) {
    return (
      <Navigate
        to="/Login"
        replace
      />
    );
  }

  // Si no tiene el rol requerido, redirigir a página de inicio según su rol
  if (!hasRole(allowedRoles)) {
    console.warn(`Usuario ${user.correo} intentó acceder a ruta no autorizada`);

    // Redirigir según el rol del usuario
    const redirectPath =
      user.tipo === 'administrador'
        ? '/Administrador'
        : user.tipo === 'votante'
        ? '/Votante'
        : user.tipo === 'candidato'
        ? '/Candidato'
        : '/';

    return (
      <Navigate
        to={redirectPath}
        replace
      />
    );
  }

  // Si tiene el rol correcto, mostrar el contenido
  return children;
};

export default RoleRoute;
```

---

## 7. Actualizar Página de Login

### 7.1 Login Component

**Archivo**: `Frontend/src/pages/Login.jsx`

```javascript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Login = () => {
  const navigate = useNavigate();
  const { login, loading, error: authError } = useAuth();

  const [formData, setFormData] = useState({
    correo: '',
    contrasena: '',
    tipo: 'votante', // Por defecto votante
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(''); // Limpiar error al escribir
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validaciones básicas
    if (!formData.correo || !formData.contrasena) {
      setError('Por favor complete todos los campos');
      return;
    }

    try {
      // Llamar al login del contexto
      const data = await login(formData);

      // Redirigir según el tipo de usuario
      const redirectPath =
        data.user.tipo === 'administrador'
          ? '/Administrador'
          : data.user.tipo === 'votante'
          ? '/Votante'
          : data.user.tipo === 'candidato'
          ? '/Candidato'
          : '/';

      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h2 className="text-3xl font-bold text-center mb-6 text-blue-600">
          Iniciar Sesión
        </h2>

        {/* Mostrar errores */}
        {(error || authError) && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error || authError}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-4">
          {/* Tipo de usuario */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Usuario
            </label>
            <select
              name="tipo"
              value={formData.tipo}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required>
              <option value="votante">Votante</option>
              <option value="candidato">Candidato</option>
              <option value="administrador">Administrador</option>
            </select>
          </div>

          {/* Correo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Correo Electrónico
            </label>
            <input
              type="email"
              name="correo"
              value={formData.correo}
              onChange={handleChange}
              placeholder="correo@ejemplo.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Contraseña */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <input
              type="password"
              name="contrasena"
              value={formData.contrasena}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Botón de submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        {/* Enlaces adicionales */}
        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-gray-600">
            ¿No tienes cuenta?{' '}
            <a
              href="/RegistroVotante"
              className="text-blue-600 hover:underline">
              Regístrate como votante
            </a>
          </p>
          <p className="text-sm text-gray-600">
            <a
              href="/Registro_candidato"
              className="text-blue-600 hover:underline">
              Regístrate como candidato
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
```

---

## 8. Actualizar App.jsx con Rutas Protegidas

### 8.1 App Component

**Archivo**: `Frontend/src/App.jsx`

```javascript
import { Routes, Route } from 'react-router-dom';

// Páginas públicas
import Home from './pages/Home';
import Login from './pages/Login';
import RegistroVotante from './pages/RegistroVotante';
import Registro_candidato from './pages/Registro_candidato';

// Componentes de protección
import PrivateRoute from './components/PrivateRoute';
import RoleRoute from './components/RoleRoute';

// Páginas de Administrador
import Administrador from './pages/Administrador';
import Gestionar_votantes from './pages/Gestionar_votantes';
import Crear_eleccion_adm from './pages/Crear_eleccion_adm';
import Eliminar_eleccion from './pages/Eliminar_eleccion';
import Ver_elecciones_admin from './pages/Ver_elecciones_admin';
import Resultado_elecciones_adm from './pages/Resultado_elecciones_adm';
import Iniciar_Cerrar_vot_adm from './pages/Iniciar_Cerrar_vot_adm';
import Ver_candidatos_adm from './pages/Ver_candidatos_adm';
import Resultado_candidatos_admin from './pages/Resultado_candidatos_admin';
import Aprobar_Eliminar_cand_admin from './pages/Aprobar_Eliminar_cand_admin';
import Mi_perfil_admin from './pages/Mi_perfil_admin';

// Páginas de Votante
import Votante from './pages/Votante';
import EleccionesVotante from './pages/EleccionesVotante';
import CandidatosVotante from './pages/CandidatosVotante';
import MiPerfilVotante from './pages/MiPerfilVotante';
import ResultadosVotante from './pages/ResultadosVotante';
import Propuestas from './pages/Propuestas';
import Inf_votante from './pages/Inf_votante';

// Páginas de Candidato
import Candidato from './pages/Candidato';
import PostularseElecciones from './pages/PostularseElecciones';
import ConsultarFunciones from './pages/ConsultarFunciones';
import GestionarPropuestas from './pages/GestionarPropuestas';
import CrearPropuesta from './pages/CrearPropuesta';
import MiPerfilCandidato from './pages/MiPerfilCandidato';
import Inf_candidato from './pages/Inf_candidato';

function App() {
  return (
    <Routes>
      {/* Rutas Públicas */}
      <Route
        path="/"
        element={<Home />}
      />
      <Route
        path="/Login"
        element={<Login />}
      />
      <Route
        path="/RegistroVotante"
        element={<RegistroVotante />}
      />
      <Route
        path="/Registro_candidato"
        element={<Registro_candidato />}
      />

      {/* Rutas de Administrador - Solo accesibles para administradores */}
      <Route
        path="/Administrador"
        element={
          <PrivateRoute>
            <RoleRoute allowedRoles={['administrador']}>
              <Administrador />
            </RoleRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/Gestionar_votantes"
        element={
          <PrivateRoute>
            <RoleRoute allowedRoles={['administrador']}>
              <Gestionar_votantes />
            </RoleRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/Crear_eleccion_adm"
        element={
          <PrivateRoute>
            <RoleRoute allowedRoles={['administrador']}>
              <Crear_eleccion_adm />
            </RoleRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/Eliminar_eleccion"
        element={
          <PrivateRoute>
            <RoleRoute allowedRoles={['administrador']}>
              <Eliminar_eleccion />
            </RoleRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/Ver_elecciones_admin"
        element={
          <PrivateRoute>
            <RoleRoute allowedRoles={['administrador']}>
              <Ver_elecciones_admin />
            </RoleRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/Resultado_elecciones_adm"
        element={
          <PrivateRoute>
            <RoleRoute allowedRoles={['administrador']}>
              <Resultado_elecciones_adm />
            </RoleRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/Iniciar_Cerrar_vot_adm"
        element={
          <PrivateRoute>
            <RoleRoute allowedRoles={['administrador']}>
              <Iniciar_Cerrar_vot_adm />
            </RoleRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/Ver_candidatos_adm"
        element={
          <PrivateRoute>
            <RoleRoute allowedRoles={['administrador']}>
              <Ver_candidatos_adm />
            </RoleRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/Resultado_candidatos_admin"
        element={
          <PrivateRoute>
            <RoleRoute allowedRoles={['administrador']}>
              <Resultado_candidatos_admin />
            </RoleRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/Aprobar_Eliminar_cand_admin"
        element={
          <PrivateRoute>
            <RoleRoute allowedRoles={['administrador']}>
              <Aprobar_Eliminar_cand_admin />
            </RoleRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/Mi_perfil_admin"
        element={
          <PrivateRoute>
            <RoleRoute allowedRoles={['administrador']}>
              <Mi_perfil_admin />
            </RoleRoute>
          </PrivateRoute>
        }
      />

      {/* Rutas de Votante - Solo accesibles para votantes */}
      <Route
        path="/Votante"
        element={
          <PrivateRoute>
            <RoleRoute allowedRoles={['votante']}>
              <Votante />
            </RoleRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/EleccionesVotante"
        element={
          <PrivateRoute>
            <RoleRoute allowedRoles={['votante']}>
              <EleccionesVotante />
            </RoleRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/CandidatosVotante"
        element={
          <PrivateRoute>
            <RoleRoute allowedRoles={['votante']}>
              <CandidatosVotante />
            </RoleRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/MiPerfilVotante"
        element={
          <PrivateRoute>
            <RoleRoute allowedRoles={['votante']}>
              <MiPerfilVotante />
            </RoleRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/ResultadosVotante"
        element={
          <PrivateRoute>
            <RoleRoute allowedRoles={['votante']}>
              <ResultadosVotante />
            </RoleRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/Propuestas"
        element={
          <PrivateRoute>
            <RoleRoute allowedRoles={['votante']}>
              <Propuestas />
            </RoleRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/Inf_votante"
        element={
          <PrivateRoute>
            <RoleRoute allowedRoles={['votante']}>
              <Inf_votante />
            </RoleRoute>
          </PrivateRoute>
        }
      />

      {/* Rutas de Candidato - Solo accesibles para candidatos */}
      <Route
        path="/Candidato"
        element={
          <PrivateRoute>
            <RoleRoute allowedRoles={['candidato']}>
              <Candidato />
            </RoleRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/PostularseElecciones"
        element={
          <PrivateRoute>
            <RoleRoute allowedRoles={['candidato']}>
              <PostularseElecciones />
            </RoleRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/ConsultarFunciones"
        element={
          <PrivateRoute>
            <RoleRoute allowedRoles={['candidato']}>
              <ConsultarFunciones />
            </RoleRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/GestionarPropuestas"
        element={
          <PrivateRoute>
            <RoleRoute allowedRoles={['candidato']}>
              <GestionarPropuestas />
            </RoleRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/CrearPropuesta"
        element={
          <PrivateRoute>
            <RoleRoute allowedRoles={['candidato']}>
              <CrearPropuesta />
            </RoleRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/MiPerfilCandidato"
        element={
          <PrivateRoute>
            <RoleRoute allowedRoles={['candidato']}>
              <MiPerfilCandidato />
            </RoleRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/Inf_candidato"
        element={
          <PrivateRoute>
            <RoleRoute allowedRoles={['candidato']}>
              <Inf_candidato />
            </RoleRoute>
          </PrivateRoute>
        }
      />
    </Routes>
  );
}

export default App;
```

---

## 9. Actualizar Navbars con Logout

### 9.1 Navbar de Administrador

**Archivo**: `Frontend/src/components/Navbar_admin.jsx`

```javascript
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Navbar_admin = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/Login', { replace: true });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              to="/Administrador"
              className="text-xl font-bold">
              UniVote Admin
            </Link>
          </div>

          {/* Enlaces de navegación */}
          <div className="hidden md:flex space-x-4">
            <Link
              to="/Administrador"
              className="hover:bg-blue-700 px-3 py-2 rounded">
              Dashboard
            </Link>
            <Link
              to="/Gestionar_votantes"
              className="hover:bg-blue-700 px-3 py-2 rounded">
              Votantes
            </Link>
            <Link
              to="/Ver_elecciones_admin"
              className="hover:bg-blue-700 px-3 py-2 rounded">
              Elecciones
            </Link>
            <Link
              to="/Ver_candidatos_adm"
              className="hover:bg-blue-700 px-3 py-2 rounded">
              Candidatos
            </Link>
          </div>

          {/* Usuario y Logout */}
          <div className="flex items-center space-x-4">
            <span className="text-sm">
              {user?.nombre} {user?.apellido}
            </span>
            <Link
              to="/Mi_perfil_admin"
              className="hover:bg-blue-700 px-3 py-2 rounded">
              Mi Perfil
            </Link>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded">
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar_admin;
```

### 9.2 Navbars de Votante y Candidato

Actualizar de manera similar `NavbarVotante.jsx` y `NavbarCandidato.jsx` con el hook `useAuth` y el botón de logout.

---

## 10. Eliminar AuthChecker Antiguo

Ahora que tenemos `PrivateRoute` y `RoleRoute`, el componente `AuthChecker.jsx` antiguo ya no es necesario y debe ser eliminado.

```bash
rm Frontend/src/AuthChecker.jsx
```

---

## 11. Utilidades para Tokens

### 11.1 Token Utils

**Archivo**: `Frontend/src/utils/tokenUtils.js`

```javascript
import jwtDecode from 'jwt-decode';

/**
 * Decodificar token JWT
 * @param {string} token - Token JWT
 * @returns {Object} Payload decodificado
 */
export const decodeToken = (token) => {
  try {
    return jwtDecode(token);
  } catch (error) {
    console.error('Error al decodificar token:', error);
    return null;
  }
};

/**
 * Verificar si el token ha expirado
 * @param {string} token - Token JWT
 * @returns {boolean} True si ha expirado
 */
export const isTokenExpired = (token) => {
  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
  } catch (error) {
    return true;
  }
};

/**
 * Obtener tiempo restante del token en segundos
 * @param {string} token - Token JWT
 * @returns {number} Segundos restantes
 */
export const getTokenTimeRemaining = (token) => {
  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp - currentTime;
  } catch (error) {
    return 0;
  }
};
```

**Instalación de jwt-decode**:

```bash
npm install jwt-decode
```

---

## 12. Checklist de Implementación

### ✅ Configuración

- [ ] Instalar axios
- [ ] Instalar jwt-decode
- [ ] Crear archivo `.env` con `VITE_API_URL`
- [ ] Configurar instancia de Axios con interceptores

### ✅ Context y Hooks

- [ ] Crear `AuthContext.jsx`
- [ ] Crear hook `useAuth.js`
- [ ] Integrar `AuthProvider` en `main.jsx`

### ✅ Servicios

- [ ] Crear `auth.api.js` con servicios de autenticación

### ✅ Componentes de Protección

- [ ] Crear `PrivateRoute.jsx`
- [ ] Crear `RoleRoute.jsx`

### ✅ Páginas

- [ ] Actualizar `Login.jsx`
- [ ] Actualizar `App.jsx` con rutas protegidas
- [ ] Actualizar Navbars con logout

### ✅ Limpieza

- [ ] Eliminar `AuthChecker.jsx` antiguo
- [ ] Eliminar referencias a sistema antiguo

---

## 13. Pruebas

### 13.1 Probar Login

```javascript
// En la consola del navegador
localStorage.getItem('access_token'); // Debe tener un token
localStorage.getItem('user'); // Debe tener datos del usuario
```

### 13.2 Probar Redirección

1. Intentar acceder a `/Administrador` sin login → Debe redirigir a `/Login`
2. Login como votante e intentar acceder a `/Administrador` → Debe redirigir a `/Votante`
3. Login exitoso → Debe redirigir según rol

### 13.3 Probar Logout

1. Hacer logout
2. Verificar que localStorage esté limpio
3. Intentar acceder a ruta protegida → Debe redirigir a login

---

## 14. Próximos Pasos

El siguiente documento ([06-seguridad-mejores-practicas.md](./06-seguridad-mejores-practicas.md)) cubrirá:

- Refresh tokens
- Almacenamiento seguro
- Protección XSS y CSRF
- Mejores prácticas de seguridad
- Renovación automática de tokens
- Manejo avanzado de sesiones

---

**Documento**: 05-implementacion-frontend.md  
**Versión**: 1.0  
**Última actualización**: Octubre 2025  
**Anterior**: [04-implementacion-backend.md](./04-implementacion-backend.md)  
**Siguiente**: [06-seguridad-mejores-practicas.md](./06-seguridad-mejores-practicas.md)
