import React, { useState, useEffect } from "react";
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Navbar from "../components/Navbar";

export default function RegistroCandidato() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        nombre_candidate: "",
        apellido_candidate: "",
        tipo_doc_candidate: "",
        num_doc_candidate: "",
        correo_candidate: "",
        contrasena_candidate: "",
        estado_candidate: "Activo",
        id_role: 3, 
        id_career: "",
        id_election: "",
    });
    const [fotoFile, setFotoFile] = useState(null);
    const [careers, setCareers] = useState([]);
    const [elections, setElections] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        const fetchRelations = async () => {
            try {
                const [careersResponse, electionsResponse] = await Promise.all([
                    api.get('/careers'),
                    api.get('/elections')
                ]);
                setCareers(careersResponse.data);
                
                const eleccionesProgramadas = electionsResponse.data.filter(
                    election => election.estado_election === "Programada"
                );
                setElections(eleccionesProgramadas);
            } catch (error) {
                console.error("Error al obtener datos:", error);
                setError("Error al cargar datos. Intenta recargar la página.");
            }
        };
        fetchRelations();
    }, []);

    const capitalizeFirstLetter = (str) => {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    };

    const validateEmail = (email) => {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        const commonDomains = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'edu.co', 'university.edu', 'college.edu'];
        
        if (!emailRegex.test(email)) {
            return "Formato de correo inválido";
        }
        
        const domain = email.split('@')[1].toLowerCase();
        if (!commonDomains.some(commonDomain => domain.includes(commonDomain))) {
            return "Debe usar un dominio de correo válido (gmail.com, hotmail.com, etc.)";
        }
        
        return null;
    };

    const validatePassword = (password) => {
        const errors = [];
        
        if (password.length < 8) {
            errors.push("Mínimo 8 caracteres");
        }
        
        if (!/(?=.*[a-z])/.test(password)) {
            errors.push("Al menos una minúscula");
        }
        
        if (!/(?=.*[A-Z])/.test(password)) {
            errors.push("Al menos una mayúscula");
        }
        
        if (!/(?=.*\d)/.test(password)) {
            errors.push("Al menos un número");
        }
        
        if (!/(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/.test(password)) {
            errors.push("Al menos un carácter especial");
        }
        
        return errors.length > 0 ? errors.join(", ") : null;
    };

    const validateDocumentNumber = (docNumber) => {
        if (!docNumber || docNumber.length < 10) {
            return "El documento debe tener mínimo 10 dígitos";
        }
        
        if (!/^\d+$/.test(docNumber)) {
            return "Solo se permiten números";
        }
        
        return null;
    };

    const validateName = (name, fieldName) => {
        if (!name.trim()) {
            return `El ${fieldName} es requerido`;
        }
        
        if (!/^[A-Za-zÁáÉéÍíÓóÚúÑñ\s]+$/.test(name)) {
            return `El ${fieldName} solo puede contener letras y espacios`;
        }
        
        if (name.length < 2) {
            return `El ${fieldName} debe tener mínimo 2 caracteres`;
        }
        
        return null;
    };

    const validateFile = (file) => {
        if (!file) return null;
        
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        const maxSize = 5 * 1024 * 1024; // 5MB
        
        if (!validTypes.includes(file.type)) {
            return "Solo se permiten archivos JPG, JPEG o PNG";
        }
        
        if (file.size > maxSize) {
            return "El archivo no debe superar los 5MB";
        }
        
        return null;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        let processedValue = value;

        if (name === 'nombre_candidate' || name === 'apellido_candidate') {
            processedValue = capitalizeFirstLetter(value);
        }
        
        if (name === 'correo_candidate') {
            processedValue = value.toLowerCase();
        }

        setFormData({ ...formData, [name]: processedValue });
        validateField(name, processedValue);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        
        if (file) {
            setFotoFile(file);
        } else {
            setFotoFile(null);
        }
        
        const fileError = validateFile(file);
        setFieldErrors(prev => ({
            ...prev,
            foto_candidate: fileError
        }));
    };

    const validateField = (fieldName, value) => {
        const errors = { ...fieldErrors };
        
        switch (fieldName) {
            case 'nombre_candidate':
                errors.nombre_candidate = validateName(value, 'nombre');
                break;
            case 'apellido_candidate':
                errors.apellido_candidate = validateName(value, 'apellido');
                break;
            case 'tipo_doc_candidate':
                errors.tipo_doc_candidate = !value ? "El tipo de documento es requerido" : null;
                break;
            case 'num_doc_candidate':
                errors.num_doc_candidate = validateDocumentNumber(value);
                break;
            case 'correo_candidate':
                errors.correo_candidate = validateEmail(value);
                break;
            case 'contrasena_candidate':
                errors.contrasena_candidate = validatePassword(value);
                break;
            case 'id_career':
                errors.id_career = !value ? "La carrera es requerida" : null;
                break;
            default:
                break;
        }

        setFieldErrors(errors);
    };

    const validateForm = () => {
        const errors = {};
        
        errors.nombre_candidate = validateName(formData.nombre_candidate, 'nombre');
        errors.apellido_candidate = validateName(formData.apellido_candidate, 'apellido');
        errors.tipo_doc_candidate = !formData.tipo_doc_candidate ? "El tipo de documento es requerido" : null;
        errors.num_doc_candidate = validateDocumentNumber(formData.num_doc_candidate);
        errors.correo_candidate = validateEmail(formData.correo_candidate);
        errors.contrasena_candidate = validatePassword(formData.contrasena_candidate);
        errors.id_career = !formData.id_career ? "La carrera es requerida" : null;
        errors.foto_candidate = validateFile(fotoFile);

        setFieldErrors(errors);
        
        return !Object.values(errors).some(error => error !== null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setUploading(true);

        if (!validateForm()) {
            setError("Por favor, corrige los errores en el formulario.");
            setUploading(false);
            return;
        }

        try {
            const formPayload = new FormData();
            
            // Agregar todos los campos del formulario
            Object.keys(formData).forEach(key => {
                const value = formData[key];
                if (value !== "") {
                    if (key === 'num_doc_candidate' || key === 'id_career' || key === 'id_election') {
                        formPayload.append(key, Number(value));
                    } else {
                        formPayload.append(key, String(value));
                    }
                }
            });

            // Validación adicional para campos requeridos
            if (!formData.nombre_candidate || !formData.apellido_candidate || !formData.correo_candidate) {
                throw new Error('Faltan campos requeridos');
            }

            if (fotoFile) {
                formPayload.append("foto_candidate", fotoFile);
            }
            
            console.log("Datos del formulario a enviar:");
            console.log("Todos los datos:", Object.fromEntries(formPayload));
            
            // No necesitamos especificar Content-Type para FormData
            const response = await api.post('/candidates/register', formPayload);
            
            console.log("Registro exitoso:", response.data);
            setSuccess("¡Registro exitoso! Serás redirigido al login.");

            setTimeout(() => {
                navigate('/login');
            }, 2000);

        } catch (error) {
            console.error("Error completo:", error);
            let errorMessage;
            
            if (error.response?.status === 409) {
                errorMessage = "Este correo electrónico ya está registrado.";
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            } else {
                errorMessage = "Error en el registro. Por favor, inténtalo de nuevo.";
            }
            
            console.error("Hubo un error al registrar el candidato:", errorMessage);
            setError(errorMessage);
        } finally {
            setUploading(false);
        }
    };

    const getInputClassName = (fieldName) => {
        const baseClass = "mt-1 block w-full border rounded-md shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm";
        
        if (fieldErrors[fieldName]) {
            return `${baseClass} border-red-500 bg-red-50`;
        }
        
        return `${baseClass} border-gray-300`;
    };

    const isFormValid = () => {
        const requiredFields = [
            'nombre_candidate',
            'apellido_candidate', 
            'tipo_doc_candidate',
            'num_doc_candidate',
            'correo_candidate',
            'contrasena_candidate',
            'id_career'
        ];

        const hasEmptyFields = requiredFields.some(field => !formData[field]);
        const hasErrors = Object.values(fieldErrors).some(error => error !== null);

        return !hasEmptyFields && !hasErrors;
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-white py-8 ">
            <Navbar/>
            <div className="bg-white shadow-2xl rounded-2xl p-8 w-full max-w-7xl mx-4 border border-gray-200 mt-20">
                <div className="flex flex-col lg:flex-row items-start justify-between gap-8">
                    <div className="w-full lg:w-1/4 flex flex-col items-center justify-center pt-20 lg:pt-34">
                        <Link to="/">
                            <div className="flex justify-center mb-4">
                                <img
                                    src="/img/logo.png"
                                    alt="Logo"
                                    className="w-28 h-28 object-contain"
                                />
                            </div>
                        </Link>

                        <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
                            Registro de Candidato
                        </h2>
                        <p className="text-center text-gray-600 text-sm mb-4">
                            Completa tus datos para postularte
                        </p>
                    </div>

                    <div className="w-full lg:w-3/4 bg-white p-6 rounded-xl shadow-md border border-gray-200">
                        {error && (
                            <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-sm text-center">
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="bg-green-100 text-green-700 p-3 rounded-md mb-4 text-sm text-center">
                                {success}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Nombre</label>
                                    <input
                                        type="text"
                                        name="nombre_candidate"
                                        value={formData.nombre_candidate}
                                        onChange={handleChange}
                                        required
                                        className={getInputClassName('nombre_candidate')}
                                        placeholder="Ej: Carlos"
                                    />
                                    {fieldErrors.nombre_candidate && (
                                        <p className="text-red-500 text-xs mt-1">{fieldErrors.nombre_candidate}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Apellido</label>
                                    <input
                                        type="text"
                                        name="apellido_candidate"
                                        value={formData.apellido_candidate}
                                        onChange={handleChange}
                                        required
                                        className={getInputClassName('apellido_candidate')}
                                        placeholder="Ej: Rodríguez"
                                    />
                                    {fieldErrors.apellido_candidate && (
                                        <p className="text-red-500 text-xs mt-1">{fieldErrors.apellido_candidate}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Tipo de Documento</label>
                                    <select
                                        name="tipo_doc_candidate"
                                        value={formData.tipo_doc_candidate}
                                        onChange={handleChange}
                                        required
                                        className={getInputClassName('tipo_doc_candidate')}
                                    >
                                        <option value="">Seleccione</option>
                                        <option value="CC">Cédula de Ciudadanía</option>
                                        <option value="TI">Tarjeta de Identidad</option>
                                        <option value="CE">Cédula de Extranjería</option>
                                    </select>
                                    {fieldErrors.tipo_doc_candidate && (
                                        <p className="text-red-500 text-xs mt-1">{fieldErrors.tipo_doc_candidate}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Número de Documento</label>
                                    <input
                                        type="number"
                                        name="num_doc_candidate"
                                        value={formData.num_doc_candidate}
                                        onChange={handleChange}
                                        required
                                        className={getInputClassName('num_doc_candidate')}
                                        placeholder="Mínimo 10 dígitos"
                                    />
                                    {fieldErrors.num_doc_candidate && (
                                        <p className="text-red-500 text-xs mt-1">{fieldErrors.num_doc_candidate}</p>
                                    )}
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Correo Institucional</label>
                                    <input
                                        type="email"
                                        name="correo_candidate"
                                        value={formData.correo_candidate}
                                        onChange={handleChange}
                                        required
                                        className={getInputClassName('correo_candidate')}
                                        placeholder="ejemplo@gmail.com"
                                    />
                                    {fieldErrors.correo_candidate && (
                                        <p className="text-red-500 text-xs mt-1">{fieldErrors.correo_candidate}</p>
                                    )}
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Contraseña</label>
                                    <input
                                        type="password"
                                        name="contrasena_candidate"
                                        value={formData.contrasena_candidate}
                                        onChange={handleChange}
                                        required
                                        className={getInputClassName('contrasena_candidate')}
                                        placeholder="Mínimo 8 caracteres con mayúscula, minúscula, número y carácter especial"
                                    />
                                    {fieldErrors.contrasena_candidate && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {fieldErrors.contrasena_candidate}
                                        </p>
                                    )}
                                    <p className="text-gray-500 text-xs mt-1">
                                        La contraseña debe tener: mínimo 8 caracteres, al menos una mayúscula, una minúscula, un número y un carácter especial.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Carrera</label>
                                    <select
                                        name="id_career"
                                        value={formData.id_career}
                                        onChange={handleChange}
                                        required
                                        className={getInputClassName('id_career')}
                                    >
                                        <option value="">Seleccione una carrera</option>
                                        {careers.map((career) => (
                                            <option key={career.id_career} value={career.id_career}>
                                                {career.nombre_career}
                                            </option>
                                        ))}
                                    </select>
                                    {fieldErrors.id_career && (
                                        <p className="text-red-500 text-xs mt-1">{fieldErrors.id_career}</p>
                                    )}
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Elección a la que se postula (Opcional)</label>
                                    <select
                                        name="id_election"
                                        value={formData.id_election}
                                        onChange={handleChange}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm"
                                    >
                                        <option value="">Seleccione una elección</option>
                                        {elections.length > 0 ? (
                                            elections.map((election) => (
                                                <option key={election.id_election} value={election.id_election}>
                                                    {election.nombre_election} - {election.estado_election}
                                                </option>
                                            ))
                                        ) : (
                                            <option value="" disabled>
                                                No hay elecciones programadas disponibles
                                            </option>
                                        )}
                                    </select>
                                    <p className="text-gray-500 text-xs mt-1">
                                        Solo se muestran elecciones en estado "Programada"
                                    </p>
                                </div>

                                <div className="md:col-span-3">
                                    <label className="block text-sm font-medium text-gray-700">Foto (Opcional)</label>
                                    <input
                                        type="file"
                                        name="foto_candidate"
                                        onChange={handleFileChange}
                                        className={getInputClassName('foto_candidate')}
                                        accept=".jpg,.jpeg,.png"
                                        disabled={uploading}
                                    />
                                    {fieldErrors.foto_candidate && (
                                        <p className="text-red-500 text-xs mt-1">{fieldErrors.foto_candidate}</p>
                                    )}
                                    <p className="text-gray-500 text-xs mt-1">
                                        Formatos permitidos: JPG, JPEG, PNG. Tamaño máximo: 5MB
                                    </p>
                                    {fotoFile && (
                                        <p className="text-blue-600 text-xs mt-1">
                                            Archivo seleccionado: <strong>{fotoFile.name}</strong>
                                            <br />
                                            <span className="text-green-600">
                                                La imagen se convertirá automáticamente a formato WebP y se optimizará
                                            </span>
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-4 pt-2">
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-900 text-white py-3 rounded-md font-semibold hover:bg-blue-800 transition shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
                                    disabled={!isFormValid() || uploading}
                                >
                                    {uploading ? (
                                        <span className="flex items-center justify-center">
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Procesando...
                                        </span>
                                    ) : (
                                        'Registrar Candidato'
                                    )}
                                </button>
                            </div>
                        </form>

                        <p className="text-center text-sm mt-6 text-gray-600">
                            ¿Ya tienes cuenta?{" "}
                            <Link to="/login" className="text-blue-600 hover:underline font-medium">
                                Inicia sesión
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}