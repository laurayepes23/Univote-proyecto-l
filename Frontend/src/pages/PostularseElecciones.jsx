import React, { useState, useEffect } from 'react';
import axios from 'axios';
import NavbarCandidato from "../components/NavbarCandidato";
import { FaCalendarAlt, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

export default function PostularseElecciones() {
  const [elecciones, setElecciones] = useState([]);
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
  const [loading, setLoading] = useState(true);
  const [candidateInfo, setCandidateInfo] = useState(null);

  // Efecto para cargar la información del candidato y las elecciones
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obtener información del candidato desde localStorage
        const candidateData = localStorage.getItem('candidateData');
        
        if (candidateData) {
          const parsedCandidate = JSON.parse(candidateData);
          setCandidateInfo(parsedCandidate);
          console.log("Candidato encontrado:", parsedCandidate);
        } else {
          setMensaje({ 
            texto: 'No se pudo encontrar tu información de candidato. Por favor, inicia sesión de nuevo.', 
            tipo: 'error' 
          });
          setLoading(false);
          return;
        }

        // Cargar elecciones
        const response = await axios.get('http://localhost:3000/elections');
        
        // Filtrar solo elecciones programadas
        const eleccionesProgramadas = response.data.filter(
          election => election.estado_election === "Programada"
        );
        
        setElecciones(eleccionesProgramadas);
      } catch (error) {
        console.error("Error al cargar las elecciones:", error);
        setMensaje({ 
          texto: 'No se pudieron cargar las elecciones. Inténtalo de nuevo más tarde.', 
          tipo: 'error' 
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Función para manejar la postulación del candidato
  const handlePostularse = async (electionId) => {
    if (!candidateInfo || !candidateInfo.id_candidate) {
      setMensaje({ 
        texto: 'No se pudo encontrar tu información de candidato. Por favor, inicia sesión de nuevo.', 
        tipo: 'error' 
      });
      return;
    }

    // Limpiamos el mensaje previo antes de una nueva solicitud
    setMensaje({ texto: '', tipo: '' });

    try {
      const response = await axios.post('http://localhost:3000/candidates/apply', {
        candidateId: candidateInfo.id_candidate,
        electionId: electionId,
      });

      setMensaje({ 
        texto: response.data.message || '¡Postulación exitosa! Tu solicitud está pendiente de aprobación por un administrador.', 
        tipo: 'success' 
      });

      // Actualizar la información del candidato en localStorage
      if (response.data.candidate) {
        localStorage.setItem('candidateData', JSON.stringify(response.data.candidate));
        setCandidateInfo(response.data.candidate);
      }

      // Actualizar la lista de elecciones para reflejar el cambio
      const electionsResponse = await axios.get('http://localhost:3000/elections');
      const eleccionesProgramadas = electionsResponse.data.filter(
        election => election.estado_election === "Programada"
      );
      setElecciones(eleccionesProgramadas);

    } catch (error) {
      console.error("Error completo:", error);
      
      let errorMessage = 'Ocurrió un error al postularte. Inténtalo de nuevo.';
      
      if (error.response?.status === 404) {
        errorMessage = 'Candidato o elección no encontrada.';
      } else if (error.response?.status === 409) {
        errorMessage = 'Ya estás postulado a una elección. No puedes postularte a más de una.';
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data.message || 'Datos inválidos.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      setMensaje({ texto: errorMessage, tipo: 'error' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-blue-50 text-gray-800">
      <NavbarCandidato />
      <div className="h-20"></div>

      {/* Sección principal de la página */}
      <main className="flex-grow max-w-6xl mx-auto p-8 w-full">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-extrabold text-blue-900 mb-4">
            Postúlate a Elecciones
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Explora las elecciones disponibles y presenta tus propuestas para el futuro de nuestra comunidad.
          </p>
        </div>

        {/* Información del candidato */}
        {candidateInfo && (
          <div className="bg-blue-100 border-l-4 border-blue-500 p-4 mb-6 rounded">
            <p className="text-blue-700 font-semibold">
              Candidato: {candidateInfo.nombre_candidate} {candidateInfo.apellido_candidate}
            </p>
            {candidateInfo.election && (
              <p className="text-blue-600 text-sm mt-1">
                Estado: {candidateInfo.estado_candidate} - 
                Elección: {candidateInfo.election.nombre_election}
              </p>
            )}
          </div>
        )}

        {/* Contenedor para mostrar mensajes de éxito o error */}
        {mensaje.texto && (
          <div className={`text-center p-4 mb-8 rounded-lg ${mensaje.tipo === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {mensaje.texto}
          </div>
        )}

        {/* Contenedor de las tarjetas de elecciones */}
        {loading ? (
          <p className="text-center text-gray-500">Cargando elecciones...</p>
        ) : elecciones.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600 mb-4">No hay elecciones programadas disponibles en este momento.</p>
            <p className="text-gray-500">Vuelve a revisar más tarde para nuevas oportunidades.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {elecciones.map((eleccion) => (
              <div 
                key={eleccion.id_election} 
                className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-800">{eleccion.nombre_election}</h3>
                  <span className="bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full uppercase">
                    {eleccion.estado_election}
                  </span>
                </div>
                
                <div className="text-gray-600 space-y-2 mb-4">
                  <p className="flex items-center">
                    <FaCalendarAlt className="mr-2 text-blue-500" />
                    <span className="font-semibold">Inicio:</span> {eleccion.fecha_inicio}
                  </p>
                  <p className="flex items-center">
                    <FaCalendarAlt className="mr-2 text-blue-500" />
                    <span className="font-semibold">Fin:</span> {eleccion.fecha_fin}
                  </p>
                </div>

                <p className="text-sm text-gray-500 mb-4">
                  {eleccion.descripcion_election || 'Sin descripción disponible'}
                </p>

                <button
                  onClick={() => handlePostularse(eleccion.id_election)}
                  disabled={candidateInfo?.electionId !== null && candidateInfo?.electionId !== undefined}
                  className="mt-4 w-full bg-blue-900 text-white font-semibold py-3 px-4 rounded-xl shadow-md hover:bg-blue-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <span className="flex items-center justify-center">
                    <FaCheckCircle className="mr-2" />
                    {candidateInfo?.electionId ? 'Ya estás postulado' : 'Postularme'}
                  </span>
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

    </div>
  );
}