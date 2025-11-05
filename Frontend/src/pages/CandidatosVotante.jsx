import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import CardCandidato from "../components/CardCandidato";
import NavbarVotante from "../components/NavbarVotante";

const API_BASE_URL = "http://localhost:3000";

export default function CandidatosVotante() {
    const { id } = useParams();
    const [candidatos, setCandidatos] = useState([]);
    const [nombreEleccion, setNombreEleccion] = useState("");
    const [candidatoSeleccionado, setCandidatoSeleccionado] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [yaVoto, setYaVoto] = useState(false);

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
                const response = await axios.get(`${API_BASE_URL}/elections/${id}`);
                const electionData = response.data;

                if (electionData && electionData.candidates) {
                    const candidatosAprobados = electionData.candidates.filter(
                        c => c.estado_candidate === 'Aprobado'
                    );
                    
                    // Agregar URLs completas de fotos a cada candidato
                    const candidatosConFotos = candidatosAprobados.map(candidato => ({
                        ...candidato,
                        foto_completa: getCandidatePhoto(candidato)
                    }));
                    
                    setCandidatos(candidatosConFotos);
                    setNombreEleccion(electionData.nombre_election);
                } else {
                    setCandidatos([]);
                }

            } catch (err) {
                setError("No se pudo cargar la información de la elección. Por favor, inténtalo más tarde.");
                console.error("Error al obtener candidatos:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCandidatos();
    }, [id]);

    const handleVotar = (candidato) => {
        if (yaVoto) {
            alert("Ya has emitido tu voto en esta elección.");
            return;
        }
        setCandidatoSeleccionado(candidato);
    };

    const confirmarVoto = async () => {
        const voterId = 1; // SIMULACIÓN, CAMBIAR POR EL ID REAL DEL VOTANTE

        const voteData = {
            electionId: parseInt(id, 10),
            candidateId: candidatoSeleccionado.id_candidate,
            voterId: voterId
        };

        try {
            await axios.post(`${API_BASE_URL}/votes`, voteData);
            alert(`✅ ¡Gracias por votar! Tu voto para ${candidatoSeleccionado.nombre_candidate} ha sido registrado.`);
            setYaVoto(true);
        } catch (error) {
            console.error("Error al registrar el voto:", error.response?.data);
            const errorMessage = error.response?.data?.message || "Hubo un error al registrar tu voto.";
            alert(`❌ Error: ${errorMessage}`);
        } finally {
            setCandidatoSeleccionado(null);
        }
    };

    const cancelarVoto = () => {
        setCandidatoSeleccionado(null);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <NavbarVotante />
                <div className="pt-24 flex justify-center items-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto"></div>
                        <p className="text-gray-600 text-lg mt-4">Cargando candidatos...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50">
                <NavbarVotante />
                <div className="pt-24 flex justify-center items-center">
                    <p className="text-red-600 text-lg">Error: {error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 px-4 py-10 flex flex-col items-center">
            <NavbarVotante />
            <h1 className="text-3xl font-bold text-blue-900 mb-2 text-center mt-24">
                Candidatos para: {nombreEleccion}
            </h1>

            {yaVoto && (
                <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 w-full max-w-6xl rounded-lg" role="alert">
                    <p className="font-bold">¡Voto registrado!</p>
                    <p>Ya has participado en esta elección. Gracias.</p>
                </div>
            )}

            {candidatos.length === 0 ? (
                <div className="text-center mt-8">
                    <p className="text-gray-600 text-lg">
                        No hay candidatos aprobados disponibles para esta elección.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 w-full max-w-6xl">
                    {candidatos.map((candidato) => (
                        <CardCandidato
                            key={candidato.id_candidate}
                            candidato={candidato}
                            onVotar={handleVotar}
                            disabled={yaVoto}
                        />
                    ))}
                </div>
            )}

            {/* Modal de confirmación */}
            {candidatoSeleccionado && (
                <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 shadow-lg max-w-sm w-full text-center mx-4">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Confirmar Voto</h2>
                        <p className="text-gray-600 mb-6">
                            ¿Estás seguro de que deseas votar por{" "}
                            <span className="font-semibold">{candidatoSeleccionado.nombre_candidate}</span>?
                        </p>
                        <div className="flex justify-between gap-4">
                            <button 
                                onClick={cancelarVoto} 
                                className="flex-1 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={confirmarVoto} 
                                className="flex-1 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-600 transition-colors"
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}