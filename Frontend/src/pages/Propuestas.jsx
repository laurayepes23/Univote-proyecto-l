// eslint-disable-next-line no-unused-vars
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import NavbarVotante from "../components/NavbarVotante";
import axios from "axios";

const API_BASE_URL = "http://localhost:3000";

export default function Propuestas() {
  const { id } = useParams(); // Obtiene el ID del candidato de la URL
  const [propuestas, setPropuestas] = useState([]);
  const [candidato, setCandidato] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Función para obtener la URL completa de la foto
  const getCandidatePhoto = (candidato) => {
    if (!candidato?.foto_candidate) return '/img/default-avatar.png';
    
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
    const fetchCandidatoYPropuestas = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/candidates/${id}/proposals`);
        
        setCandidato(response.data);
        setPropuestas(response.data.proposals || []);
        
      } catch (err) {
        setError("No se pudo cargar la información del candidato.");
        console.error("Error fetching data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCandidatoYPropuestas();
  }, [id]);

  // Renderizado mientras carga la información
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavbarVotante />
        <div className="pt-24 flex justify-center items-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto"></div>
            <p className="text-gray-600 text-lg mt-4">Cargando propuestas...</p>
          </div>
        </div>
      </div>
    );
  }

  // Renderizado si ocurre un error
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavbarVotante />
        <div className="pt-24 flex justify-center items-center">
          <p className="text-red-600 text-lg text-center max-w-md px-4">
            {error}
          </p>
        </div>
      </div>
    );
  }

  const fotoUrl = candidato ? getCandidatePhoto(candidato) : '/img/default-avatar.png';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center px-4 py-10">
      <NavbarVotante />

      <h1 className="text-3xl font-bold text-blue-900 mb-10 text-center mt-24">
        Propuestas del Candidato
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch w-full">
        {/* Columna izquierda: candidato */}
        {candidato && (
          <div className="bg-white rounded-2xl shadow-xl p-6 flex flex-col items-center text-center h-full border border-gray-100">
            <div className="flex justify-center items-center w-full mb-6">
              <img
                src={fotoUrl}
                alt={`${candidato.nombre_candidate} ${candidato.apellido_candidate}`}
                className="w-48 h-48 object-cover rounded-full border-4 border-blue-200 shadow-lg"
                onError={(e) => {
                  e.target.src = '/img/default-avatar.png';
                }}
              />
            </div>
            
            <h3 className="text-2xl font-bold text-blue-900 mb-2">
              {candidato.nombre_candidate} {candidato.apellido_candidate}
            </h3>
            
            {/* Información adicional del candidato */}
            {candidato.career?.nombre_career && (
              <p className="text-gray-600 mb-3 text-lg">
                {candidato.career.nombre_career}
              </p>
            )}
           
            {/* Información de contacto */}
            <div className="w-full mt-4 space-y-2 text-left">

              {candidato.election?.nombre_election && (
                <p className="text-gray-700 text-sm">
                  <span className="font-semibold">Elección:</span> {candidato.election.nombre_election}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Columna derecha: propuestas */}
        <div className="md:col-span-2 bg-white rounded-2xl shadow-xl p-8 h-full flex flex-col border border-gray-100">
          <h2 className="text-2xl font-bold text-blue-800 mb-6 text-center">
            Lista de Propuestas
          </h2>
          
          {propuestas.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="text-6xl text-gray-300 mb-4">📝</div>
              <p className="text-gray-600 text-lg mb-2">
                Este candidato no tiene propuestas registradas.
              </p>
              <p className="text-gray-500 text-sm">
                Las propuestas aparecerán aquí cuando sean agregadas.
              </p>
            </div>
          ) : (
            <div className="flex-1">
              <div className="mb-4 text-sm text-gray-600 text-center">
                {propuestas.length} {propuestas.length === 1 ? 'propuesta' : 'propuestas'} registrada{propuestas.length === 1 ? '' : 's'}
              </div>
              
              <ul className="space-y-4">
                {propuestas.map((propuesta, index) => (
                  <li
                    key={propuesta.id_proposal}
                    className="flex items-start gap-4 bg-gray-50 p-6 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-300 hover:border-blue-200"
                  >
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </div>
                    </div>
                    
                    <div className="flex-grow">
                      {propuesta.titulo_proposal && (
                        <h4 className="font-semibold text-gray-900 mb-2 text-lg">
                          {propuesta.titulo_proposal}
                        </h4>
                      )}
                      
                      <p className="text-gray-800 leading-relaxed">
                        {propuesta.descripcion_proposal}
                      </p>
                      
                      {/* Estado de la propuesta si está disponible */}
                      {propuesta.estado_proposal && (
                        <div className="mt-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            propuesta.estado_proposal === 'Activa' 
                              ? 'bg-green-100 text-green-800'
                              : propuesta.estado_proposal === 'En revisión'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {propuesta.estado_proposal}
                          </span>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}