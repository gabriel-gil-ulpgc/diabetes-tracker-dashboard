'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, UserRole } from '@/lib/supabase'

interface AppUser {
  UserID: number
  Username: string
  role: UserRole
}

interface AppAuthContextType {
  user: AppUser | null
  loading: boolean
  signIn: (username: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  userRole: UserRole | null
}

const AppAuthContext = createContext<AppAuthContextType | undefined>(undefined)

export function AppAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<UserRole | null>(null)

  // Función para verificar la contraseña (simplificada para desarrollo)
  const verifyPassword = async (username: string, password: string): Promise<{ isValid: boolean, userData?: any }> => {
    try {
      console.log('🔐 Verificando credenciales para:', username)
      
      // Buscar el usuario en la tabla users
      const { data, error } = await supabase
        .from('users')
        .select('UserID, Username, PasswordHash, role')
        .eq('Username', username)
        .single()
      
      if (error || !data) {
        console.log('❌ Usuario no encontrado:', username)
        return { isValid: false }
      }
      
      console.log('✅ Usuario encontrado:', data.Username, 'Rol:', data.role)
      
      // Para desarrollo: aceptar cualquier contraseña que no esté vacía
      // En producción, aquí verificarías el hash real
      if (password.length > 0) {
        return { isValid: true, userData: data }
      } else {
        console.log('❌ Contraseña vacía')
        return { isValid: false }
      }
    } catch (error) {
      console.error('Error verifying password:', error)
      return { isValid: false }
    }
  }

  const signIn = async (username: string, password: string) => {
    try {
      setLoading(true)
      console.log('🚀 Iniciando sesión para:', username)
      
      // Verificar credenciales
      const { isValid, userData } = await verifyPassword(username, password)
      
      if (!isValid || !userData) {
        console.log('❌ Credenciales inválidas')
        return { error: new Error('Credenciales inválidas') }
      }
      
      // Crear objeto de usuario
      const appUser: AppUser = {
        UserID: userData.UserID,
        Username: userData.Username,
        role: (userData.role as UserRole) || 'user'
      }
      
      setUser(appUser)
      setUserRole(appUser.role)
      
      // Guardar en localStorage para persistencia
      localStorage.setItem('app_user', JSON.stringify(appUser))
      
      console.log('✅ Usuario autenticado exitosamente:', appUser.Username, 'Rol:', appUser.role)
      
      return { error: null }
    } catch (error) {
      console.error('Error en signIn:', error)
      return { error: error as Error }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setUser(null)
    setUserRole(null)
    localStorage.removeItem('app_user')
    console.log('🚪 Usuario cerró sesión')
  }

  // Verificar si hay una sesión guardada
  useEffect(() => {
    const checkStoredUser = () => {
      try {
        const storedUser = localStorage.getItem('app_user')
        if (storedUser) {
          const appUser = JSON.parse(storedUser) as AppUser
          setUser(appUser)
          setUserRole(appUser.role)
          console.log('🔄 Usuario restaurado desde localStorage:', appUser.Username)
        }
      } catch (error) {
        console.error('Error restoring user:', error)
        localStorage.removeItem('app_user')
      } finally {
        setLoading(false)
      }
    }

    checkStoredUser()
  }, [])

  const value = {
    user,
    loading,
    signIn,
    signOut,
    userRole
  }

  return <AppAuthContext.Provider value={value}>{children}</AppAuthContext.Provider>
}

export function useAppAuth() {
  const context = useContext(AppAuthContext)
  if (context === undefined) {
    throw new Error('useAppAuth must be used within an AppAuthProvider')
  }
  return context
}
