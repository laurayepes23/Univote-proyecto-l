import { createContext, useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user')
    return savedUser ? JSON.parse(savedUser) : null
  })
  const navigate = useNavigate()

  const login = (username, password) => {
    if (username === 'admin' && password === 'password') {
      const newUser = { username: 'admin' }
      setUser(newUser)
      localStorage.setItem('user', JSON.stringify(newUser)) 
      localStorage.setItem('token', 'fake-jwt-token')
      toast.success('Login exitoso!')
      navigate('/usuarios', { replace: true }) 
      toast.error('Credenciales incorrectas')
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    toast.info('Sesión cerrada')
    navigate('/login', { replace: true }) 
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext)
}
