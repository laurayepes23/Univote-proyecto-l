import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaUser, FaUserTie } from 'react-icons/fa'; // Importa los íconos para el menú de registro

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [submenuOpen, setSubmenuOpen] = useState(false);
  const [registerSubmenuOpen, setRegisterSubmenuOpen] = useState(false);

  const handleScroll = (id) => {
    setMenuOpen(false); // Cierra el menú móvil
    setSubmenuOpen(false);
    setRegisterSubmenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <nav className="fixed top-0 w-full bg-blue-900 text-white flex items-center justify-between px-5 h-24 z-50">
        
        <Link to="/">
          <img
            src="/public/img/logo-navbar.jpeg"
            alt="Logo"
            className="h-24 w-auto"
          />
        </Link>

        {/* Botón hamburguesa */}
        <button
          className="md:hidden flex flex-col justify-between w-6 h-5 focus:outline-none"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span className="block h-0.5 w-full bg-white rounded"></span>
          <span className="block h-0.5 w-full bg-white rounded"></span>
          <span className="block h-0.5 w-full bg-white rounded"></span>
        </button>

        <ul
          className={`
            md:flex md:items-center md:static absolute top-24 left-0 w-full md:w-auto bg-blue-900 md:bg-transparent
            transition-transform duration-300 ease-in-out
            ${menuOpen ? 'translate-x-0' : '-translate-x-full'}
            md:translate-x-0
          `}
        >
          {/* Enlace 'inicio' */}
          <li
            className="md:px-4 py-3 md:py-0 border-b border-blue-800 md:border-none hover:bg-blue-800"
            onClick={() => setMenuOpen(false)}
          >
            <Link to="/">Inicio</Link>
          </li>
          
          {/* Menú 'Nosotros' */}
          <li
            className="relative group cursor-pointer md:px-4 py-3 md:py-0 border-b border-blue-800 md:border-none"
            onClick={() => {
              setSubmenuOpen(!submenuOpen);
              setRegisterSubmenuOpen(false);
            }}
            onMouseEnter={() => setSubmenuOpen(true)}
            onMouseLeave={() => setSubmenuOpen(false)}
            aria-haspopup="true"
            aria-expanded={submenuOpen}
          >
            <div className="flex items-center">
              Nosotros
              <span className="ml-1 inline-block transform group-hover:rotate-180 transition-transform duration-200">&#9662;</span>
            </div>
            {/* Submenú de Nosotros */}
            <ul
              className={`
                md:absolute md:top-full md:left-0 md:bg-blue-800 md:rounded-md md:shadow-lg md:min-w-[150px]
                md:opacity-0 md:invisible md:group-hover:opacity-100 md:group-hover:visible
                ${submenuOpen ? 'block' : 'hidden'} md:block
              `}
              onClick={(e) => e.stopPropagation()}
            >
              {['quienes-somos', 'vision', 'mision', 'contactanos'].map((item) => (
                <li
                  key={item}
                  className="px-4 py-2 hover:bg-blue-700 cursor-pointer whitespace-nowrap"
                  onClick={() => handleScroll(item)}
                >
                  {item === 'quienes-somos' ? 'Quiénes somos' : item.charAt(0).toUpperCase() + item.slice(1)}
                </li>
              ))}
            </ul>
          </li>


          

          {/* Enlace 'Login' */}
          <li
            className="md:px-4 py-3 md:py-0 border-b border-blue-800 md:border-none hover:bg-blue-800"
            onClick={() => setMenuOpen(false)}
          >
            <Link to="/Login">Login</Link>
          </li>

          {/* Menú 'Registrarse' */}
          <li
            className="relative group cursor-pointer md:px-4 py-3 md:py-0 border-b border-blue-800 md:border-none"
            onClick={() => {
              setRegisterSubmenuOpen(!registerSubmenuOpen);
              setSubmenuOpen(false);
            }}
            onMouseEnter={() => setRegisterSubmenuOpen(true)}
            onMouseLeave={() => setRegisterSubmenuOpen(false)}
            aria-haspopup="true"
            aria-expanded={registerSubmenuOpen}
          >
            <div className="flex items-center">
              Registrarse
              <span className="ml-1 inline-block transform group-hover:rotate-180 transition-transform duration-200">&#9662;</span>
            </div>
            {/* Submenú de Registrarse */}
            <ul
              className={`
                md:absolute md:top-full md:left-0 md:bg-blue-800 md:rounded-md md:shadow-lg md:min-w-[150px]
                md:opacity-0 md:invisible md:group-hover:opacity-100 md:group-hover:visible
                ${registerSubmenuOpen ? 'block' : 'hidden'} md:block
              `}
              onClick={(e) => e.stopPropagation()}
            >
              <li
                className="px-4 py-2 hover:bg-blue-700 cursor-pointer whitespace-nowrap flex items-center"
                onClick={() => setRegisterSubmenuOpen(false)}
              >
                <Link to="/RegistroVotante" className="flex items-center w-full">
                  <FaUser className="mr-2" />
                  Votante
                </Link>
              </li>
              <li
                className="px-4 py-2 hover:bg-blue-700 cursor-pointer whitespace-nowrap flex items-center"
                onClick={() => setRegisterSubmenuOpen(false)}
              >
                <Link to="/Registro_candidato" className="flex items-center w-full">
                  <FaUserTie className="mr-2" />
                  Candidato
                </Link>
              </li>
            </ul>
          </li>
        </ul>
      </nav>
    </>
  );
};

export default Navbar;