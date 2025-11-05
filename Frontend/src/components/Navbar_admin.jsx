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
        // Limpia el token de autenticación o cualquier otro dato de la sesión
        localStorage.removeItem('token');
        console.log("Sesión cerrada");

        // Redirige al usuario a la página de login y reemplaza el historial
        // para que no pueda volver a la página anterior
        navigate("/login", { replace: true });
    };

    return (
        <nav className="fixed top-0 w-full bg-blue-900 text-white flex items-center justify-between px-5 h-24 z-50">
            {/* Logo de la app */}
            <Link to="/Administrador">
                <img
                    src="/public/img/logo-navbar.jpeg"
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
                <span className="block h-0.5 w-full bg-white rounded"></span>
                <span className="block h-0.5 w-full bg-white rounded"></span>
                <span className="block h-0.5 w-full bg-white rounded"></span>
            </button>

          <li
            className="md:px-4 py-3 md:py-0 border-b border-blue-800 md:border-none hover:bg-blue-800"
            onClick={() => setMenuOpen(false)}
          >
            <Link to="/Administrador">Inicio</Link>
          </li>

            {/* Menú principal */}
            <ul
                className={`md:flex md:items-center md:gap-6 md:static absolute top-20 left-0 w-full md:w-auto bg-blue-900 md:bg-transparent transition-transform duration-300 ease-in-out ${menuOpen ? "translate-x-0" : "-translate-x-full"
                    } md:translate-x-0`}
            >
                {/* Gestionar Votantes */}
                <li
                    className="relative group cursor-pointer px-4 py-3 md:py-0 border-b border-blue-800 md:border-none"
                    onClick={() => toggleSubmenu("votantes")}
                >
                    Gestionar Votantes <span className="ml-1">&#9662;</span>
                    <ul
                        className={`md:absolute md:top-full md:left-0 md:bg-blue-800 md:rounded-md md:shadow-lg md:min-w-[200px] ${openSubmenu === "votantes" ? "block" : "hidden"
                            }`}
                    >
                        <li className="px-4 py-2 hover:bg-blue-700">
                            <Link to="/Gestionar_votantes">Mostrar información votantes, Habilitar/Deshabilitar</Link>
                        </li>
                    </ul>
                </li>



                {/* Gestionar Elecciones */}
                <li
                    className="relative group cursor-pointer px-4 py-3 md:py-0 border-b border-blue-800 md:border-none"
                    onClick={() => toggleSubmenu("elecciones")}
                >
                    Gestionar Elecciones <span className="ml-1">&#9662;</span>
                    <ul
                        className={`md:absolute md:top-full md:left-0 md:bg-blue-800 md:rounded-md md:shadow-lg md:min-w-[200px] ${openSubmenu === "elecciones" ? "block" : "hidden"
                            }`}
                    >
                        <li className="px-4 py-2 hover:bg-blue-700">
                            <Link to="/Crear_eleccion_adm">Crear eleccion</Link>
                        </li>
                        <li className="px-4 py-2 hover:bg-blue-700">
                            <Link to="/Eliminar_eleccion">Eliminar eleccion</Link>
                        </li>
                        <li className="px-4 py-2 hover:bg-blue-700">
                            <Link to="/Ver_elecciones_admin">Ver elecciones</Link>
                        </li>
                        <li className="px-4 py-2 hover:bg-blue-700">
                            <Link to="/Resultado_elecciones_adm">Resultados elecciones</Link>
                        </li>
                        <li className="px-4 py-2 hover:bg-blue-700">
                            <Link to="/Iniciar_Cerrar_vot_adm">Iniciar / Cerrar elecciones </Link>
                        </li>
                    </ul>
                </li>

                {/* Gestionar Candidatos */}
                <li
                    className="relative group cursor-pointer px-4 py-3 md:py-0 border-b border-blue-800 md:border-none"
                    onClick={() => toggleSubmenu("candidatos")}
                >
                    Gestionar Candidatos <span className="ml-1">&#9662;</span>
                    <ul
                        className={`md:absolute md:top-full md:left-0 md:bg-blue-800 md:rounded-md md:shadow-lg md:min-w-[220px] ${openSubmenu === "candidatos" ? "block" : "hidden"
                            }`}
                    >
                        <li className="px-4 py-2 hover:bg-blue-700">
                            <Link to="/Ver_candidatos_adm">Ver candidatos </Link>
                        </li>
                        <li className="px-4 py-2 hover:bg-blue-700">
                            <Link to="/Resultado_candidatos_admin">Resultado de candidatos </Link>
                        </li>
                        <li className="px-4 py-2 hover:bg-blue-700">
                            <Link to="/Aprobar_Eliminar_cand_admin"> Aprobar / Eliminar candidato</Link>
                        </li>
                    </ul>
                </li>
            </ul>

            {/* Perfil (derecha) */}
            <div className="relative">
                <img
                    src="./public/img/mi_perfil.png"
                    alt="Perfil"
                    className="h-12 w-12 rounded-full cursor-pointer border-2 border-white"
                    onClick={() => setProfileOpen(!profileOpen)}
                />
                <ul
                    className={`absolute right-0 mt-2 bg-blue-800 rounded-md shadow-lg min-w-[150px] ${profileOpen ? "block" : "hidden"
                        }`}
                >
                    <li className="px-4 py-2 hover:bg-blue-700 cursor-pointer">
                        <Link to="/Mi_perfil_admin"> Mi perfil</Link>
                    </li>
                    <li
                        className="px-4 py-2 hover:bg-blue-700 cursor-pointer"
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
