import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const Navbar_admin = () => {
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('token')
    console.log('Sesión cerrada')
    navigate('/login')
  }

  return (
    <nav className="fixed top-0 w-full bg-blue-900 text-white flex items-center justify-between px-5 h-24 z-50">
      {/* Logo */}
      <Link to="/Votante">
        <img
          src="/public/img/logo-navbar.jpeg"
          alt="Logo"
          className="h-24 w-auto"
        />
      </Link>

      {/* Menú principal */}
      <ul
        className={`flex items-center gap-6 absolute md:static top-20 left-0 w-full md:w-auto bg-blue-900 md:bg-transparent flex-col md:flex-row md:gap-8 transition-transform duration-300 ease-in-out ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        <li
          className="md:px-4 py-3 md:py-0 border-b border-blue-800 md:border-none hover:bg-blue-800"
          onClick={() => setMenuOpen(false)}
        >
          <Link to="/Votante">Inicio</Link>
        </li>
        {/* Elecciones Disponibles */}
        <li className="cursor-pointer hover:text-blue-300 transition">
          <Link to="/EleccionesVotante">Elecciones Disponibles</Link>
        </li>

        {/* Resultados Elecciones */}
        <li className="cursor-pointer hover:text-blue-300 transition">
          <Link to="/ResultadosVotante">Resultados Elecciones</Link>
        </li>
      </ul>

      {/* Perfil + Cerrar sesión */}
      <div className="relative flex items-center gap-4">
        {/* Imagen de perfil */}
        <img
          src="./public/img/mi_perfil.png"
          alt="Perfil"
          className="h-12 w-12 rounded-full cursor-pointer "
          onClick={() => setProfileOpen(!profileOpen)}
        />

        {/* Menú perfil */}
        <ul
          className={`absolute right-0 top-14 bg-blue-800 rounded-md shadow-lg min-w-[150px] ${
            profileOpen ? 'block' : 'hidden'
          }`}
        >
          <li className="px-4 py-2 hover:bg-blue-700 cursor-pointer">
            <Link to="/MiPerfilVotante">Mi perfil</Link>
          </li>
          <li
            className="px-4 py-2 hover:bg-blue-700 cursor-pointer"
            onClick={handleLogout}
          >
            Cerrar sesión
          </li>
        </ul>
      </div>

      {/* Botón hamburguesa para móvil */}
      <button
        className="md:hidden flex flex-col justify-between w-6 h-5 focus:outline-none ml-4"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle menu"
      >
        <span className="block h-0.5 w-full bg-white rounded"></span>
        <span className="block h-0.5 w-full bg-white rounded"></span>
        <span className="block h-0.5 w-full bg-white rounded"></span>
      </button>
    </nav>
  )
}

export default Navbar_admin
