import React, { useState, useEffect } from "react";
import axios from "axios";
import Navbar_admin from "../components/Navbar_admin";

// SVG Icons como componentes de React
// eslint-disable-next-line react-refresh/only-export-components
const DocumentIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-500 mr-3" viewBox="0 0 24 24" fill="currentColor">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM6 4h7v5h5v11H6z"/>
  </svg>
);
// eslint-disable-next-line react-refresh/only-export-components
const EnvelopeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-500 mr-3" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6zm-2 0l-8 5-8-5h16zm0 12H4V8l8 5 8-5v10z"/>
  </svg>
);
// eslint-disable-next-line react-refresh/only-export-components
const BuildingIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-500 mr-3" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 12h-2v2h2v-2zm0 4h-2v2h2v-2zm0-8h-2v2h2V8zm-4 4H9v6h6v-6zm-2-2h2v2h-2v-2zm0 4h2v2h-2v-2zm-4-4h2v2H7v-2zm0 4h2v2H7v-2zm-2-4H3v6h2v-6zm0-4H3v2h2V8zM7 2h10v2h-2v-2H9v2H7V2zm2 2h6v2h2V4h-6v2H9V4zM5 4h2v2H5V4zM3 4h2v2H3V4z"/>
  </svg>
);

const API_BASE_URL = "http://localhost:3000";

const Ver_candidatos_adm = () => {
  const [candidatos, setCandidatos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Función para obtener la URL completa de la foto
  const getCandidatePhoto = (candidato) => {
    if (!candidato.foto_candidate) return '/img/default-avatar.png';
    
    let fotoUrl = candidato.foto_candidate;
    
    // Si ya es una URL completa
    if (fotoUrl.startsWith('http')) {
      return fotoUrl;
    }
    // Si es una ruta relativa que empieza con /
    else if (fotoUrl.startsWith('/')) {
      return `${API_BASE_URL}${fotoUrl}`;
    }
    // Si es solo el nombre del archivo
    else {
      return `${API_BASE_URL}/uploads/candidatos/${fotoUrl}`;
    }
  };

  useEffect(() => {
    const fetchCandidatos = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/candidates`);
        if (Array.isArray(response.data)) {
          setCandidatos(response.data);
        } else {
          console.error("La respuesta de la API no es un array:", response.data);
          setError("Error: La respuesta del servidor no tiene el formato esperado.");
          setCandidatos([]);
        }
      } catch (err) {
        console.error("Error al cargar los candidatos:", err);
        setError("Error al cargar los datos. Verifique la conexión con el servidor.");
      } finally {
        setLoading(false);
      }
    };

    fetchCandidatos();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar_admin />
        <div className="pt-28 flex justify-center items-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto"></div>
            <p className="text-xl font-semibold text-gray-700 mt-4">Cargando candidatos...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar_admin />
        <div className="pt-28 flex justify-center items-center">
          <p className="text-xl font-bold text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar_admin />
      <div className="pt-28 pb-12 px-4">
        <h1 className="text-5xl font-extrabold text-center text-blue-800 mb-10">
          Ver Candidatos
        </h1>
        
        {candidatos.length === 0 ? (
           <div className="text-center">
             <p className="text-xl text-gray-600">No hay candidatos registrados.</p>
           </div>
        ) : (
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {candidatos.map((candidato) => (
                <div key={candidato.id_candidate} className="bg-white p-6 rounded-3xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 border-t-8 border-blue-600">
                  <div className="flex flex-col items-center">
                    <img
                      src={getCandidatePhoto(candidato)}
                      alt={`Foto de ${candidato.nombre_candidate} ${candidato.apellido_candidate}`}
                      className="w-32 h-32 rounded-full object-cover border-4 border-blue-400 mb-4 shadow-lg"
                      onError={(e) => {
                        e.target.src = '/img/default-avatar.png';
                      }}
                    />
                    <h2 className="text-2xl font-bold text-gray-800 text-center mb-1">
                      {`${candidato.nombre_candidate} ${candidato.apellido_candidate}`}
                    </h2>
                    <span className={`px-4 py-1 rounded-full text-sm font-semibold mb-4
                      ${candidato.estado_candidate === 'Aprobado' ? 'bg-green-200 text-green-800 border border-green-300' :
                      candidato.estado_candidate === 'Pendiente' ? 'bg-yellow-200 text-yellow-800 border border-yellow-300' :
                      'bg-red-200 text-red-800 border border-red-300'}`}
                    >
                      {candidato.estado_candidate}
                    </span>
                  </div>
                  
                  <ul className="space-y-3 mt-4 text-gray-700">
                    <li className="flex items-center">
                      <DocumentIcon />
                      <span className="text-sm">Documento: {candidato.num_doc_candidate}</span>
                    </li>
                    <li className="flex items-center">
                      <EnvelopeIcon />
                      <span className="text-sm">Correo: {candidato.correo_candidate}</span>
                    </li>
                    <li className="flex items-center">
                      <BuildingIcon />
                      <span className="text-sm">Carrera: {candidato.career?.nombre_career || 'No asignada'}</span>
                    </li>
                    <li className="flex items-center">
                      <BuildingIcon />
                      <span className="text-sm">Elección: {candidato.election?.nombre_election || 'N/A'}</span>
                    </li>
                    <li className="flex items-start flex-wrap mt-2">
                      <span className="font-semibold text-gray-900 mr-2 text-sm">Propuesta:</span>
                      <p className="text-sm italic text-gray-600">
                        "{candidato.proposals?.[0]?.descripcion_proposal || 'Sin propuesta registrada'}"
                      </p>
                    </li>
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Ver_candidatos_adm;