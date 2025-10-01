'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useAppAuth } from '@/contexts/AppAuthContext'

interface HybridProtectedRouteProps {
  children: React.ReactNode
}

export default function HybridProtectedRoute({ children }: HybridProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth()
  const { user: appUser, loading: appAuthLoading } = useAppAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Esperar a que ambos sistemas de autenticación terminen de cargar
    if (!authLoading && !appAuthLoading) {
      // Si no hay usuario en ningún sistema, redirigir al login
      if (!user && !appUser) {
        router.push('/login')
      } else {
        setIsLoading(false)
      }
    }
  }, [user, appUser, authLoading, appAuthLoading, router])

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading || authLoading || appAuthLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    )
  }

  // Si no hay usuario autenticado en ningún sistema, no renderizar nada
  if (!user && !appUser) {
    return null
  }

  return <>{children}</>
}
