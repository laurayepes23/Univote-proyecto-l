import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import NavbarCandidato from '../components/NavbarCandidato'
import Footer from '../components/Footer'
import axios from 'axios'
import {
  FaEnvelope,
  FaPen,
  FaCamera,
  FaSave,
  FaTrash,
  FaUpload,
  FaLock,
  FaSignOutAlt,
  FaVoteYea,
  FaUser,
  FaIdCard,
  FaUniversity
} from 'react-icons/fa'

const API_BASE_URL = 'http://localhost:3000'

export default function MiPerfilCandidato() {
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
  const [photoUploading, setPhotoUploading] = useState(false)
  const [photoError, setPhotoError] = useState('')
  const [withdrawConfirm, setWithdrawConfirm] = useState(false)
  const [withdrawPassword, setWithdrawPassword] = useState('')

  // ✅ FUNCIÓN PARA CARGAR EL PERFIL
  const loadCandidateProfile = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      setPhotoError('')

      const candidateId = localStorage.getItem('candidateId')
      const userRole = localStorage.getItem('userRole')

      if (userRole !== 'candidate' || !candidateId) {
        setError('No tienes permisos para acceder a esta página. Debes iniciar sesión como candidato.')
        setLoading(false)
        return
      }

      const response = await axios.get(`${API_BASE_URL}/candidates/${candidateId}`)
      const candidateData = response.data

      let fotoUrl = '/img/default-avatar.png'
      if (candidateData.foto_candidate) {
        if (candidateData.foto_candidate.startsWith('http')) {
          fotoUrl = candidateData.foto_candidate
        } 
        else if (candidateData.foto_candidate.startsWith('/')) {
          fotoUrl = `${API_BASE_URL}${candidateData.foto_candidate}`
        }
        else {
          fotoUrl = `${API_BASE_URL}/uploads/candidatos/${candidateData.foto_candidate}`
        }
        fotoUrl += `?t=${Date.now()}`
      }

      const profileData = {
        id_candidato: candidateData.id_candidate,
        nombre: candidateData.nombre_candidate,
        apellido: candidateData.apellido_candidate,
        tipo_documento: candidateData.tipo_doc_candidate,
        numero_documento: candidateData.num_doc_candidate,
        correo: candidateData.correo_candidate,
        estado: candidateData.estado_candidate,
        foto: fotoUrl,
        foto_original: candidateData.foto_candidate,
        eleccion: candidateData.election?.nombre_election || 'No postulado',
        id_eleccion: candidateData.election?.id_election || null,
      }

      setProfile(profileData)
      setFormData({
        email: profileData.correo,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      localStorage.setItem('candidateData', JSON.stringify(candidateData))
      
    } catch (err) {
      console.error('❌ Error loading candidate profile:', err)
      setError('Error al cargar el perfil: ' + (err.response?.data?.message || err.message))
      loadFromLocalStorage()
    } finally {
      setLoading(false)
    }
  }, [])

  // ✅ FUNCIÓN PARA CARGAR DESDE LOCALSTORAGE
  const loadFromLocalStorage = () => {
    try {
      const candidateData = localStorage.getItem('candidateData')
      if (candidateData) {
        const parsedData = JSON.parse(candidateData)
        const profileData = {
          id_candidato: parsedData.id_candidate,
          nombre: parsedData.nombre_candidate,
          apellido: parsedData.apellido_candidate,
          tipo_documento: parsedData.tipo_doc_candidate,
          numero_documento: parsedData.num_doc_candidate,
          correo: parsedData.correo_candidate,
          estado: parsedData.estado_candidate,
          foto: parsedData.foto_candidate ? 
                `${API_BASE_URL}${parsedData.foto_candidate}?t=${Date.now()}` : 
                '/img/default-avatar.png',
          eleccion: parsedData.election?.nombre_election || 'No postulado',
          id_eleccion: parsedData.election?.id_election || null,
        }
        setProfile(profileData)
        setFormData({
          email: profileData.correo,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
        setError('')
      } else {
        setError('No se encontraron datos del candidato. Por favor, inicia sesión nuevamente.')
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
      const candidateId = localStorage.getItem('candidateId')
      
      const response = await axios.post(`${API_BASE_URL}/candidates/validate-password`, {
        candidateId: parseInt(candidateId),
        password: formData.currentPassword
      })

      return response.data.valid
    } catch (error) {
      console.error('Error validando contraseña:', error)
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
      
      const candidateId = localStorage.getItem('candidateId')
      
      if (!candidateId) {
        setError('Error: No se encontró el ID del candidato')
        return
      }

      if (!await validateForm()) {
        return
      }

      // ✅ PREPARAR DATOS CON LOS NOMBRES EXACTOS QUE ESPERA EL DTO
      const updateData = {}

      // Solo enviar correo si cambió
      if (formData.email.trim() !== profile.correo) {
        updateData.correo_candidate = formData.email.trim()
      }

      // Solo enviar contraseña si se proporcionó una nueva
      if (formData.newPassword) {
        updateData.contrasena_candidate = formData.newPassword
      }

      // Verificar si hay cambios reales
      const hasEmailChanged = formData.email.trim() !== profile.correo
      const hasPasswordChanged = formData.newPassword.length > 0

      if (!hasEmailChanged && !hasPasswordChanged) {
        setError('No hay cambios que guardar')
        return
      }

      console.log('📤 Enviando actualización:', updateData)

      // ✅ ENVIAR SOLO SI HAY DATOS PARA ACTUALIZAR
      if (Object.keys(updateData).length === 0) {
        setError('No hay cambios que guardar')
        return
      }

      const response = await axios.patch(
        `${API_BASE_URL}/candidates/${candidateId}`,
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
      const updatedCandidateData = {
        ...JSON.parse(localStorage.getItem('candidateData') || '{}'),
        correo_candidate: formData.email.trim()
      }
      localStorage.setItem('candidateData', JSON.stringify(updatedCandidateData))
      
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

  // ✅ FUNCIÓN PARA RETIRARSE DE ELECCIÓN
  const handleWithdrawFromElection = async () => {
    try {
      setError('')
      
      if (!withdrawPassword) {
        setError('Debes ingresar tu contraseña para confirmar el retiro')
        return
      }

      const candidateId = localStorage.getItem('candidateId')
      
      // Validar contraseña
      const response = await axios.post(`${API_BASE_URL}/candidates/validate-password`, {
        candidateId: parseInt(candidateId),
        password: withdrawPassword
      })

      if (!response.data.valid) {
        setError('La contraseña es incorrecta')
        return
      }

      // Realizar el retiro de la elección
      const withdrawResponse = await axios.patch(
        `${API_BASE_URL}/candidates/${candidateId}/withdraw-election`
      )

      console.log('✅ Retiro exitoso:', withdrawResponse.data)

      setSuccess('¡Te has retirado exitosamente de la elección!')
      setWithdrawConfirm(false)
      setWithdrawPassword('')
      
      // Recargar perfil para actualizar datos
      loadCandidateProfile()
      
      setTimeout(() => setSuccess(''), 3000)
      
    } catch (error) {
      console.error('❌ Error retirándose de elección:', error)
      
      let errorMessage = 'Error al retirarse de la elección'
      
      if (error.response?.data) {
        const errorData = error.response.data
        errorMessage = errorData.message || errorData.error || errorMessage
      }
      
      setError(errorMessage)
    }
  }

  // ✅ RESTANTE DE LAS FUNCIONES (manejo de fotos)
  const handlePhotoUpload = async (file) => {
    try {
      setPhotoUploading(true)
      setPhotoError('')

      const candidateId = localStorage.getItem('candidateId')
      
      if (!candidateId) {
        setPhotoError('No se encontró el ID del candidato')
        return
      }

      const validTypes = ['image/jpeg', 'image/jpg', 'image/png']
      const maxSize = 5 * 1024 * 1024

      if (!validTypes.includes(file.type)) {
        setPhotoError('Solo se permiten imágenes JPG, JPEG o PNG')
        return
      }

      if (file.size > maxSize) {
        setPhotoError('La imagen no debe superar los 5MB')
        return
      }

      const formData = new FormData()
      formData.append('photo', file)

      const response = await axios.post(
        `${API_BASE_URL}/candidates/${candidateId}/photo`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      )

      const newPhotoUrl = `${API_BASE_URL}${response.data.foto_candidate}?t=${Date.now()}`
      
      setProfile(prev => ({
        ...prev,
        foto: newPhotoUrl,
        foto_original: response.data.foto_candidate
      }))

      const updatedCandidateData = {
        ...JSON.parse(localStorage.getItem('candidateData') || '{}'),
        foto_candidate: response.data.foto_candidate
      }
      localStorage.setItem('candidateData', JSON.stringify(updatedCandidateData))

      setPhotoError('')
      alert('¡Foto actualizada exitosamente!')

    } catch (error) {
      console.error('❌ Error subiendo foto:', error)
      const errorMessage = error.response?.data?.message || 'Error al subir la foto'
      setPhotoError(errorMessage)
      alert('Error al subir la foto: ' + errorMessage)
    } finally {
      setPhotoUploading(false)
    }
  }

  const handleDeletePhoto = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar tu foto de perfil?')) {
      return
    }

    try {
      setPhotoUploading(true)
      const candidateId = localStorage.getItem('candidateId')

      if (!candidateId) {
        setPhotoError('No se encontró el ID del candidato')
        return
      }

      await axios.delete(`${API_BASE_URL}/candidates/${candidateId}/photo`)

      setProfile(prev => ({
        ...prev,
        foto: '/img/default-avatar.png',
        foto_original: null
      }))

      const updatedCandidateData = {
        ...JSON.parse(localStorage.getItem('candidateData') || '{}'),
        foto_candidate: null
      }
      localStorage.setItem('candidateData', JSON.stringify(updatedCandidateData))

      setPhotoError('')
      alert('Foto eliminada exitosamente')

    } catch (error) {
      console.error('❌ Error eliminando foto:', error)
      const errorMessage = error.response?.data?.message || 'Error al eliminar la foto'
      setPhotoError(errorMessage)
      alert('Error al eliminar la foto: ' + errorMessage)
    } finally {
      setPhotoUploading(false)
    }
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const previewUrl = URL.createObjectURL(file)
      setProfile(prev => ({ ...prev, foto: previewUrl }))
      handlePhotoUpload(file)
      e.target.value = ''
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
    loadCandidateProfile()
  }, [loadCandidateProfile])

  const handleRetry = () => {
    setError('')
    setLoading(true)
    loadCandidateProfile()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-blue-50 text-gray-800">
        <NavbarCandidato />
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
        <NavbarCandidato />
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
      <NavbarCandidato />
      <div className="h-20"></div>

      {success && (
        <div className="max-w-4xl mx-auto w-full px-8 mt-10" >
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
              Perfil de Candidato
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
              {/* ✅ SECCIÓN FOTO E INFORMACIÓN BÁSICA */}
              <div className="flex flex-col lg:flex-row items-start gap-8">
                {/* Sección de la foto */}
                <div className="flex flex-col items-center lg:items-start">
                  <div className="relative w-48 h-48 rounded-full overflow-hidden mb-4 border-4 border-blue-200 shadow-lg">
                    <img 
                      src={profile.foto} 
                      alt="Foto de Perfil" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = '/img/default-avatar.png'
                      }}
                    />
                    
                    {!photoUploading && (
                      <label htmlFor="photo-upload" className="absolute inset-0 bg-black bg-opacity-40 flex flex-col items-center justify-center cursor-pointer opacity-0 hover:opacity-100 transition-opacity">
                        <FaCamera className="text-white text-2xl mb-1" />
                        <span className="text-white text-xs text-center px-2">Cambiar foto</span>
                      </label>
                    )}

                    {photoUploading && (
                      <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                      </div>
                    )}
                  </div>

                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handlePhotoChange}
                    className="hidden"
                    disabled={photoUploading}
                  />

                  <div className="flex flex-col space-y-3 w-full max-w-xs">
                    <button
                      onClick={() => document.getElementById('photo-upload').click()}
                      disabled={photoUploading}
                      className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center disabled:opacity-50 shadow-sm"
                    >
                      <FaUpload className="mr-2" />
                      {photoUploading ? 'Subiendo...' : 'Nueva Foto'}
                    </button>

                    {profile.foto_original && profile.foto !== '/img/default-avatar.png' && (
                      <button
                        onClick={handleDeletePhoto}
                        disabled={photoUploading}
                        className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center disabled:opacity-50 shadow-sm"
                      >
                        <FaTrash className="mr-2" />
                        Eliminar Foto
                      </button>
                    )}
                  </div>

                  {photoError && (
                    <p className="text-red-500 text-sm mt-3 text-center max-w-xs">
                      {photoError}
                    </p>
                  )}
                </div>

                {/* ✅ INFORMACIÓN PERSONAL - MEJOR DISEÑO */}
                <div className="flex-grow bg-blue-50 p-6 rounded-xl border border-blue-200">
                  <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center">
                    <FaUser className="mr-2" />
                    Información Personal
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <p className="text-xs font-bold text-gray-500 mb-1">Nombre Completo</p>
                      <p className="font-semibold text-gray-800 text-lg">{profile.nombre} {profile.apellido}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <p className="text-xs font-bold text-gray-500 mb-1">Tipo de Documento</p>
                      <p className="font-semibold text-gray-800 text-lg">{profile.tipo_documento}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <p className="text-xs font-bold text-gray-500 mb-1">Número de Documento</p>
                      <p className="font-semibold text-gray-800 text-lg">{profile.numero_documento}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <p className="text-xs font-bold text-gray-500 mb-1">Estado</p>
                      <p className="font-semibold text-gray-800 text-lg">{profile.estado}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ✅ INFORMACIÓN ELECTORAL */}
              <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                <h3 className="text-xl font-bold text-green-900 mb-4 flex items-center">
                  <FaVoteYea className="mr-2" />
                  Información Electoral
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center mb-3">
                      <FaUniversity className="text-green-600 mr-2 text-lg" />
                      <p className="text-sm font-bold text-gray-500">Elección</p>
                    </div>
                    <p className="font-semibold text-gray-800 text-lg">{profile.eleccion}</p>
                  </div>
                  <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center mb-3">
                      <FaIdCard className="text-blue-600 mr-2 text-lg" />
                      <p className="text-sm font-bold text-gray-500">Estado Electoral</p>
                    </div>
                    <p className="font-semibold text-gray-800 text-lg">{profile.estado}</p>
                  </div>
                </div>

                {/* Botón para retirarse de elección */}
                {profile.id_eleccion && (
                  <div className="mt-6 bg-yellow-50 p-5 rounded-lg border border-yellow-200">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <p className="text-sm font-semibold text-yellow-800">
                          Estás postulado a una elección
                        </p>
                        <p className="text-xs text-yellow-600 mt-1">
                          Si deseas retirarte, haz clic en el botón
                        </p>
                      </div>
                      <button
                        onClick={() => setWithdrawConfirm(true)}
                        className="px-6 py-3 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors flex items-center shadow-sm"
                      >
                        <FaSignOutAlt className="mr-2" />
                        Retirarse de Elección
                      </button>
                    </div>
                  </div>
                )}
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
                        <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center">
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

      {/* Modal de confirmación para retirarse de elección */}
      {withdrawConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-red-600 mb-4">
              Confirmar Retiro de Elección
            </h3>
            <p className="text-gray-600 mb-4">
              ¿Estás seguro de que deseas retirarte de la elección "{profile.eleccion}"? 
              Esta acción no se puede deshacer.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Confirma tu contraseña:
              </label>
              <input
                type="password"
                value={withdrawPassword}
                onChange={(e) => setWithdrawPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Ingresa tu contraseña"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setWithdrawConfirm(false)
                  setWithdrawPassword('')
                }}
                className="px-6 py-3 text-sm font-semibold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleWithdrawFromElection}
                className="px-6 py-3 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors flex items-center"
              >
                <FaSignOutAlt className="mr-2" />
                Confirmar Retiro
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}