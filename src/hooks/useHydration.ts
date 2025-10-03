import { useState, useEffect } from 'react'

// Hook para detectar si la aplicación se ha hidratado
export function useHydration() {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  return isHydrated
}

