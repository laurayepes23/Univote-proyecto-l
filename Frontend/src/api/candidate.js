import api from "./axios";

// Obtener todos los candidatos
export const getCandidates = () => api.get("/candidates");

// Obtener un candidato por ID
export const getCandidateById = (id) => api.get(`/candidates/${id}`);

// Crear candidato
export const createCandidate = (candidateData) => api.post("/candidates", candidateData);

// Actualizar candidato
export const updateCandidate = (id, candidateData) => api.patch(`/candidates/${id}`, candidateData);

// Eliminar candidato
export const deleteCandidate = (id) => api.delete(`/candidates/${id}`);