import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import NavbarVotante from '../components/NavbarVotante'
import Footer from '../components/Footer'
import axios from 'axios'
import {
  FaEnvelope,
  FaPen,
  FaSave,
  FaLock,
  FaUser,
  FaIdCard,
  FaUniversity,
  FaVoteYea
} from 'react-icons/fa'

const API_BASE_URL = 'http://localhost:3000'

export default function MiPerfilVotante() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // ✅ DEBUG: Verificar localStorage al cargar el componente
  useEffect(() => {
    console.log('🔍 DEBUG INICIAL - localStorage completo:');
    console.log('voterId:', localStorage.getItem('voterId'));
    console.log('userRole:', localStorage.getItem('userRole'));
    console.log('voterData:', localStorage.getItem('voterData'));
    console.log('Todos los items del localStorage:');
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      console.log(`${key}:`, localStorage.getItem(key));
    }
  }, []);

  // ✅ FUNCIÓN PARA CARGAR EL PERFIL - VERSIÓN MEJORADA
  const loadVoterProfile = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const voterId = localStorage.getItem('voterId')
      const userRole = localStorage.getItem('userRole')

      // ✅ DEBUG DETALLADO
      console.log('🔍 DEBUG - localStorage al cargar perfil:');
      console.log('voterId:', voterId);
      console.log('userRole:', userRole);
      console.log('voterData:', localStorage.getItem('voterData'));

      if (userRole !== 'voter') {
        setError('No tienes permisos para acceder a esta página. Debes iniciar sesión como votante.')
        setLoading(false)
        return
      }

      if (!voterId || voterId === 'undefined' || voterId === 'null') {
        setError('ID de votante no encontrado. Por favor, inicia sesión nuevamente.')
        setLoading(false)
        return
      }

      // ✅ VALIDAR QUE EL ID SEA UN NÚMERO VÁLIDO
      const parsedVoterId = parseInt(voterId)
      if (isNaN(parsedVoterId) || parsedVoterId <= 0) {
        setError('ID de votante inválido. Por favor, inicia sesión nuevamente.')
        setLoading(false)
        return
      }

      console.log('🔄 Cargando perfil del votante ID:', parsedVoterId);

      const response = await axios.get(`${API_BASE_URL}/voters/${parsedVoterId}`)
      const voterData = response.data

      console.log('📊 Datos del votante recibidos:', voterData);

      const profileData = {
        id_voter: voterData.id_voter,
        nombre: voterData.nombre_voter,
        apellido: voterData.apellido_voter,
        tipo_documento: voterData.tipo_doc_voter,
        numero_documento: voterData.num_doc_voter,
        correo: voterData.correo_voter,
        estado: voterData.estado_voter,
        carrera: voterData.career?.nombre_career || 'No asignada',
        facultad: voterData.career?.facultad_career || 'No asignada',
        eleccion: voterData.election?.nombre_election || 'No asignada',
        estado_eleccion: voterData.election?.estado_election || 'No disponible'
      }

      setProfile(profileData)
      setFormData({
        email: profileData.correo,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      
      // ✅ ACTUALIZAR LOCALSTORAGE CON DATOS COMPLETOS
      localStorage.setItem('voterData', JSON.stringify(voterData))
      
      console.log('✅ Perfil cargado exitosamente');
      
    } catch (err) {
      console.error('❌ Error loading voter profile:', err)
      console.error('❌ Detalles del error:', err.response?.data)
      
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          'Error al cargar el perfil. Por favor, intenta nuevamente.'
      
      setError(errorMessage)
      loadFromLocalStorage()
    } finally {
      setLoading(false)
    }
  }, [])

  // ✅ FUNCIÓN PARA CARGAR DESDE LOCALSTORAGE
  const loadFromLocalStorage = () => {
    try {
      const voterData = localStorage.getItem('voterData')
      if (voterData) {
        const parsedData = JSON.parse(voterData)
        const profileData = {
          id_voter: parsedData.id_voter,
          nombre: parsedData.nombre_voter,
          apellido: parsedData.apellido_voter,
          tipo_documento: parsedData.tipo_doc_voter,
          numero_documento: parsedData.num_doc_voter,
          correo: parsedData.correo_voter,
          estado: parsedData.estado_voter,
          carrera: parsedData.career?.nombre_career || 'No asignada',
          facultad: parsedData.career?.facultad_career || 'No asignada',
          eleccion: parsedData.election?.nombre_election || 'No asignada',
          estado_eleccion: parsedData.election?.estado_election || 'No disponible'
        }
        setProfile(profileData)
        setFormData({
          email: profileData.correo,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
        setError('Perfil cargado desde caché local. Algunos datos pueden no estar actualizados.')
      } else {
        setError('No se encontraron datos del votante. Por favor, inicia sesión nuevamente.')
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error)
      setError('Error al cargar los datos del almacenamiento local')
    }
  }

  // ✅ FUNCIÓN PARA MANEJAR CAMBIOS EN EL FORMULARIO
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // ✅ FUNCIÓN PARA VALIDAR CONTRASEÑA ACTUAL
  const validateCurrentPassword = async () => {
    try {
      const voterId = localStorage.getItem('voterId')
      
      if (!voterId) {
        setError('No se encontró el ID del votante')
        return false
      }

      const parsedVoterId = parseInt(voterId)
      if (isNaN(parsedVoterId)) {
        setError('ID de votante inválido')
        return false
      }

      console.log('🔐 Validando contraseña para votante ID:', parsedVoterId)

      const response = await axios.post(`${API_BASE_URL}/voters/validate-password`, {
        voterId: parsedVoterId,
        password: formData.currentPassword
      })

      return response.data.valid
    } catch (error) {
      console.error('Error validando contraseña:', error)
      setError('Error al validar la contraseña actual')
      return false
    }
  }

  // ✅ FUNCIÓN PARA VALIDAR FORMULARIO COMPLETO
  const validateForm = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    
    if (!formData.email || !emailRegex.test(formData.email.trim())) {
      setError('Por favor ingresa un email válido (ejemplo: usuario@dominio.com)')
      return false
    }

    // Si se intenta cambiar la contraseña, validar contraseña actual
    if (formData.newPassword || formData.confirmPassword) {
      if (!formData.currentPassword) {
        setError('Debes ingresar tu contraseña actual para cambiar la contraseña')
        return false
      }

      // Validar que la contraseña actual sea correcta
      const isCurrentPasswordValid = await validateCurrentPassword()
      if (!isCurrentPasswordValid) {
        setError('La contraseña actual es incorrecta')
        return false
      }

      if (formData.newPassword.length < 6) {
        setError('La nueva contraseña debe tener al menos 6 caracteres')
        return false
      }

      if (formData.newPassword !== formData.confirmPassword) {
        setError('Las nuevas contraseñas no coinciden')
        return false
      }
    }

    return true
  }

  // ✅ FUNCIÓN PARA GUARDAR CAMBIOS
  const handleSaveChanges = async () => {
    try {
      setError('')
      setSuccess('')
      
      const voterId = localStorage.getItem('voterId')
      
      if (!voterId) {
        setError('Error: No se encontró el ID del votante')
        return
      }

      const parsedVoterId = parseInt(voterId)
      if (isNaN(parsedVoterId)) {
        setError('ID de votante inválido')
        return
      }

      if (!await validateForm()) {
        return
      }

      // ✅ PREPARAR DATOS CON LOS NOMBRES EXACTOS QUE ESPERA EL DTO
      const updateData = {}

      // Solo enviar correo si cambió
      if (formData.email.trim() !== profile.correo) {
        updateData.correo_voter = formData.email.trim()
      }

      // Solo enviar contraseña si se proporcionó una nueva
      if (formData.newPassword) {
        updateData.contrasena_voter = formData.newPassword
      }

      // Verificar si hay cambios reales
      const hasEmailChanged = formData.email.trim() !== profile.correo
      const hasPasswordChanged = formData.newPassword.length > 0

      if (!hasEmailChanged && !hasPasswordChanged) {
        setError('No hay cambios que guardar')
        return
      }

      console.log('📤 Enviando actualización:', updateData)

      const response = await axios.patch(
        `${API_BASE_URL}/voters/${parsedVoterId}`,
        updateData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )

      console.log('✅ Perfil actualizado con éxito:', response.data)

      // ✅ ACTUALIZAR ESTADO
      setProfile((prev) => ({
        ...prev,
        correo: formData.email,
      }))

      // ✅ RESETEAR CAMPOS
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }))

      setIsEditing(false)
      setSuccess('¡Perfil actualizado con éxito!')
      
      // ✅ ACTUALIZAR LOCALSTORAGE
      const updatedVoterData = {
        ...JSON.parse(localStorage.getItem('voterData') || '{}'),
        correo_voter: formData.email.trim()
      }
      localStorage.setItem('voterData', JSON.stringify(updatedVoterData))
      
      setTimeout(() => setSuccess(''), 3000)
      
    } catch (error) {
      console.error('❌ Error actualizando perfil:', error)
      
      let errorMessage = 'Error al actualizar el perfil'
      
      if (error.response?.data) {
        const errorData = error.response.data
        
        if (Array.isArray(errorData.message)) {
          errorMessage = 'Errores de validación:\n' + errorData.message.join('\n• ')
        } 
        else if (errorData.message) {
          errorMessage = errorData.message
        }
        else if (errorData.error) {
          errorMessage = errorData.error
        }
      } else {
        errorMessage = error.message || 'Error de conexión'
      }
      
      setError(errorMessage)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setFormData({
      email: profile?.correo || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
    setError('')
    setSuccess('')
  }

  const handleStartEditing = () => {
    setIsEditing(true)
    setFormData({
      email: profile?.correo || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
    setError('')
    setSuccess('')
  }

  useEffect(() => {
    loadVoterProfile()
  }, [loadVoterProfile])

  const handleRetry = () => {
    console.log('🔄 Reintentando cargar perfil...');
    setError('')
    setLoading(true)
    
    // ✅ LIMPIAR CACHE Y RECARGAR
    localStorage.removeItem('voterData');
    loadVoterProfile();
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-blue-50 text-gray-800">
        <NavbarVotante />
        <div className="h-20"></div>
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando perfil...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (error && !profile) {
    return (
      <div className="min-h-screen flex flex-col bg-blue-50 text-gray-800">
        <NavbarVotante />
        <div className="h-20"></div>
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <p className="text-red-600 text-lg mb-4">{error}</p>
            <div className="space-y-3">
              <button 
                onClick={handleRetry}
                className="w-full px-6 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors"
              >
                Reintentar
              </button>
              <button 
                onClick={() => navigate('/login')}
                className="w-full px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Volver al Login
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-blue-50 text-gray-800">
      <NavbarVotante />
      <div className="h-20"></div>

      {success && (
        <div className="max-w-4xl mx-auto w-full px-8 mt-10">
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-4">
            <p>{success}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="max-w-4xl mx-auto w-full px-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
            <p>{error}</p>
          </div>
        </div>
      )}

      <main className="flex-grow max-w-4xl mx-auto p-8 w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-blue-900">
              Perfil de Votante
            </h2>
            <button
              onClick={isEditing ? handleCancelEdit : handleStartEditing}
              className="px-6 py-3 text-sm font-semibold text-white bg-blue-900 rounded-lg hover:bg-blue-800 transition-colors flex items-center shadow-md"
            >
              <FaPen className="mr-2" />
              {isEditing ? 'Cancelar Edición' : 'Editar Perfil'}
            </button>
          </div>

          {profile && (
            <div className="space-y-8">
              {/* ✅ INFORMACIÓN PERSONAL - MEJOR DISEÑO */}
              <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center">
                  <FaUser className="mr-2" />
                  Información Personal
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <p className="text-xs font-bold text-gray-500 mb-1">Nombre Completo</p>
                      <p className="font-semibold text-gray-800 text-lg">{profile.nombre} {profile.apellido}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <p className="text-xs font-bold text-gray-500 mb-1">Tipo de Documento</p>
                      <p className="font-semibold text-gray-800 text-lg">{profile.tipo_documento}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <p className="text-xs font-bold text-gray-500 mb-1">Estado</p>
                      <p className="font-semibold text-gray-800 text-lg">{profile.estado}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <p className="text-xs font-bold text-gray-500 mb-1">Número de Documento</p>
                      <p className="font-semibold text-gray-800 text-lg">{profile.numero_documento}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <p className="text-xs font-bold text-gray-500 mb-1">Carrera</p>
                      <p className="font-semibold text-gray-800 text-lg">{profile.carrera}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <p className="text-xs font-bold text-gray-500 mb-1">Facultad</p>
                      <p className="font-semibold text-gray-800 text-lg">{profile.facultad}</p>
                    </div>
                  </div>
                </div>
              </div>

              

              {/* ✅ CAMPOS EDITABLES - MEJOR SEPARADOS */}
              <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200">
                <h3 className="text-xl font-bold text-yellow-900 mb-6 flex items-center">
                  <FaEnvelope className="mr-2" />
                  Configuración de Cuenta
                </h3>
                
                <div className="space-y-6">
                  {/* ✅ CORREO ELECTRÓNICO - SEPARADO */}
                  <div className="bg-white p-5 rounded-lg border-2 border-dashed border-blue-300 shadow-sm">
                    <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center">
                      <FaEnvelope className="inline mr-2 text-blue-600" />
                      Correo Electrónico
                    </label>
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full font-semibold text-gray-800 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="Ingresa tu correo electrónico"
                        />
                        <p className="text-xs text-gray-500">Este será tu nuevo correo de contacto</p>
                      </div>
                    ) : (
                      <div>
                        <p className="font-semibold text-gray-800 text-lg bg-gray-50 p-3 rounded-md">{profile.correo}</p>
                        <p className="text-xs text-gray-500 mt-1">Correo actual de tu cuenta</p>
                      </div>
                    )}
                  </div>

                  {isEditing && (
                    <div className="space-y-6">
                      {/* ✅ CONTRASEÑA ACTUAL - SEPARADO */}
                      <div className="bg-white p-5 rounded-lg border-2 border-dashed border-orange-300 shadow-sm">
                        <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center">
                          <FaLock className="inline mr-2 text-orange-600" />
                          Contraseña Actual
                        </label>
                        <div className="space-y-2">
                          <input
                            type="password"
                            name="currentPassword"
                            value={formData.currentPassword}
                            onChange={handleInputChange}
                            className="w-full font-semibold text-gray-800 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                            placeholder="Ingresa tu contraseña actual"
                          />
                          <p className="text-xs text-orange-600 font-medium">Requerida para realizar cualquier cambio</p>
                        </div>
                      </div>

                      {/* ✅ NUEVA CONTRASEÑA - SEPARADO */}
                      <div className="bg-white p-5 rounded-lg border-2 border-dashed border-green-300 shadow-sm">
                        <label className="block text-sm font-bold text-gray-700 mb-3 items-center">
                          <FaLock className="inline mr-2 text-green-600" />
                          Nueva Contraseña
                        </label>
                        <div className="space-y-2">
                          <input
                            type="password"
                            name="newPassword"
                            value={formData.newPassword}
                            onChange={handleInputChange}
                            className="w-full font-semibold text-gray-800 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                            placeholder="Dejar en blanco para no cambiar"
                          />
                          <p className="text-xs text-gray-500">Mínimo 8 caracteres. Campo opcional.</p>
                        </div>
                      </div>

                      {/* ✅ CONFIRMAR CONTRASEÑA - SEPARADO */}
                      <div className="bg-white p-5 rounded-lg border-2 border-dashed border-purple-300 shadow-sm">
                        <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center">
                          <FaLock className="inline mr-2 text-purple-600" />
                          Confirmar Nueva Contraseña
                        </label>
                        <div className="space-y-2">
                          <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            className="w-full font-semibold text-gray-800 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            placeholder="Confirmar nueva contraseña"
                          />
                          <p className="text-xs text-gray-500">Debe coincidir con la nueva contraseña</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {isEditing && (
                  <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
                    <button
                      onClick={handleCancelEdit}
                      className="px-8 py-3 text-sm font-semibold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors shadow-sm flex items-center"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveChanges}
                      className="px-8 py-3 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors flex items-center shadow-md"
                    >
                      <FaSave className="mr-2" />
                      Guardar Cambios
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}