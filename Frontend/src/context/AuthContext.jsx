import { createContext, useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    return token && userRole ? { token, role: userRole } : null;
  });
  const navigate = useNavigate();

  const login = (token, role, userData) => {
    setUser({ token, role });
    localStorage.setItem('token', token);
    localStorage.setItem('userRole', role);
    if (role === 'admin' && userData) {
      localStorage.setItem('adminData', JSON.stringify(userData));
      localStorage.setItem('adminId', userData.id?.toString());
      localStorage.setItem('adminName', `${userData.nombre} ${userData.apellido}`);
    }
    toast.success('¡Inicio de sesión exitoso!');
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('adminData');
    localStorage.removeItem('adminId');
    localStorage.removeItem('adminName');
    toast.info('Sesión cerrada');
    navigate('/login', { replace: true });
  };

  const checkAuth = () => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    console.log('🔍 Checking auth:', { token, userRole });
    return {
      isValid: Boolean(token && userRole),
      token,
      role: userRole
    };
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext)
}
