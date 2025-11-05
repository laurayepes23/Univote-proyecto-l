/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import NavbarCandidato from "../components/NavbarCandidato";
import Footer from "../components/Footer";
import { FaEdit, FaTrashAlt, FaPlusCircle, FaRegLightbulb, FaExclamationTriangle, FaSave, FaTimes } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function GestionarPropuestas() {
    const navigate = useNavigate();
    const [proposals, setProposals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editFormData, setEditFormData] = useState({
        titulo_proposal: '',
        descripcion_proposal: '',
        estado_proposal: 'Activa'
    });

    // Obtener información del candidato desde localStorage
    const candidateData = JSON.parse(localStorage.getItem('candidateData') || '{}');
    const candidateId = candidateData.id_candidate;

    useEffect(() => {
        if (!candidateId) {
            setError('No se pudo identificar al candidato. Por favor, inicia sesión nuevamente.');
            setLoading(false);
            return;
        }
        fetchProposals();
    }, [candidateId]);

    const fetchProposals = async () => {
        try {
            setLoading(true);
            const response = await api.get('/proposals');
            
            // Filtrar propuestas del candidato actual
            const candidateProposals = response.data.filter(
                proposal => proposal.candidateId === candidateId
            );
            
            setProposals(candidateProposals);
        } catch (error) {
            console.error("Error al cargar propuestas:", error);
            setError('Error al cargar las propuestas. Inténtalo de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoToCreatePage = () => {
        navigate("/CrearPropuesta");
    };

    const handleDeleteProposal = async (id) => {
        if (window.confirm("¿Estás seguro de que deseas eliminar esta propuesta?")) {
            try {
                await api.delete(`/proposals/${id}`);
                setProposals(proposals.filter(prop => prop.id_proposal !== id));
                setSuccess('Propuesta eliminada correctamente');
                
                setTimeout(() => setSuccess(''), 3000);
            } catch (error) {
                console.error("Error al eliminar propuesta:", error);
                setError('Error al eliminar la propuesta. Inténtalo de nuevo.');
                setTimeout(() => setError(''), 3000);
            }
        }
    };

    // Iniciar edición
    const handleStartEdit = (proposal) => {
        setEditingId(proposal.id_proposal);
        setEditFormData({
            titulo_proposal: proposal.titulo_proposal,
            descripcion_proposal: proposal.descripcion_proposal,
            estado_proposal: proposal.estado_proposal
        });
    };

    // Cancelar edición
    const handleCancelEdit = () => {
        setEditingId(null);
        setEditFormData({
            titulo_proposal: '',
            descripcion_proposal: '',
            estado_proposal: 'Activa'
        });
    };

    // Manejar cambios en el formulario de edición
    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Guardar cambios - USANDO PATCH
    const handleSaveEdit = async (proposalId) => {
        if (!editFormData.titulo_proposal.trim()) {
            setError('El título es obligatorio');
            return;
        }
        
        if (!editFormData.descripcion_proposal.trim()) {
            setError('La descripción es obligatoria');
            return;
        }

        try {
            setLoading(true);
            
            // USAR PATCH en lugar de PUT
            const response = await api.patch(`/proposals/${proposalId}`, {
                titulo_proposal: editFormData.titulo_proposal,
                descripcion_proposal: editFormData.descripcion_proposal,
                estado_proposal: editFormData.estado_proposal
                // NO enviar candidateId en update
            });

            console.log("Propuesta actualizada:", response.data);

            // Actualizar el estado local
            setProposals(proposals.map(prop => 
                prop.id_proposal === proposalId 
                    ? { ...prop, ...editFormData }
                    : prop
            ));

            setSuccess('Propuesta actualizada correctamente');
            setEditingId(null);
            
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            console.error("Error al actualizar propuesta:", error);
            console.error("Detalles del error:", error.response?.data);
            setError('Error al actualizar la propuesta. Inténtalo de nuevo.');
            setTimeout(() => setError(''), 3000);
        } finally {
            setLoading(false);
        }
    };

    // Función para obtener el badge de estado - solo Activa e Inactiva
    const getStatusBadge = (estado) => {
        const statusConfig = {
            'Activa': { color: 'bg-green-100 text-green-800', label: 'Activa' },
            'Inactiva': { color: 'bg-gray-100 text-gray-800', label: 'Inactiva' }
        };

        const config = statusConfig[estado] || { color: 'bg-gray-100 text-gray-800', label: estado };
        
        return (
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${config.color}`}>
                {config.label}
            </span>
        );
    };

    // Solo dos opciones para el estado
    const estados = ['Activa', 'Inactiva'];

    if (!candidateId) {
        return (
            <div className="min-h-screen flex flex-col bg-blue-50 text-gray-800">
                <NavbarCandidato />
                <div className="h-20"></div>
                <main className="flex-grow max-w-6xl mx-auto p-8">
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

            {/* Contenido principal */}
            <main className="flex-grow max-w-6xl mx-auto p-8">
                {/* Mensajes de éxito y error */}
                {success && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-6">
                        {success}
                    </div>
                )}
                
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-4xl md:text-5xl font-extrabold text-blue-900">
                        Mis Propuestas
                    </h2>
                    <button
                        onClick={handleGoToCreatePage}
                        className="bg-blue-900 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:bg-blue-800 transition-colors flex items-center"
                    >
                        <FaPlusCircle className="mr-2" />
                        Crear Propuesta
                    </button>
                </div>

                {loading ? (
                    <div className="text-center p-12 bg-white rounded-2xl shadow-lg border border-gray-100">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto"></div>
                        <p className="text-lg text-gray-600 font-semibold mt-4">Cargando propuestas...</p>
                    </div>
                ) : proposals.length === 0 ? (
                    <div className="text-center p-12 bg-white rounded-2xl shadow-lg border border-gray-100">
                        <FaRegLightbulb className="text-6xl text-blue-500 mx-auto mb-4" />
                        <p className="text-lg text-gray-600 font-semibold mb-4">
                            Aún no tienes propuestas. ¡Crea la primera para empezar!
                        </p>
                        <button
                            onClick={handleGoToCreatePage}
                            className="bg-green-500 text-white font-semibold py-3 px-8 rounded-xl shadow-md hover:bg-green-600 transition-colors"
                        >
                            Crear Propuesta Ahora
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {proposals.map(proposal => (
                            <div
                                key={proposal.id_proposal}
                                className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 flex flex-col justify-between hover:shadow-xl transition-shadow duration-300"
                            >
                                {editingId === proposal.id_proposal ? (
                                    // MODO EDICIÓN
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                                Título *
                                            </label>
                                            <input
                                                type="text"
                                                name="titulo_proposal"
                                                value={editFormData.titulo_proposal}
                                                onChange={handleEditChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                                                required
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                                Descripción *
                                            </label>
                                            <textarea
                                                name="descripcion_proposal"
                                                value={editFormData.descripcion_proposal}
                                                onChange={handleEditChange}
                                                rows="3"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                                                required
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                                Estado
                                            </label>
                                            <select
                                                name="estado_proposal"
                                                value={editFormData.estado_proposal}
                                                onChange={handleEditChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                                            >
                                                {estados.map(estado => (
                                                    <option key={estado} value={estado}>
                                                        {estado}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="flex space-x-2 mt-4">
                                            <button
                                                onClick={() => handleSaveEdit(proposal.id_proposal)}
                                                className="flex-1 bg-green-600 text-white py-2 px-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center text-sm"
                                            >
                                                <FaSave className="mr-1" />
                                                Guardar
                                            </button>
                                            <button
                                                onClick={handleCancelEdit}
                                                className="flex-1 bg-gray-500 text-white py-2 px-3 rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center text-sm"
                                            >
                                                <FaTimes className="mr-1" />
                                                Cancelar
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    // MODO VISUALIZACIÓN
                                    <>
                                        <div>
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="text-xl font-bold text-gray-800 line-clamp-2 flex-1 mr-2">
                                                    {proposal.titulo_proposal}
                                                </h3>
                                                {getStatusBadge(proposal.estado_proposal)}
                                            </div>
                                            
                                            <p className="text-gray-600 text-sm mb-4 line-clamp-4">
                                                {proposal.descripcion_proposal}
                                            </p>
                                        </div>
                                        
                                        <div className="flex space-x-4 mt-4">
                                            <button
                                                onClick={() => handleStartEdit(proposal)}
                                                className="flex-1 bg-blue-900 text-white py-2 px-4 rounded-lg shadow-md hover:bg-blue-800 transition-colors flex items-center justify-center"
                                            >
                                                <FaEdit className="mr-2" />
                                                Editar
                                            </button>
                                            <button
                                                onClick={() => handleDeleteProposal(proposal.id_proposal)}
                                                className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg shadow-md hover:bg-red-600 transition-colors flex items-center justify-center"
                                            >
                                                <FaTrashAlt className="mr-2" />
                                                Eliminar
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
}