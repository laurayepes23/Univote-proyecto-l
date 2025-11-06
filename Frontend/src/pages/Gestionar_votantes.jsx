import React, { useState, useEffect } from "react";
import Navbar_admin from "../components/Navbar_admin";
import Footer from "../components/Footer";
import axios from 'axios'; 

const API_BASE_URL = 'http://localhost:3000/voters'; // Ajusta la URL de tu API de votantes

const Gestionar_votantes = () => {
  const [votantes, setVotantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Función para obtener los votantes de la API
  const fetchVoters = async () => {
    try {
      const response = await axios.get(API_BASE_URL);
      setVotantes(response.data.map(voter => ({
        id: voter.id_voter,
        nombre: voter.nombre_voter,
        apellido: voter.apellido_voter,
        tipoDoc: voter.tipo_doc_voter,
        numeroDoc: voter.num_doc_voter,
        correo: voter.correo_voter,
        estado: voter.estado_voter,
      })));
    } catch (err) {
      console.error("Error al cargar los votantes:", err);
      setError("No se pudieron cargar los datos de los votantes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVoters();
  }, []);

  // Función para habilitar/deshabilitar un votante
  const toggleEstado = async (id) => {
    try {
      // Encuentra el votante actual en el estado local
      const votanteToUpdate = votantes.find(v => v.id === id);
      if (!votanteToUpdate) return;

      const nuevoEstado = votanteToUpdate.estado === "Habilitado" ? "Deshabilitado" : "Habilitado";
      
      // Llama a la API para actualizar el estado del votante
      await axios.patch(`${API_BASE_URL}/${id}`, { estado_voter: nuevoEstado });

      // Actualiza el estado localmente para reflejar el cambio inmediatamente
      setVotantes((prevVotantes) =>
        prevVotantes.map((votante) =>
          votante.id === id ? { ...votante, estado: nuevoEstado } : votante
        )
      );
    } catch (err) {
      console.error("Error al actualizar el estado del votante:", err);
      setError("No se pudo actualizar el estado del votante.");
    }
  };

  if (loading) {
    return (
      <>
        <Navbar_admin />
        <div className="p-6 mt-24 text-center">Cargando votantes...</div>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar_admin />
        <div className="p-6 mt-24 text-center text-red-600 font-bold">Error: {error}</div>
       
      </>
    );
  }

  return (
    <>
      <Navbar_admin />
      <div className="p-6 mt-24">
        <h1 className="text-4xl font-extrabold text-center text-blue-900 mb-6">
          Información de Votantes
        </h1>

        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 bg-white shadow-md rounded-lg">
            <thead className="bg-blue-900 text-white">
              <tr>
                <th className="px-4 py-3 border">ID Votante</th>
                <th className="px-4 py-3 border">Nombre</th>
                <th className="px-4 py-3 border">Apellido</th>
                <th className="px-4 py-3 border">Tipo Doc</th>
                <th className="px-4 py-3 border">Número Doc</th>
                <th className="px-4 py-3 border">Correo</th>
                <th className="px-4 py-3 border">Estado</th>
                <th className="px-4 py-3 border">Acción</th>
              </tr>
            </thead>
            <tbody>
              {votantes.map((votante) => (
                <tr key={votante.id} className="text-center hover:bg-gray-100">
                  <td className="px-4 py-2 border">{votante.id}</td>
                  <td className="px-4 py-2 border">{votante.nombre}</td>
                  <td className="px-4 py-2 border">{votante.apellido}</td>
                  <td className="px-4 py-2 border">{votante.tipoDoc}</td>
                  <td className="px-4 py-2 border">{votante.numeroDoc.toString()}</td>
                  <td className="px-4 py-2 border">{votante.correo}</td>
                  <td
                    className={`px-4 py-2 border font-semibold ${
                      votante.estado === "Habilitado" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {votante.estado}
                  </td>
                  <td className="px-4 py-2 border">
                    <button
                      onClick={() => toggleEstado(votante.id)}
                      className={`px-3 py-1 rounded ${
                        votante.estado === "Habilitado"
                          ? "bg-red-500 text-white hover:bg-red-700"
                          : "bg-green-500 text-white hover:bg-green-700"
                      }`}
                    >
                      {votante.estado === "Habilitado" ? "Deshabilitar" : "Habilitar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default Gestionar_votantes;