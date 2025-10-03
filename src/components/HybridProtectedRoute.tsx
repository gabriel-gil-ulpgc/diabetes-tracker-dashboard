'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useAppAuth } from '@/contexts/AppAuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface HybridProtectedRouteProps {
  children: React.ReactNode
}

export default function HybridProtectedRoute({ children }: HybridProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth()
  const { user: appUser, loading: appAuthLoading } = useAppAuth()
  const router = useRouter()

  useEffect(() => {
    // Si no hay carga en curso y no hay usuario autenticado en ningún sistema
    if (!authLoading && !appAuthLoading && !user && !appUser) {
      router.push('/login')
    }
  }, [user, appUser, authLoading, appAuthLoading, router])

  // Mostrar loading mientras se verifica la autenticación
  if (authLoading || appAuthLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    )
  }

  // Si no hay usuario autenticado, no renderizar nada (el useEffect se encargará del redirect)
  if (!user && !appUser) {
    return null
  }

  return <>{children}</>
}

