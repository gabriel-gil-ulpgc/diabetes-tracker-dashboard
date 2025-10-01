'use client'

import { createContext, useState, useContext, useEffect, ReactNode } from 'react'
import { Language, translations } from '@/lib/translations'
import { useHydration } from '@/hooks/useHydration'

interface LanguageContextType {
  language: Language
  setLanguage: (language: Language) => void
  t: typeof translations.es
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Inicializar con el idioma por defecto para evitar problemas de hidratación
  const [language, setLanguage] = useState<Language>('es')
  const isHydrated = useHydration()

  // Cargar idioma desde localStorage al inicializar (solo después de la hidratación)
  useEffect(() => {
    if (isHydrated) {
      const savedLanguage = localStorage.getItem('language') as Language
      console.log('🌍 LanguageContext: Loading language from localStorage:', savedLanguage)
      if (savedLanguage && (savedLanguage === 'es' || savedLanguage === 'en')) {
        setLanguage(savedLanguage)
        console.log('🌍 LanguageContext: Language set to:', savedLanguage)
      } else {
        console.log('🌍 LanguageContext: Using default language: es')
      }
    }
  }, [isHydrated])

  // Guardar idioma en localStorage cuando cambie
  const handleSetLanguage = (newLanguage: Language) => {
    console.log('🌍 LanguageContext: Changing language to:', newLanguage)
    setLanguage(newLanguage)
    if (isHydrated) {
      localStorage.setItem('language', newLanguage)
      console.log('🌍 LanguageContext: Language saved to localStorage:', newLanguage)
    }
  }

  const t = translations[language]

  // No mostrar loading para evitar problemas de hidratación
  // El idioma se cargará en el cliente

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
