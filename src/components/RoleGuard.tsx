'use client'

import { ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { UserRole, ROLE_PERMISSIONS } from '@/lib/supabase'
import { Shield, AlertCircle } from 'lucide-react'

interface RoleGuardProps {
  children: ReactNode
  requiredRole?: UserRole
  requiredPermission?: string
  fallback?: ReactNode
  showError?: boolean
}

export default function RoleGuard({ 
  children, 
  requiredRole, 
  requiredPermission, 
  fallback,
  showError = true 
}: RoleGuardProps) {
  const { user, userRole } = useAuth()

  // Debug logging
  console.log('🛡️ RoleGuard - Usuario:', user?.email, 'Rol:', userRole, 'Permiso requerido:', requiredPermission, 'Rol requerido:', requiredRole)

  // Si no hay usuario autenticado
  if (!user) {
    return showError ? (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h2>
          <p className="text-gray-600">Debes iniciar sesión para acceder a esta sección.</p>
        </div>
      </div>
    ) : null
  }

  // Obtener el rol del usuario del contexto (por defecto 'user' si no está definido)
  const currentUserRole: UserRole = userRole || 'user'

  // Verificar rol requerido
  if (requiredRole) {
    const roleHierarchy: Record<UserRole, number> = {
      'user': 1,
      'doctor': 2,
      'admin': 3
    }

    if (roleHierarchy[currentUserRole] < roleHierarchy[requiredRole]) {
      return showError ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Shield className="h-16 w-16 text-orange-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Permisos Insuficientes</h2>
            <p className="text-gray-600 mb-4">
              Necesitas el rol <span className="font-semibold text-blue-600">{requiredRole}</span> para acceder a esta sección.
            </p>
            <p className="text-sm text-gray-500">
              Tu rol actual: <span className="font-semibold">{currentUserRole}</span>
            </p>
          </div>
        </div>
      ) : fallback || null
    }
  }

  // Verificar permiso específico
  if (requiredPermission) {
    const userPermissions = ROLE_PERMISSIONS[currentUserRole] || []
    
    if (!userPermissions.includes(requiredPermission as any)) {
      return showError ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Shield className="h-16 w-16 text-orange-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Permiso Denegado</h2>
            <p className="text-gray-600 mb-4">
              No tienes permisos para realizar esta acción.
            </p>
            <p className="text-sm text-gray-500">
              Permiso requerido: <span className="font-semibold">{requiredPermission}</span>
            </p>
          </div>
        </div>
      ) : fallback || null
    }
  }

  // Si pasa todas las verificaciones, mostrar el contenido
  return <>{children}</>
}

// Hook para verificar permisos
export function usePermissions() {
  const { user, userRole } = useAuth()
  const currentUserRole: UserRole = userRole || 'user'
  const permissions = ROLE_PERMISSIONS[currentUserRole] || []

  const hasPermission = (permission: string) => {
    return permissions.includes(permission as any)
  }

  const hasRole = (role: UserRole) => {
    const roleHierarchy: Record<UserRole, number> = {
      'user': 1,
      'doctor': 2,
      'admin': 3
    }
    return roleHierarchy[currentUserRole] >= roleHierarchy[role]
  }

  const canAccess = (requiredRole?: UserRole, requiredPermission?: string) => {
    if (requiredRole && !hasRole(requiredRole)) return false
    if (requiredPermission && !hasPermission(requiredPermission)) return false
    return true
  }

  return {
    userRole: currentUserRole,
    permissions,
    hasPermission,
    hasRole,
    canAccess
  }
}
