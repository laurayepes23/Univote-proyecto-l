import React, { useState, useEffect } from 'react';
import NavbarCandidato from "../components/NavbarCandidato";
import Footer from "../components/Footer";
import { FaArrowLeft, FaSave, FaExclamationTriangle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function CrearPropuesta() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        titulo_proposal: '',
        descripcion_proposal: '',
        estado_proposal: 'Activa' // Valor por defecto según tu DTO
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Obtener información del candidato
    const candidateData = JSON.parse(localStorage.getItem('candidateData') || '{}');
    const candidateId = candidateData.id_candidate;

    useEffect(() => {
        if (!candidateId) {
            setError('No se pudo identificar al candidato. Por favor, inicia sesión nuevamente.');
        }
    }, [candidateId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!candidateId) {
            setError('No se pudo identificar al candidato.');
            return;
        }

        if (!formData.titulo_proposal.trim() || !formData.descripcion_proposal.trim()) {
            setError('El título y la descripción son obligatorios.');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const proposalData = {
                titulo_proposal: formData.titulo_proposal,
                descripcion_proposal: formData.descripcion_proposal,
                estado_proposal: formData.estado_proposal,
                candidateId: candidateId
            };

            console.log("Enviando propuesta:", proposalData);
            
            const response = await api.post('/proposals', proposalData);
            console.log("Propuesta creada:", response.data);
            
            setSuccess('Propuesta creada exitosamente');
            setTimeout(() => {
                navigate('/GestionarPropuestas');
            }, 1500);

        } catch (error) {
            console.error("Error al crear propuesta:", error);
            const errorMessage = error.response?.data?.message || 'Error al crear la propuesta. Inténtalo de nuevo.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleGoBack = () => {
        navigate('/GestionarPropuestas');
    };

    if (!candidateId) {
        return (
            <div className="min-h-screen flex flex-col bg-blue-50 text-gray-800">
                <NavbarCandidato />
                <div className="h-20"></div>
                <main className="flex-grow max-w-4xl mx-auto p-8">
                    <div className="text-center p-12 bg-white rounded-2xl shadow-lg border border-gray-100">
                        <FaExclamationTriangle className="text-6xl text-red-500 mx-auto mb-4" />
                        <p className="text-lg text-gray-600 font-semibold mb-4">
                            No se pudo identificar al candidato.
                        </p>
                        <button
                            onClick={() => navigate('/login')}
                            className="bg-blue-900 text-white font-semibold py-3 px-8 rounded-xl shadow-md hover:bg-blue-800 transition-colors"
                        >
                            Iniciar Sesión
                        </button>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-blue-50 text-gray-800">
            <NavbarCandidato />
            <div className="h-20"></div>

            <main className="flex-grow max-w-4xl mx-auto p-8 w-full">
                {/* Botón volver */}
                <button
                    onClick={handleGoBack}
                    className="flex items-center text-blue-900 hover:text-blue-700 mb-6 transition-colors"
                >
                    <FaArrowLeft className="mr-2" />
                    Volver a Mis Propuestas
                </button>

                {/* Mensajes */}
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
                        {error}
                    </div>
                )}
                
                {success && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-6">
                        {success}
                    </div>
                )}

                {/* Formulario */}
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                    <h2 className="text-3xl font-bold text-blue-900 mb-6">Crear Nueva Propuesta</h2>
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-gray-700 font-semibold mb-2">
                                Título de la Propuesta *
                            </label>
                            <input
                                type="text"
                                name="titulo_proposal"
                                value={formData.titulo_proposal}
                                onChange={handleChange}
                                placeholder="Ingresa un título atractivo para tu propuesta"
                                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                required
                                maxLength={200}
                            />
                            <p className="text-sm text-gray-500 mt-1">
                                {formData.titulo_proposal.length}/200 caracteres
                            </p>
                        </div>

                        <div>
                            <label className="block text-gray-700 font-semibold mb-2">
                                Descripción de la Propuesta *
                            </label>
                            <textarea
                                name="descripcion_proposal"
                                value={formData.descripcion_proposal}
                                onChange={handleChange}
                                placeholder="Describe detalladamente tu propuesta, objetivos y beneficios..."
                                rows="6"
                                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors resize-vertical"
                                required
                                maxLength={1000}
                            />
                            <p className="text-sm text-gray-500 mt-1">
                                {formData.descripcion_proposal.length}/1000 caracteres
                            </p>
                        </div>

                        <div>
                            <label className="block text-gray-700 font-semibold mb-2">
                                Estado de la Propuesta
                            </label>
                            <select
                                name="estado_proposal"
                                value={formData.estado_proposal}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                            >
                                <option value="Activa">Activa</option>
                                <option value="Inactiva">Inactiva</option>
                                
                            </select>
                            <p className="text-sm text-gray-500 mt-1">
                                Selecciona el estado inicial de tu propuesta
                            </p>
                        </div>

                        <div className="flex justify-end space-x-4 pt-4">
                            <button
                                type="button"
                                onClick={handleGoBack}
                                className="bg-gray-500 text-white font-semibold py-3 px-6 rounded-xl shadow-md hover:bg-gray-600 transition-colors"
                                disabled={loading}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-blue-900 text-white font-semibold py-3 px-6 rounded-xl shadow-md hover:bg-blue-800 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <FaSave className="mr-2" />
                                {loading ? 'Creando...' : 'Crear Propuesta'}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}