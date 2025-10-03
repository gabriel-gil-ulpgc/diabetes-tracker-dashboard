'use client'

import { useAppAuth } from '@/contexts/AppAuthContext'
import { ReactNode } from 'react'

interface AppRoleGuardProps {
  children: ReactNode
  requiredRole?: string
  requiredPermission?: string
  fallback?: ReactNode
}

export default function AppRoleGuard({ 
  children, 
  requiredRole, 
  requiredPermission, 
  fallback = null 
}: AppRoleGuardProps) {
  const { userRole } = useAppAuth()

  // Si no se especifica rol o permiso, mostrar contenido
  if (!requiredRole && !requiredPermission) {
    return <>{children}</>
  }

  // Verificar rol
  if (requiredRole && userRole !== requiredRole) {
    return <>{fallback}</>
  }

  // Verificar permisos (simplificado para desarrollo)
  if (requiredPermission) {
    const permissions = {
      admin: ['view_users', 'view_data', 'view_analytics', 'view_kubios', 'view_study', 'view_admin'],
      doctor: ['view_data', 'view_analytics', 'view_kubios', 'view_study'],
      user: ['view_data']
    }

    const userPermissions = permissions[userRole as keyof typeof permissions] || []
    
    if (!userPermissions.includes(requiredPermission)) {
      return <>{fallback}</>
    }
  }

  return <>{children}</>
}

