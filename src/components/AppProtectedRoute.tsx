'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppAuth } from '@/contexts/AppAuthContext'
import { Shield, AlertCircle } from 'lucide-react'

interface AppProtectedRouteProps {
  children: React.ReactNode
}

export default function AppProtectedRoute({ children }: AppProtectedRouteProps) {
  const { user, loading } = useAppAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/app-login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h2>
          <p className="text-gray-600">Debes iniciar sesión para acceder a esta sección.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
