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
            // Intento 1: Iniciar sesión como candidato
            const candidateResponse = await api.post('/candidates/login', {
                correo_candidate: correo,
                contrasena_candidate: contrasena
            });
            console.log("Inicio de sesión de candidato exitoso:", candidateResponse.data);
            
            // GUARDAR INFORMACIÓN DEL CANDIDATO EN LOCALSTORAGE
            localStorage.setItem('candidateData', JSON.stringify(candidateResponse.data));
            localStorage.setItem('candidateId', candidateResponse.data.id_candidate);
            localStorage.setItem('candidateName', `${candidateResponse.data.nombre_candidate} ${candidateResponse.data.apellido_candidate}`);
            localStorage.setItem('userRole', 'candidate');
            
            setSuccess("¡Inicio de sesión exitoso!");
            navigate('/candidato');
            return;

        } catch (candidateError) {
            console.log("❌ Error login candidato:", candidateError.response?.data);
        }

        try {
            // Intento 2: Iniciar sesión como votante
            const voterResponse = await api.post('/voters/login', {
                correo_voter: correo,
                contrasena_voter: contrasena
            });
            console.log("Inicio de sesión de votante exitoso:", voterResponse.data);
            
            // ✅ CORRECCIÓN: Verificar la estructura real de la respuesta
            const voterData = voterResponse.data.voter || voterResponse.data;
            console.log("📊 Datos del votante:", voterData);
            
            // ✅ CORRECCIÓN: Guardar el ID correctamente
            localStorage.setItem('voterData', JSON.stringify(voterData));
            localStorage.setItem('voterId', voterData.id_voter.toString());
            localStorage.setItem('voterName', `${voterData.nombre_voter} ${voterData.apellido_voter}`);
            localStorage.setItem('userRole', 'voter');
            
            // ✅ DEBUG: Verificar que se guardó correctamente
            console.log("🔍 DEBUG - voterId guardado:", localStorage.getItem('voterId'));
            console.log("🔍 DEBUG - userRole guardado:", localStorage.getItem('userRole'));
            
            setSuccess("¡Inicio de sesión exitoso!");
            navigate('/votante');
            return;

        } catch (voterError) {
            console.log("❌ Error login votante:", voterError.response?.data);
        }

        try {
            // Intento 3: Iniciar sesión como administrador
            const adminResponse = await api.post('/administrators/login', {
                correo_admin: correo,
                contrasena_admin: contrasena
            });
            console.log("Inicio de sesión de administrador exitoso:", adminResponse.data);
            
            // GUARDAR INFORMACIÓN DEL ADMINISTRADOR EN LOCALSTORAGE
            localStorage.setItem('adminData', JSON.stringify(adminResponse.data));
            localStorage.setItem('adminId', adminResponse.data.id_admin);
            localStorage.setItem('adminName', `${adminResponse.data.nombre_admin} ${adminResponse.data.apellido_admin}`);
            localStorage.setItem('userRole', 'admin');
            
            setSuccess("¡Inicio de sesión exitoso!");
            navigate('/administrador');
            return;
        } catch (adminError) {
            // Si los tres intentos fallan, mostramos un error genérico
            const errorMessage = adminError.response?.data?.message || "Correo o contraseña incorrectos.";
            setError(errorMessage);
            console.error("Error al iniciar sesión:", errorMessage);
            
            // Limpiar localStorage en caso de error
            localStorage.removeItem('candidateData');
            localStorage.removeItem('candidateId');
            localStorage.removeItem('voterData');
            localStorage.removeItem('voterId');
            localStorage.removeItem('adminData');
            localStorage.removeItem('adminId');
            localStorage.removeItem('userRole');
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