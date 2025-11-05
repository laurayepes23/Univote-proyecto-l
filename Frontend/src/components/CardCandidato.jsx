import React from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = "http://localhost:3000";

// MODIFICADO: Recibimos la propiedad 'disabled'
export default function CardCandidato({ candidato, onVotar, disabled }) {
  const navigate = useNavigate();

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

  const handleVerPropuestas = () => {
    navigate(`/Propuestas/${candidato.id_candidate}`);
  };

  const fotoUrl = getCandidatePhoto(candidato);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 text-center flex flex-col items-center hover:shadow-xl transition-all duration-300 border border-gray-100">
      <img
        src={fotoUrl}
        alt={`${candidato.nombre_candidate} ${candidato.apellido_candidate}`}
        className="w-40 h-40 object-cover rounded-full mb-4 border-4 border-blue-200 shadow-md"
        onError={(e) => {
          e.target.src = '/img/default-avatar.png';
        }}
      />
      <h3 className="text-xl font-bold text-blue-900 mb-1">
        {candidato.nombre_candidate} {candidato.apellido_candidate}
      </h3>
      
      {/* Información adicional del candidato */}
      {candidato.career?.nombre_career && (
        <p className="text-gray-600 text-sm mb-2">
          {candidato.career.nombre_career}
        </p>
      )}
      
      <p className="text-gray-700 text-sm mb-4 text-center line-clamp-2">
        {candidato.descripcion_candidate || candidato.proposals?.[0]?.descripcion_proposal || 'Candidato comprometido con la comunidad universitaria'}
      </p>



      <div className="flex gap-3 mt-2 w-full justify-center">
        <button
          onClick={() => onVotar(candidato)}
          // MODIFICADO: Se añade el estado 'disabled'
          disabled={disabled}
          // MODIFICADO: Cambia el estilo si está deshabilitado
          className={`px-4 py-2 rounded-lg transition-all font-medium flex-1 max-w-32 ${
            disabled 
              ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
              : 'bg-blue-900 text-white hover:bg-blue-800 hover:shadow-md transform hover:scale-105'
          }`}
        >
          {disabled ? 'Ya Votado' : 'Votar'}
        </button>
        <button
          onClick={handleVerPropuestas}
          className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-all font-medium flex-1 max-w-32 hover:shadow-md transform hover:scale-105"
        >
          Propuestas
        </button>
      </div>
    </div>
  );
}