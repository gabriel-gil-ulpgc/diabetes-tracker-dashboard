'use client'

import { ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useAppAuth } from '@/contexts/AppAuthContext'
import { usePermissions } from '@/components/RoleGuard'
import AppRoleGuard from '@/components/AppRoleGuard'

interface HybridRoleGuardProps {
  children: ReactNode
  requiredPermission: string
}

export default function HybridRoleGuard({ children, requiredPermission }: HybridRoleGuardProps) {
  const { user } = useAuth()
  const { user: appUser } = useAppAuth()

  // Si hay un usuario del sistema original, usar RoleGuard original
  if (user) {
    return <RoleGuardWrapper requiredPermission={requiredPermission}>{children}</RoleGuardWrapper>
  }

  // Si hay un usuario de la app, usar AppRoleGuard
  if (appUser) {
    return <AppRoleGuard requiredPermission={requiredPermission}>{children}</AppRoleGuard>
  }

  // Si no hay usuario, no mostrar nada
  return null
}

// Wrapper para usar usePermissions en un componente funcional
function RoleGuardWrapper({ children, requiredPermission }: { children: ReactNode, requiredPermission: string }) {
  const { hasPermission } = usePermissions()
  
  if (hasPermission(requiredPermission)) {
    return <>{children}</>
  }
  
  return null
}
