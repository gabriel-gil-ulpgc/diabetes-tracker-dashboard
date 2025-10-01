// Configuración centralizada para URLs del backend
export const config = {
  // Cambiar esta URL cuando hagas despliegue
  backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000',
  
  // URLs específicas para diferentes entornos
  urls: {
    // Desarrollo local
    local: 'http://localhost:3000',
    // Producción (Vercel)
    production: 'https://diabetes-tracker-backend.vercel.app',
    // Staging (si tienes)
    staging: 'https://diabetes-tracker-backend-staging.vercel.app'
  },
  
  // Endpoints específicos
  endpoints: {
    decrypt: '/decrypt',
    auth: {
      register: '/auth/register',
      login: '/auth/login',
      logout: '/auth/logout',
      verify: '/auth/verify',
      migrate: '/auth/migrate'
    },
    data: {
      allData: '/allData',
      deleteAllData: '/deleteAllData',
      deleteInsulinRecord: '/deleteInsulinRecord',
      deleteFoodRecord: '/deleteFoodRecord',
      deleteExerciseRecord: '/deleteExerciseRecord',
      deletePeriodRecord: '/deletePeriodRecord',
      deleteMoodRecord: '/deleteMoodRecord'
    }
  }
}

// Función helper para obtener la URL completa de un endpoint
export const getBackendUrl = (endpoint: string = '') => {
  return `${config.backendUrl}${endpoint}`
}

// Función para cambiar el entorno
export const setEnvironment = (env: 'local' | 'production' | 'staging') => {
  config.backendUrl = config.urls[env]
}

// Función para obtener la URL actual
export const getCurrentBackendUrl = () => {
  return config.backendUrl
}
