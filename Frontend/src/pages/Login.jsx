import React, { useState } from "react";
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Navbar from "../components/Navbar";

export default function Login() {
    const navigate = useNavigate();
    const [correo, setCorreo] = useState("");
    const [contrasena, setContrasena] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [mostrarContrasena, setMostrarContrasena] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        try {
            // Intento 1: Login como administrador
            // Log de la petición
            const requestData = {
                correo: correo,
                endpoint: '/administrators/login'
            };
            console.log("🔍 Enviando petición de login con: %o", requestData);

            const adminResponse = await api.post('/administrators/login', {
                correo_admin: correo,
                contrasena_admin: contrasena
            });

            // Log detallado de la respuesta
            const responseDetails = {
                status: adminResponse.status,
                statusText: adminResponse.statusText,
                headers: Object.fromEntries(
                    Object.entries(adminResponse.headers || {})
                ),
                data: adminResponse.data
            };
            console.log("🔍 Respuesta completa del servidor: %o", responseDetails);
            
            const adminData = adminResponse.data;
            if (!adminData) {
                throw new Error('No se recibieron datos del servidor');
            }

            console.log("🔍 Datos del administrador recibidos:", adminData);

            // Verificar que tengamos los datos mínimos necesarios
            if (!adminData.id_admin || !adminData.nombre_admin) {
                throw new Error('Datos de administrador incompletos');
            }

            // Generar un token temporal basado en los datos del administrador
            // Esto es temporal hasta que el backend proporcione tokens JWT
            const tempToken = btoa(JSON.stringify({
                id: adminData.id_admin,
                role: 'admin',
                timestamp: new Date().getTime()
            }));

            // Guardar los datos necesarios
            const userData = {
                id: adminData.id_admin,
                nombre: adminData.nombre_admin,
                apellido: adminData.apellido_admin,
                role: 'admin'
            };

            // Guardar datos del administrador
            localStorage.setItem('adminData', JSON.stringify(adminData));
            localStorage.setItem('adminId', userData.id.toString());
            localStorage.setItem('adminName', `${userData.nombre} ${userData.apellido}`);
            localStorage.setItem('userRole', 'admin');
            localStorage.setItem('token', tempToken);

            // Debug: Verificar que se guardó correctamente
            console.log("✅ Datos guardados correctamente:", {
                adminId: localStorage.getItem('adminId'),
                adminName: localStorage.getItem('adminName'),
                userRole: localStorage.getItem('userRole'),
                tokenExists: !!localStorage.getItem('token')
            });

            setSuccess("¡Inicio de sesión exitoso!");
            navigate('/administrador');

        } catch (error) {
            // Log detallado del error
            const errorDetails = {
                mensaje: error.message,
                respuesta: error.response ? {
                    status: error.response.status,
                    statusText: error.response.statusText,
                    data: error.response.data,
                    headers: Object.fromEntries(
                        Object.entries(error.response.headers || {})
                    )
                } : 'No hay respuesta del servidor',
                datosEnviados: {
                    correo_admin: correo,
                    url: '/administrators/login'
                },
                tipo: error.constructor.name,
                stack: error.stack
            };
            console.log("🔍 Error detallado: %o", errorDetails);
            
            // Solo limpiar datos relacionados con la sesión
            localStorage.removeItem('token');
            localStorage.removeItem('userRole');
            localStorage.removeItem('adminData');
            localStorage.removeItem('adminId');
            localStorage.removeItem('adminName');
            
            let errorMessage = "Error al iniciar sesión. Por favor, verifica tus credenciales.";
            
            if (error.response?.data?.message) {
                if (Array.isArray(error.response.data.message)) {
                    const userMessages = error.response.data.message.filter(msg => 
                        !msg.includes('should not exist') && 
                        !msg.includes('must be a')
                    );
                    errorMessage = userMessages.join('\n');
                } else {
                    errorMessage = error.response.data.message;
                }
            } else if (error.message.includes('token')) {
                console.error("Estructura de la respuesta que causó el error:", error.adminData);
                errorMessage = "Error en la autenticación. Por favor, contacta al administrador.";
            }
            
            console.error("Error al iniciar sesión:", errorMessage);
            setError(errorMessage);
        }
    };

    const toggleMostrarContrasena = () => {
        setMostrarContrasena(!mostrarContrasena);
    };

    return (
        <div className="min-h-screen bg-white flex items-center justify-center px-4 ">
            <Navbar/>
            <div className="bg-white shadow-2xl rounded-2xl w-full max-w-sm p-8 border border-gray-200 mt-30">
                {/* Logo */}
                <Link to="/">
                    <div className="flex justify-center mb-4">
                        <img src="/img/logo.png" alt="Univote" className="w-40 h-40" />
                    </div>
                </Link>

                <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
                    Iniciar Sesión
                </h1>

                {/* Mensajes */}
                {error && (
                    <div className="bg-red-100 text-red-700 text-sm p-3 rounded-md mb-4 text-center">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="bg-green-100 text-green-700 text-sm p-3 rounded-md mb-4 text-center">
                        {success}
                    </div>
                )}

                {/* Formulario */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-gray-700 mb-1">Correo</label>
                        <input
                            type="text"
                            value={correo}
                            onChange={(e) => setCorreo(e.target.value)}
                            placeholder="Escribe tu correo institucional"
                            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 outline-none"
                            required
                        />
                    </div>

                    <div className="relative">
                        <label className="block text-gray-700 mb-1">Contraseña</label>
                        <input
                            type={mostrarContrasena ? "text" : "password"}
                            value={contrasena}
                            onChange={(e) => setContrasena(e.target.value)}
                            placeholder="Escribe tu contraseña"
                            className="w-full border border-gray-300 rounded-lg p-2 pr-10 focus:ring-2 focus:ring-blue-400 outline-none"
                            required
                        />
                        <button
                            type="button"
                            onClick={toggleMostrarContrasena}
                            className="absolute right-3 top-9 text-gray-500 hover:text-gray-700 focus:outline-none"
                        >
                            {mostrarContrasena ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                </svg>
                            )}
                        </button>
                    </div>

                    <button
                        type="submit"
                        className="bg-blue-900 text-white py-2 rounded-lg hover:bg-blue-800 transition shadow-md"
                    >
                        Ingresar
                    </button>

                    <div className="text-center space-y-2">
                        <p className="text-sm">
                            ¿Aun no tienes cuenta?{" "}
                            <a href="/RegistroVotante" className="text-blue-600 hover:underline">
                                Regístrate
                            </a>
                        </p>
                        <p className="text-sm">
                            <a href="#" className="text-blue-600 hover:underline">
                                ¿Olvidaste tu contraseña?
                            </a>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}