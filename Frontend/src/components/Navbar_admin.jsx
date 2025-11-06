import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const Navbar_admin = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [openSubmenu, setOpenSubmenu] = useState(null);
    const [profileOpen, setProfileOpen] = useState(false);
    const navigate = useNavigate();

    const toggleSubmenu = (menu) => {
        setOpenSubmenu(openSubmenu === menu ? null : menu);
    };

    const handleLogout = () => {
        // Limpia todos los datos de la sesión
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('adminData');
        localStorage.removeItem('adminId');
        localStorage.removeItem('adminName');
        console.log("🔒 Sesión cerrada y datos limpiados");

        // Redirige al usuario a la página de login y reemplaza el historial
        navigate("/login", { replace: true });
    };

    const closeAllMenus = () => {
        setMenuOpen(false);
        setOpenSubmenu(null);
        setProfileOpen(false);
    };

    return (
        <nav className="fixed top-0 w-full bg-blue-900 text-white flex items-center justify-between px-5 h-24 z-50">
            {/* Logo de la app */}
            <Link to="/Administrador" onClick={closeAllMenus}>
                <img
                    src="/img/Logo-navbar.jpeg"
                    alt="Logo"
                    className="h-24 w-auto"
                />
            </Link>

            {/* Botón hamburguesa (móvil) */}
            <button
                className="md:hidden flex flex-col justify-between w-6 h-5 focus:outline-none"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Toggle menu"
            >
                <span className="block h-0.5 w-full bg-white rounded transition-transform duration-300"></span>
                <span className="block h-0.5 w-full bg-white rounded transition-transform duration-300"></span>
                <span className="block h-0.5 w-full bg-white rounded transition-transform duration-300"></span>
            </button>

            {/* Menú principal */}
            <ul
                className={`md:flex md:items-center md:gap-6 md:static absolute top-24 left-0 w-full md:w-auto bg-blue-900 md:bg-transparent transition-all duration-300 ease-in-out ${menuOpen ? "translate-x-0" : "-translate-x-full"
                    } md:translate-x-0`}
            >
                {/* Inicio - CORREGIDO */}
                <li className="md:px-4 py-3 md:py-0 border-b border-blue-800 md:border-none hover:bg-blue-800 transition-colors duration-200">
                    <Link 
                        to="/Administrador" 
                        className="block w-full h-full"
                        onClick={closeAllMenus}
                    >
                        Inicio
                    </Link>
                </li>

                {/* Gestionar Votantes */}
                <li
                    className="relative group cursor-pointer px-4 py-3 md:py-0 border-b border-blue-800 md:border-none hover:bg-blue-800 transition-colors duration-200"
                    onClick={() => toggleSubmenu("votantes")}
                >
                    <div className="flex items-center justify-between">
                        Gestionar Votantes
                        <span className="ml-1 transform transition-transform duration-200">&#9662;</span>
                    </div>
                    <ul
                        className={`md:absolute md:top-full md:left-0 md:bg-blue-800 md:rounded-md md:shadow-lg md:min-w-[250px] mt-1 md:mt-0 transition-all duration-200 ${openSubmenu === "votantes" ? "block" : "hidden"
                            }`}
                    >
                        <li className="px-4 py-2 hover:bg-blue-700 transition-colors duration-200">
                            <Link 
                                to="/Gestionar_votantes" 
                                className="block w-full"
                                onClick={closeAllMenus}
                            >
                                Mostrar información votantes, Habilitar/Deshabilitar
                            </Link>
                        </li>
                    </ul>
                </li>

                {/* Gestionar Elecciones */}
                <li
                    className="relative group cursor-pointer px-4 py-3 md:py-0 border-b border-blue-800 md:border-none hover:bg-blue-800 transition-colors duration-200"
                    onClick={() => toggleSubmenu("elecciones")}
                >
                    <div className="flex items-center justify-between">
                        Gestionar Elecciones
                        <span className="ml-1 transform transition-transform duration-200">&#9662;</span>
                    </div>
                    <ul
                        className={`md:absolute md:top-full md:left-0 md:bg-blue-800 md:rounded-md md:shadow-lg md:min-w-[220px] mt-1 md:mt-0 transition-all duration-200 ${openSubmenu === "elecciones" ? "block" : "hidden"
                            }`}
                    >
                        <li className="px-4 py-2 hover:bg-blue-700 transition-colors duration-200">
                            <Link 
                                to="/Crear_eleccion_adm" 
                                className="block w-full"
                                onClick={closeAllMenus}
                            >
                                Crear elección
                            </Link>
                        </li>
                        <li className="px-4 py-2 hover:bg-blue-700 transition-colors duration-200">
                            <Link 
                                to="/Eliminar_eleccion" 
                                className="block w-full"
                                onClick={closeAllMenus}
                            >
                                Eliminar elección
                            </Link>
                        </li>
                        <li className="px-4 py-2 hover:bg-blue-700 transition-colors duration-200">
                            <Link 
                                to="/Ver_elecciones_admin" 
                                className="block w-full"
                                onClick={closeAllMenus}
                            >
                                Ver elecciones
                            </Link>
                        </li>
                        <li className="px-4 py-2 hover:bg-blue-700 transition-colors duration-200">
                            <Link 
                                to="/Resultado_elecciones_adm" 
                                className="block w-full"
                                onClick={closeAllMenus}
                            >
                                Resultados elecciones
                            </Link>
                        </li>
                        <li className="px-4 py-2 hover:bg-blue-700 transition-colors duration-200">
                            <Link 
                                to="/Iniciar_Cerrar_vot_adm" 
                                className="block w-full"
                                onClick={closeAllMenus}
                            >
                                Iniciar / Cerrar elecciones
                            </Link>
                        </li>
                    </ul>
                </li>

                {/* Gestionar Candidatos */}
                <li
                    className="relative group cursor-pointer px-4 py-3 md:py-0 border-b border-blue-800 md:border-none hover:bg-blue-800 transition-colors duration-200"
                    onClick={() => toggleSubmenu("candidatos")}
                >
                    <div className="flex items-center justify-between">
                        Gestionar Candidatos
                        <span className="ml-1 transform transition-transform duration-200">&#9662;</span>
                    </div>
                    <ul
                        className={`md:absolute md:top-full md:left-0 md:bg-blue-800 md:rounded-md md:shadow-lg md:min-w-[240px] mt-1 md:mt-0 transition-all duration-200 ${openSubmenu === "candidatos" ? "block" : "hidden"
                            }`}
                    >
                        <li className="px-4 py-2 hover:bg-blue-700 transition-colors duration-200">
                            <Link 
                                to="/Ver_candidatos_adm" 
                                className="block w-full"
                                onClick={closeAllMenus}
                            >
                                Ver candidatos
                            </Link>
                        </li>
                        <li className="px-4 py-2 hover:bg-blue-700 transition-colors duration-200">
                            <Link 
                                to="/Resultado_candidatos_admin" 
                                className="block w-full"
                                onClick={closeAllMenus}
                            >
                                Resultado de candidatos
                            </Link>
                        </li>
                        <li className="px-4 py-2 hover:bg-blue-700 transition-colors duration-200">
                            <Link 
                                to="/Aprobar_Eliminar_cand_admin" 
                                className="block w-full"
                                onClick={closeAllMenus}
                            >
                                Aprobar / Eliminar candidato
                            </Link>
                        </li>
                    </ul>
                </li>
            </ul>

            {/* Perfil (derecha) */}
            <div className="relative">
                <img
                    src="/img/mi_perfil.png"
                    alt="Perfil"
                    className="h-12 w-12 rounded-full cursor-pointer border-2 border-white hover:border-blue-300 transition-colors duration-200"
                    onClick={() => setProfileOpen(!profileOpen)}
                />
                <ul
                    className={`absolute right-0 mt-2 bg-blue-800 rounded-md shadow-lg min-w-[150px] py-1 transition-all duration-200 ${profileOpen ? "block opacity-100" : "hidden opacity-0"
                        }`}
                >
                    <li className="px-4 py-2 hover:bg-blue-700 transition-colors duration-200">
                        <Link 
                            to="/Mi_perfil_admin" 
                            className="block w-full"
                            onClick={closeAllMenus}
                        >
                            Mi perfil
                        </Link>
                    </li>
                    <li
                        className="px-4 py-2 hover:bg-blue-700 cursor-pointer transition-colors duration-200"
                        onClick={handleLogout}
                    >
                        Cerrar sesión
                    </li>
                </ul>
            </div>
        </nav>
    );
};

export default Navbar_admin;