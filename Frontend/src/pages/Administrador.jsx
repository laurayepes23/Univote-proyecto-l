import React from "react";
import Navbar_admin from "../components/Navbar_admin";
import Footer from "../components/Footer";
import { FaUserFriends, FaVoteYea, FaUserTie } from "react-icons/fa";

const Administrador = () => {
    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Navbar_admin />
            <div className="h-24"></div> 

            <main className="flex-grow p-8">
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-extrabold text-blue-900 mb-4">
                        Panel de Administrador 🏛️
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Accede a las herramientas de control y supervisión para gestionar todo el proceso electoral de tu comunidad.
                    </p>
                </div>

                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                    {/* Tarjeta de Gestión de Votantes */}
                    <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-200 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl flex flex-col">
                        <div className="flex items-center justify-center bg-blue-100 rounded-full w-16 h-16 mb-6">
                            <FaUserFriends className="text-blue-600 text-3xl" />
                        </div>
                        <h2 className="text-2xl font-bold text-blue-900 mb-2">Gestión de Votantes</h2>
                        <p className="text-gray-700 flex-grow">
                            Visualiza la información de todos los estudiantes votantes, incluyendo sus datos generales e identificación. Habilita o deshabilita a cada votante para controlar su participación en las elecciones.
                        </p>
                    </div>

                    {/* Tarjeta de Gestión de Elecciones */}
                    <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-200 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl flex flex-col">
                        <div className="flex items-center justify-center bg-green-100 rounded-full w-16 h-16 mb-6">
                            <FaVoteYea className="text-green-600 text-3xl" />
                        </div>
                        <h2 className="text-2xl font-bold text-blue-900 mb-2">Gestión de Elecciones</h2>
                        <p className="text-gray-700 flex-grow">
                            Crea, elimina, visualiza y gestiona el ciclo completo de los procesos electorales. Consulta los resultados en tiempo real y controla el inicio y cierre de las votaciones.
                        </p>
                    </div>

                    {/* Tarjeta de Gestión de Candidatos */}
                    <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-200 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl flex flex-col">
                        <div className="flex items-center justify-center bg-purple-100 rounded-full w-16 h-16 mb-6">
                            <FaUserTie className="text-purple-600 text-3xl" />
                        </div>
                        <h2 className="text-2xl font-bold text-blue-900 mb-2">Gestión de Candidatos</h2>
                        <p className="text-gray-700 flex-grow">
                            Consulta la información de los candidatos, revisa las propuestas que han presentado, y aprueba o rechaza sus postulaciones para garantizar un proceso justo y transparente.
                        </p>
                    </div>
                </section>
            </main>

        </div>
    );
};

export default Administrador;