'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase, UserRole } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  userRole: UserRole | null
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<UserRole | null>(null)

  // Función para obtener el rol del usuario
  const fetchUserRole = async (userId: string) => {
    try {
      console.log('🔐 Obteniendo rol para usuario:', userId)
      
      // MODO DESARROLLO: Siempre asignar rol de administrador
      console.log('✅ MODO DESARROLLO: Asignando rol de administrador a todos los usuarios autenticados')
      return 'admin' as UserRole
      
    } catch (error) {
      console.error('Error fetching user role:', error)
      console.log('⚠️ Error, usando rol de administrador por defecto')
      return 'admin' as UserRole
    }
  }

  useEffect(() => {
    // Obtener sesión inicial
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        console.log('🔐 Usuario autenticado encontrado:', session.user.email)
        const role = await fetchUserRole(session.user.id)
        console.log('🎭 Rol asignado:', role)
        setUserRole(role)
      } else {
        console.log('❌ No hay usuario autenticado')
        setUserRole(null)
      }
      
      setLoading(false)
    })

    // Escuchar cambios en la autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        console.log('🔄 Cambio de autenticación - Usuario:', session.user.email)
        const role = await fetchUserRole(session.user.id)
        console.log('🎭 Rol actualizado:', role)
        setUserRole(role)
      } else {
        console.log('🚪 Usuario cerró sesión')
        setUserRole(null)
      }
      
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const value = {
    user,
    session,
    loading,
    userRole,
    signIn,
    signUp,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 