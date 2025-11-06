import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import Navbar_admin from "../components/Navbar_admin";
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Aprobar_Eliminar_cand_admin = () => {
  const navigate = useNavigate();
  const { checkAuth } = useAuth();
  const [candidatos, setCandidatos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null); 

  const fetchCandidatos = React.useCallback(async () => {
    const { isValid, role, token } = checkAuth();
    console.log('🔍 Checking auth in fetchCandidatos:', { isValid, role, token });
    
    if (!isValid || role !== 'admin') {
      console.log('❌ Auth Check Failed:', { isValid, role, token });
      setError("No tiene autorización para acceder a esta página.");
      navigate('/login');
      return;
    }
    
    setLoading(true);
    try {
      console.log('🔍 Fetching candidates...');
      const response = await api.get('/candidates');
      console.log('✅ Candidates fetched:', response.data);
      setCandidatos(response.data);
      setError(null); // Clear any previous errors
    } catch (err) {
      console.error("Error al cargar la lista de candidatos:", err);
      console.log('🔍 Error details:', {
        status: err.response?.status,
        message: err.message,
        data: err.response?.data
      });
      
      if (err.response?.status === 401) {
        setError("Su sesión ha expirado. Por favor, inicie sesión nuevamente.");
        console.log('❌ Authentication error detected');
        navigate('/login');
      } else {
        setError("No se pudo cargar la lista de candidatos. Por favor, intente de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  }, [navigate, checkAuth]);

  useEffect(() => {
    fetchCandidatos();
  }, [fetchCandidatos]);

  // Función para obtener la URL completa de la foto
  const getCandidatePhoto = (candidato) => {
    if (!candidato.foto_candidate) return '/img/default-avatar.png';
    
    let fotoUrl = candidato.foto_candidate;
    
    if (fotoUrl.startsWith('http')) {
      return fotoUrl;
    }
    
    else if (fotoUrl.startsWith('/')) {
      return `http://localhost:3000${fotoUrl}`;
    }
    else {
      return `http://localhost:3000/uploads/candidatos/${fotoUrl}`;
    }
  };

  // Función para aprobar un candidato
  const aprobarCandidato = React.useCallback(async (id_candidate) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage("❌ No hay sesión activa. Por favor, inicie sesión nuevamente.");
        navigate('/login');
        return;
      }

      await api.patch(`/candidates/${id_candidate}`, {
        estado_candidate: "Aprobado"
      });
      
      setMessage("✅ Candidato aprobado correctamente.");
      // Actualiza el estado local para reflejar el cambio instantáneamente
      setCandidatos(prevCandidatos => 
        prevCandidatos.map(cand => 
          cand.id_candidate === id_candidate ? { ...cand, estado_candidate: "Aprobado" } : cand
        )
      );
      
      // Actualizar la lista completa después de la aprobación
      fetchCandidatos();
    } catch (err) {
      console.error("Error al aprobar el candidato:", err);
      if (err.response?.status === 401) {
        setMessage("❌ No tiene autorización. Por favor, inicie sesión nuevamente.");
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setMessage("❌ Error al aprobar el candidato. Intente de nuevo.");
      }
    }
  }, [navigate, fetchCandidatos]);

  // Función para rechazar un candidato
  const rechazarCandidato = React.useCallback(async (id_candidate) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage("❌ No hay sesión activa. Por favor, inicie sesión nuevamente.");
        navigate('/login');
        return;
      }

      await api.patch(`/candidates/${id_candidate}`, {
        estado_candidate: "No Aprobado"
      });
      
      setMessage("✅ Candidato cambiado a 'No Aprobado' correctamente.");
      // Actualizamos el estado local
      setCandidatos(prevCandidatos => 
        prevCandidatos.map(cand => 
          cand.id_candidate === id_candidate ? { ...cand, estado_candidate: "No Aprobado" } : cand
        )
      );
      
      // Actualizar la lista completa después del rechazo
      fetchCandidatos();
    } catch (err) {
      console.error("Error al rechazar el candidato:", err);
      if (err.response?.status === 401) {
        setMessage("❌ No tiene autorización. Por favor, inicie sesión nuevamente.");
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setMessage("❌ Error al rechazar el candidato. Intente de nuevo.");
      }
    }
  }, [navigate, fetchCandidatos]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      
      <Navbar_admin />

      <div className="flex-grow pt-24 px-6 pb-8">
        <h1 className="text-4xl font-extrabold mb-8 text-center text-blue-900">
          Gestión de Candidatos
        </h1>

        {/* Mensaje de estado (éxito/error) */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-xl font-semibold text-center shadow-lg transform transition-all duration-300 ${
              message.startsWith("✅") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}
          >
            {message}
          </div>
        )}

        {loading ? (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto"></div>
            <p className="text-gray-500 text-lg mt-4">Cargando candidatos...</p>
          </div>
        ) : error ? (
          <p className="text-center text-red-500 text-lg font-bold">{error}</p>
        ) : candidatos.length === 0 ? (
          <p className="text-gray-600 text-center text-lg">
            No hay candidatos para gestionar.
          </p>
        ) : (
          <div className="overflow-x-auto shadow-xl rounded-lg">
            <table className="w-full border-collapse bg-white">
              <thead className="bg-blue-800 text-white">
                <tr>
                  <th className="p-4 border-b text-left">Foto</th>
                  <th className="p-4 border-b text-left">Nombre Completo</th>
                  <th className="p-4 border-b">Correo</th>
                  <th className="p-4 border-b">Carrera</th>
                  <th className="p-4 border-b">Elección</th>
                  <th className="p-4 border-b">Estado</th>
                  <th className="p-4 border-b">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {candidatos.map((candidato) => (
                  <tr key={candidato.id_candidate} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 border-b">
                      <div className="flex justify-center">
                        <img
                          src={getCandidatePhoto(candidato)}
                          alt={`Foto de ${candidato.nombre_candidate} ${candidato.apellido_candidate}`}
                          className="w-16 h-16 rounded-full object-cover border-2 border-gray-300 shadow-sm"
                          onError={(e) => {
                            e.target.src = '/img/default-avatar.png';
                          }}
                        />
                      </div>
                    </td>
                    <td className="p-4 border-b text-left font-medium text-gray-900">
                      {`${candidato.nombre_candidate} ${candidato.apellido_candidate}`}
                    </td>
                    <td className="p-4 border-b text-gray-700">
                      {candidato.correo_candidate}
                    </td>
                    <td className="p-4 border-b text-gray-700">
                      {candidato.career?.nombre_career || 'No asignada'}
                    </td>
                    <td className="p-4 border-b text-gray-700">
                      {candidato.election?.nombre_election || 'Sin elección'}
                    </td>
                    <td className="p-4 border-b">
                      <span
                        className={`px-3 py-2 rounded-full text-sm font-bold
                          ${candidato.estado_candidate === "Aprobado" ? "bg-green-100 text-green-800 border border-green-300" :
                          candidato.estado_candidate === "Pendiente" ? "bg-yellow-100 text-yellow-800 border border-yellow-300" :
                          "bg-red-100 text-red-800 border border-red-300"}`}
                      >
                        {candidato.estado_candidate}
                      </span>
                    </td>
                    <td className="p-4 border-b">
                      <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-2">
                        <button
                          onClick={() => aprobarCandidato(candidato.id_candidate)}
                          className={`px-4 py-2 rounded-lg transition-colors shadow-md text-sm font-medium w-full sm:w-auto
                            ${candidato.estado_candidate === 'Aprobado' 
                              ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                              : 'bg-green-600 text-white hover:bg-green-700'}`}
                          aria-label="Aprobar candidato"
                          disabled={candidato.estado_candidate === 'Aprobado'}
                        >
                          {candidato.estado_candidate === 'Aprobado' ? 'Aprobado' : 'Aprobar'}
                        </button>
                        <button
                          onClick={() => rechazarCandidato(candidato.id_candidate)}
                          className={`px-4 py-2 rounded-lg transition-colors shadow-md text-sm font-medium w-full sm:w-auto
                            ${candidato.estado_candidate === 'No Aprobado' 
                              ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                              : 'bg-red-600 text-white hover:bg-red-700'}`}
                          aria-label="Rechazar candidato"
                          disabled={candidato.estado_candidate === 'No Aprobado'}
                        >
                          {candidato.estado_candidate === 'No Aprobado' ? 'Rechazado' : 'Rechazar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Aprobar_Eliminar_cand_admin; 