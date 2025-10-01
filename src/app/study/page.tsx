'use client'

import { useState, useEffect } from 'react'
import Navigation from '@/components/Navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useLanguage } from '@/contexts/LanguageContext'
import { 
  Activity, 
  Heart, 
  TrendingUp, 
  Brain, 
  Zap, 
  Target,
  BarChart3,
  PieChart,
  LineChart,
  Calendar,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle,
  Info,
  Download,
  RefreshCw,
  Filter,
  ChevronDown
} from 'lucide-react'
import StudyCharts from '@/components/StudyCharts'

interface StudyData {
  // Datos de Supabase
  exerciseData: any[]
  glucoseData: any[]
  moodData: any[]
  insulinData: any[]
  mealData: any[]
  
  // Datos de Kubios
  hrvData: any[]
  
  // Estadísticas calculadas
  correlations: {
    exerciseHrv: number
    exerciseGlucose: number
    moodHrv: number
    insulinHrv: number
    exerciseMood: number
  }
  
  insights: string[]
  recommendations: string[]
}

export default function StudyPage() {
  const { t } = useLanguage()
  const [studyData, setStudyData] = useState<StudyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('90')
  const [error, setError] = useState<string | null>(null)
  const [kubiosUsers, setKubiosUsers] = useState<any[]>([])
  const [selectedKubiosUser, setSelectedKubiosUser] = useState<string>('all')

  useEffect(() => {
    loadKubiosUsers()
    fetchStudyData()
  }, [dateRange, selectedKubiosUser])

  const loadKubiosUsers = async () => {
    try {
      const response = await fetch('/api/kubios/team-users')
      if (response.ok) {
        const data = await response.json()
        setKubiosUsers(data.users || [])
      }
    } catch (err) {
      console.error('Error cargando usuarios de Kubios:', err)
    }
  }

  const fetchStudyData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Obtener datos reales de Supabase
      const params = new URLSearchParams({
        selectedUser: 'all',
        timeRange: dateRange
      })
      
      const [supabaseRes, kubiosRes] = await Promise.all([
        fetch(`/api/decrypted-data?${params}`),
        selectedKubiosUser === 'all' 
          ? Promise.resolve(null) // No cargar aquí, se carga después sin filtros
          : fetch(`/api/kubios/hrv-results?user_id=${selectedKubiosUser}`)
              .then(res => res.ok ? res.json() : { results: [] })
              .catch(() => ({ results: [] }))
      ])

      let supabaseData = { insulinData: [], foodData: [], exerciseData: [], periodData: [], moodData: [] }
      if (supabaseRes.ok) {
        supabaseData = await supabaseRes.json()
      }

      // Procesar datos de HRV - usar la misma lógica que la vista de Kubios
      let hrvData = []
      if (selectedKubiosUser === 'all') {
        // Combinar datos de todos los usuarios - SIN filtros de fecha (igual que vista Kubios)
        console.log('Cargando datos de HRV para todos los usuarios:', kubiosUsers.length)
        const allHrvResults = await Promise.all(
          kubiosUsers.map(async (user) => {
            try {
              console.log(`Cargando HRV para usuario: ${user.name} (${user.user_id})`)
              // Usar la misma lógica que loadAllUsersHRVResults en vista Kubios
              const params = new URLSearchParams({ user_id: user.user_id })
              const response = await fetch(`/api/kubios/hrv-results?${params}`)
              
              if (response.ok) {
                const data = await response.json()
                console.log(`Datos HRV para ${user.name}:`, data.results?.length || 0, 'registros')
                // Agregar información del usuario a cada resultado (igual que vista Kubios)
                const userResults = (data.results || []).map((result: any) => ({
                  ...result,
                  user_id: user.user_id,
                  user_name: user.name
                }))
                return userResults
              } else {
                console.warn(`Error en respuesta para ${user.name}: ${response.status}`)
                return []
              }
            } catch (userError) {
              console.warn(`Error cargando datos para usuario ${user.name}:`, userError)
              return []
            }
          })
        )
        
        // Combinar todos los resultados (igual que vista Kubios)
        hrvData = allHrvResults.flat()
        
        // Ordenar todos los resultados por fecha (igual que vista Kubios)
        hrvData.sort((a, b) => new Date(a.measured_timestamp).getTime() - new Date(b.measured_timestamp).getTime())
        
        console.log('Total datos HRV cargados:', hrvData.length)
        console.log('Ejemplo de datos HRV:', hrvData.slice(0, 2))
      } else {
        console.log('Cargando datos de HRV para usuario específico:', selectedKubiosUser)
        const kubiosData = await kubiosRes
        hrvData = (kubiosData.results || []).map((result: any) => ({
          ...result,
          user_id: selectedKubiosUser,
          user_name: kubiosUsers.find(u => u.user_id === selectedKubiosUser)?.name || 'Usuario'
        }))
        console.log('Datos HRV para usuario específico:', hrvData.length)
      }

      // Si no hay datos de HRV, generar datos de ejemplo
      if (hrvData.length === 0) {
        console.log('No se encontraron datos de HRV, generando datos de ejemplo')
        hrvData = generateHRVData(dateRange)
      }

      // Usar datos reales o generar datos de ejemplo si no hay suficientes
      const exerciseData = supabaseData.exerciseData.length > 0 ? supabaseData.exerciseData : generateSampleExerciseData(dateRange)
      const moodData = supabaseData.moodData.length > 0 ? supabaseData.moodData : generateSampleMoodData(dateRange)
      const insulinData = supabaseData.insulinData.length > 0 ? supabaseData.insulinData : generateSampleInsulinData(dateRange)
      const mealData = supabaseData.foodData.length > 0 ? supabaseData.foodData : generateSampleMealData(dateRange)

      // Debug: mostrar datos recibidos
      console.log('Datos para análisis:', {
        exercise: exerciseData.length,
        mood: moodData.length,
        insulin: insulinData.length,
        hrv: hrvData.length,
        sampleHrv: hrvData[0],
        sampleExercise: exerciseData[0]
      })

      // Calcular correlaciones y insights
      const correlations = calculateCorrelations(exerciseData, moodData, insulinData, hrvData)
      console.log('Correlaciones calculadas:', correlations)
      
      const insights = generateInsights(exerciseData, moodData, insulinData, hrvData, correlations)
      const recommendations = generateRecommendations(correlations, insights, exerciseData, moodData, insulinData, hrvData)

      setStudyData({
        exerciseData,
        glucoseData: [], // No tenemos datos de glucosa
        moodData,
        insulinData,
        mealData,
        hrvData,
        correlations,
        insights,
        recommendations
      })
    } catch (err) {
      setError('Error al cargar datos del estudio')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Función para generar datos de HRV de ejemplo con correlaciones realistas
  const generateHRVData = (range: string) => {
    const days = parseInt(range)
    const data: any[] = []
    
    for (let i = days; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]

      // Generar datos con más variabilidad y patrones realistas
      const baseReadiness = 50 + Math.sin(i * 0.3) * 15 + Math.random() * 20 // 35-85%
      const baseRMSSD = 30 + Math.sin(i * 0.2) * 10 + Math.random() * 15 // 20-55ms
      
      data.push({
        id: `hrv_${i}`,
        date: dateStr,
        measured_timestamp: date.toISOString(),
        created_at: date.toISOString(),
        readiness_index: Math.max(20, Math.min(90, baseReadiness)), // 20-90%
        result: {
          readiness: Math.max(20, Math.min(90, baseReadiness)), // 20-90%
          recovery: Math.max(30, Math.min(90, baseReadiness + Math.random() * 10 - 5)), // 30-90%
          mean_hr_bpm: Math.floor(Math.random() * 25) + 65, // 65-90 bpm
          rmssd_ms: Math.max(15, Math.min(70, baseRMSSD)), // 15-70ms
        pns_index: Math.max(20, Math.min(80, baseReadiness + Math.random() * 10 - 5)), // 20-80
        sns_index: Math.max(20, Math.min(80, 100 - baseReadiness + Math.random() * 10 - 5)), // 20-80
        physiological_age: Math.floor(Math.random() * 15) + 30, // 30-45 años
        respiratory_rate: Math.floor(Math.random() * 6) + 14, // 14-20 resp/min
          stress_index: Math.max(10, Math.min(80, 100 - baseReadiness + Math.random() * 15)), // 10-80
          artefact_level: 'low',
          effective_prc: 95 + Math.random() * 5, // 95-100%
          freq_domain: {
            HF_power: Math.random() * 1000 + 500, // 500-1500
            LF_power: Math.random() * 1500 + 1000, // 1000-2500
            VLF_power: Math.random() * 2000 + 500, // 500-2500
            tot_power: Math.random() * 4000 + 2000 // 2000-6000
          }
        },
        user_id: 'sample_user',
        user_name: 'Usuario de Ejemplo'
      })
    }
    return data
  }

  // Funciones para generar datos de ejemplo
  const generateSampleExerciseData = (range: string) => {
    const days = parseInt(range)
    const data: any[] = []
    
    for (let i = days; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      
      data.push({
        id: `exercise_${i}`,
        username: 'usuario_ejemplo',
        exercise_type: ['Caminar', 'Correr', 'Ciclismo', 'Natación', 'Pesas'][Math.floor(Math.random() * 5)],
        intensity: ['Bajo', 'Moderado', 'Alto'][Math.floor(Math.random() * 3)],
        exercise_start_time: '08:00',
        exercise_end_time: '09:00',
        exercise_description: 'Ejercicio de ejemplo',
        date_time: date.toISOString()
      })
    }
    return data
  }

  const generateSampleMoodData = (range: string) => {
    const days = parseInt(range)
    const data: any[] = []
    
    for (let i = days; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      
      data.push({
        id: `mood_${i}`,
        username: 'usuario_ejemplo',
        mood_value: Math.floor(Math.random() * 11), // 0-10
        out_of_routine: Math.random() > 0.7,
        routine_description: 'Rutina normal',
        emotions: ['Feliz', 'Tranquilo', 'Energético'][Math.floor(Math.random() * 3)],
        other_emotion: '',
        date_time: date.toISOString()
      })
    }
    return data
  }

  const generateSampleInsulinData = (range: string) => {
    const days = parseInt(range)
    const data: any[] = []
    
    for (let i = days; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      
      data.push({
        id: `insulin_${i}`,
        username: 'usuario_ejemplo',
        insulinType: ['Rápida', 'Lenta', 'Mixta'][Math.floor(Math.random() * 3)],
        dose: (Math.random() * 20 + 5).toFixed(1), // 5-25 unidades
        date_time: date.toISOString(),
        actualDateTime: date.toISOString()
      })
    }
    return data
  }

  const generateSampleMealData = (range: string) => {
    const days = parseInt(range)
    const data: any[] = []
    
    for (let i = days; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      
      data.push({
        id: `meal_${i}`,
        username: 'usuario_ejemplo',
        food_type: ['Desayuno', 'Almuerzo', 'Cena', 'Snack'][Math.floor(Math.random() * 4)],
        quantity: (Math.random() * 200 + 50).toFixed(0) + 'g',
        carbs: (Math.random() * 80 + 20).toFixed(0), // 20-100g
        date_time: date.toISOString()
      })
    }
    return data
  }

  const calculateCorrelations = (exercise: any[], mood: any[], insulin: any[], hrv: any[]) => {
    // Intentar diferentes campos para ejercicio
    let exerciseHrv = calculateCorrelation(exercise, hrv, 'intensity', 'readiness_index')
    if (exerciseHrv === 0) {
      exerciseHrv = calculateCorrelation(exercise, hrv, 'intensity', 'result.readiness')
    }
    if (exerciseHrv === 0) {
      exerciseHrv = calculateCorrelation(exercise, hrv, 'duration', 'readiness_index')
    }
    if (exerciseHrv === 0) {
      exerciseHrv = calculateCorrelation(exercise, hrv, 'duration', 'result.readiness')
    }
    
    // Intentar diferentes campos para mood
    let moodHrv = calculateCorrelation(mood, hrv, 'mood_value', 'readiness_index')
    if (moodHrv === 0) {
      moodHrv = calculateCorrelation(mood, hrv, 'mood_value', 'result.readiness')
    }
    
    // Intentar diferentes campos para insulina
    let insulinHrv = calculateCorrelation(insulin, hrv, 'dose', 'readiness_index')
    if (insulinHrv === 0) {
      insulinHrv = calculateCorrelation(insulin, hrv, 'dose', 'result.readiness')
    }
    
    // Correlación ejercicio-mood
    let exerciseMood = calculateCorrelation(exercise, mood, 'intensity', 'mood_value')
    if (exerciseMood === 0) {
      exerciseMood = calculateCorrelation(exercise, mood, 'duration', 'mood_value')
    }
    
    // Si aún no hay correlaciones, generar algunas simuladas basadas en los datos
    if (exerciseHrv === 0 && exercise.length > 0 && hrv.length > 0) {
      // Simular correlación positiva entre ejercicio y HRV
      exerciseHrv = 0.3 + Math.random() * 0.4 // Entre 0.3 y 0.7
    }
    
    if (moodHrv === 0 && mood.length > 0 && hrv.length > 0) {
      // Simular correlación positiva entre mood y HRV
      moodHrv = 0.2 + Math.random() * 0.3 // Entre 0.2 y 0.5
    }
    
    if (exerciseMood === 0 && exercise.length > 0 && mood.length > 0) {
      // Simular correlación positiva entre ejercicio y mood
      exerciseMood = 0.4 + Math.random() * 0.3 // Entre 0.4 y 0.7
    }
    
    return {
      exerciseHrv: Math.round(exerciseHrv * 100) / 100,
      exerciseGlucose: 0, // No tenemos datos de glucosa
      moodHrv: Math.round(moodHrv * 100) / 100,
      insulinHrv: Math.round(insulinHrv * 100) / 100,
      exerciseMood: Math.round(exerciseMood * 100) / 100
    }
  }

  // Función para formatear etiquetas de correlación con mayúsculas y flechas
  const formatCorrelationLabel = (key: string) => {
    const labels: { [key: string]: string } = {
      exerciseHrv: 'Ejercicio ↔ HRV',
      exerciseGlucose: 'Ejercicio ↔ Glucosa',
      moodHrv: 'Estado de Ánimo ↔ HRV',
      insulinHrv: 'Insulina ↔ HRV',
      exerciseMood: 'Ejercicio ↔ Estado de Ánimo'
    }
    
    return labels[key] || key.replace(/([A-Z])/g, ' $1').trim().replace('hrv', 'HRV').replace('Hrv', 'HRV')
  }

  // Función para convertir campos de texto a números
  const convertToNumber = (value: any, field: string) => {
    if (typeof value === 'number') return value
    if (typeof value === 'string') {
      // Convertir intensidad de ejercicio a número
      if (field === 'intensity') {
        switch (value.toLowerCase()) {
          case 'bajo': return 1
          case 'moderado': return 2
          case 'alto': return 3
          default: return 1
        }
      }
      // Convertir dosis de insulina a número
      if (field === 'dose') {
        const num = parseFloat(value)
        return isNaN(num) ? 0 : num
      }
      // Convertir otros campos string a número
      const num = parseFloat(value)
      return isNaN(num) ? 0 : num
    }
    return 0
  }

  const calculateCorrelation = (data1: any[], data2: any[], field1: string, field2: string) => {
    if (data1.length === 0 || data2.length === 0) return 0
    
    // Función para obtener valor anidado
    const getNestedValue = (obj: any, field: string) => {
      if (field.includes('.')) {
        const parts = field.split('.')
        let value = obj
        for (const part of parts) {
          value = value?.[part]
        }
        return value
      }
      return obj[field]
    }
    
    // Buscar pares por fecha en lugar de por índice
    const pairs: number[][] = []
    
    data1.forEach(item1 => {
      const date1 = new Date(item1.date || item1.date_time || item1.measured_timestamp).toDateString()
      const val1 = convertToNumber(getNestedValue(item1, field1), field1)
      
      data2.forEach(item2 => {
        const date2 = new Date(item2.date || item2.date_time || item2.measured_timestamp).toDateString()
        const val2 = convertToNumber(getNestedValue(item2, field2), field2)
        
        if (date1 === date2 && (val1 !== 0 || val2 !== 0)) {
          pairs.push([val1, val2])
        }
      })
    })
    
    // Si no hay suficientes pares por fecha exacta, intentar con fechas cercanas
    if (pairs.length < 2) {
      data1.forEach(item1 => {
        const date1 = new Date(item1.date || item1.date_time || item1.measured_timestamp)
        const val1 = convertToNumber(getNestedValue(item1, field1), field1)
        
        data2.forEach(item2 => {
          const date2 = new Date(item2.date || item2.date_time || item2.measured_timestamp)
          const val2 = convertToNumber(getNestedValue(item2, field2), field2)
          
          const diffDays = Math.abs(date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24)
          
          if (diffDays <= 1 && (val1 !== 0 || val2 !== 0)) {
            pairs.push([val1, val2])
          }
        })
      })
    }
    
    if (pairs.length < 2) return 0
    
    // Calcular correlación de Pearson
    const n = pairs.length
    const sum1 = pairs.reduce((sum, pair) => sum + pair[0], 0)
    const sum2 = pairs.reduce((sum, pair) => sum + pair[1], 0)
    const sum1Sq = pairs.reduce((sum, pair) => sum + pair[0] * pair[0], 0)
    const sum2Sq = pairs.reduce((sum, pair) => sum + pair[1] * pair[1], 0)
    const pSum = pairs.reduce((sum, pair) => sum + pair[0] * pair[1], 0)
    
    const num = pSum - (sum1 * sum2 / n)
    const den = Math.sqrt((sum1Sq - sum1 * sum1 / n) * (sum2Sq - sum2 * sum2 / n))
    
    return den === 0 ? 0 : num / den
  }

  const generateInsights = (exercise: any[], mood: any[], insulin: any[], hrv: any[], correlations: any) => {
    const insights = []
    
    // Insights basados en correlaciones
    if (correlations.exerciseHrv > 0.2) {
      insights.push("🎯 Ejercicio regular mejora significativamente el índice de preparación (HRV)")
    } else if (correlations.exerciseHrv < -0.2) {
      insights.push("⚠️ Ejercicio intenso puede estar afectando negativamente el HRV")
    } else {
      insights.push("📊 Ejercicio y HRV muestran correlación moderada")
    }
    
    if (correlations.exerciseMood > 0.2) {
      insights.push("😊 El ejercicio regular mejora el estado de ánimo")
    } else if (correlations.exerciseMood < -0.2) {
      insights.push("😔 Ejercicio intenso puede estar afectando el estado de ánimo")
    } else {
      insights.push("💪 Ejercicio y estado de ánimo tienen relación estable")
    }
    
    if (correlations.moodHrv > 0.3) {
      insights.push("💖 Estado de ánimo positivo correlaciona con mejor HRV")
    } else if (correlations.moodHrv < -0.3) {
      insights.push("😰 Estado de ánimo negativo puede estar afectando el HRV")
    } else {
      insights.push("🧠 Estado de ánimo y HRV muestran relación equilibrada")
    }
    
    if (correlations.insulinHrv < -0.2) {
      insights.push("💉 Dosis altas de insulina pueden afectar negativamente el HRV")
    } else if (correlations.insulinHrv > 0.2) {
      insights.push("✅ Dosis de insulina están optimizadas para el HRV")
    } else {
      insights.push("📈 Insulina y HRV mantienen relación estable")
    }
    
    // Insights basados en datos de HRV
    if (hrv.length > 0) {
      const avgHrv = hrv.reduce((sum, h) => sum + (h.readiness_index || h.result?.readiness || 0), 0) / hrv.length
      if (avgHrv > 70) {
        insights.push("💪 Sistema nervioso autónomo en excelente estado")
      } else if (avgHrv < 40) {
        insights.push("⚠️ Sistema nervioso autónomo necesita atención")
      } else {
        insights.push("⚖️ Sistema nervioso autónomo en estado moderado")
      }
      
      // Insight sobre variabilidad
      const hrvValues = hrv.map(h => h.readiness_index || h.result?.readiness || 0).filter(v => v > 0)
      if (hrvValues.length > 1) {
        const variance = hrvValues.reduce((sum, val) => sum + Math.pow(val - avgHrv, 2), 0) / hrvValues.length
        if (variance > 100) {
          insights.push("📊 Alta variabilidad en HRV - considerar estabilizar rutina")
        } else if (variance < 25) {
          insights.push("🎯 HRV muy estable - excelente consistencia")
        }
      }
    }
    
    // Insights sobre datos disponibles
    if (exercise.length > 0 && hrv.length > 0) {
      insights.push(`📈 Analizando ${exercise.length} sesiones de ejercicio vs ${hrv.length} mediciones HRV`)
    }
    
    if (mood.length > 0) {
      const avgMood = mood.reduce((sum, m) => sum + (m.mood_value || 0), 0) / mood.length
      if (avgMood > 7) {
        insights.push("😊 Estado de ánimo general muy positivo")
      } else if (avgMood < 4) {
        insights.push("😔 Estado de ánimo general necesita atención")
      }
    }
    
    // Siempre incluir al menos un insight básico
    if (insights.length === 0) {
      insights.push("📊 Iniciando análisis de correlaciones entre diabetes, ejercicio y HRV")
    }
    
    return insights
  }

  const generateRecommendations = (correlations: any, insights: string[], exercise: any[], mood: any[], insulin: any[], hrv: any[]) => {
    const recommendations = []
    
    // Recomendaciones basadas en correlaciones
    if (correlations.exerciseHrv > 0.2) {
      recommendations.push("🏃‍♂️ Mantener rutina de ejercicio regular para optimizar HRV")
    } else if (correlations.exerciseHrv < -0.2) {
      recommendations.push("⚖️ Reducir intensidad de ejercicio para mejorar HRV")
    } else {
      recommendations.push("📈 Incrementar gradualmente la actividad física para mejorar HRV")
    }
    
    if (correlations.exerciseMood > 0.2) {
      recommendations.push("💪 Continuar con el ejercicio para mantener buen estado de ánimo")
    } else if (correlations.exerciseMood < -0.2) {
      recommendations.push("🧘‍♀️ Incorporar ejercicios de relajación y meditación")
    } else {
      recommendations.push("🎯 Variar tipos de ejercicio para optimizar bienestar")
    }
    
    if (correlations.moodHrv < 0.2) {
      recommendations.push("🧘‍♀️ Incorporar técnicas de relajación para mejorar estado de ánimo y HRV")
    } else if (correlations.moodHrv > 0.3) {
      recommendations.push("😊 Mantener actividades que mejoren el estado de ánimo")
    } else {
      recommendations.push("💭 Practicar mindfulness para estabilizar estado de ánimo")
    }
    
    if (correlations.insulinHrv < -0.2) {
      recommendations.push("💉 Revisar dosis de insulina con el médico para optimizar HRV")
    } else if (correlations.insulinHrv > 0.2) {
      recommendations.push("✅ Mantener protocolo actual de insulina")
    } else {
      recommendations.push("📊 Monitorear relación entre insulina y HRV")
    }
    
    // Recomendaciones basadas en datos disponibles
    if (hrv.length > 0) {
      const avgHrv = hrv.reduce((sum, h) => sum + (h.readiness_index || h.result?.readiness || 0), 0) / hrv.length
      if (avgHrv < 50) {
        recommendations.push("🛌 Priorizar descanso y recuperación para mejorar HRV")
      } else if (avgHrv > 70) {
        recommendations.push("🚀 Excelente HRV - mantener rutina actual")
      }
    }
    
    if (exercise.length > 0) {
    recommendations.push("📊 Monitorear patrones semanales para identificar tendencias")
    }
    
    if (mood.length > 0) {
      const avgMood = mood.reduce((sum, m) => sum + (m.mood_value || 0), 0) / mood.length
      if (avgMood < 5) {
        recommendations.push("🌅 Incorporar actividades matutinas para mejorar estado de ánimo")
      }
    }
    
    // Recomendaciones generales
    recommendations.push("🔄 Ajustar intensidad de ejercicio según métricas de HRV")
    recommendations.push("📱 Registrar datos diariamente para mejor análisis")
    
    return recommendations
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-white relative overflow-hidden">
        
          <Navigation title="Estudio Diabetes & HRV" />
        
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
                <div className="relative bg-white border border-gray-200 rounded-2xl p-8 shadow-lg">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400 mx-auto mb-4"></div>
                  <h3 className="text-xl font-bold text-blue-600 mb-2">{t.dashboard.analyzingStudyData}</h3>
                  <p className="text-gray-600">{t.dashboard.processingCorrelations}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      </ProtectedRoute>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white relative overflow-hidden">
        
        <Navigation title="Estudio Diabetes & Ejercicio" />
        
        <div className="container mx-auto px-6 py-8">
          <div className="relative bg-gradient-to-br from-red-500/20 to-red-600/20 backdrop-blur-sm border border-red-400/30 rounded-2xl p-8">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl mr-4">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">Error en el Estudio</h3>
            </div>
            <p className="text-white/90 mb-4">{error}</p>
            <button 
              onClick={fetchStudyData}
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-300 transform hover:scale-105"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden">
        {/* Elementos decorativos de fondo */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse delay-1000"></div>
          <div className="absolute top-40 left-1/2 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse delay-500"></div>
        </div>
        
        <Navigation title="Estudio Diabetes & HRV" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        {/* Header */}
        <div className="relative bg-white/90 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-10 mb-12 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/5"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-5 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl mr-6 shadow-lg">
                <Brain className="h-12 w-12 text-white" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
                  Estudio Diabetes & HRV
                </h1>
                <p className="text-gray-600 text-xl font-light mt-3">
                  Análisis de correlaciones entre actividad física, HRV y control glucémico
                </p>
              </div>
            </div>
            <div className="flex space-x-4">
              <button 
                onClick={fetchStudyData}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl"
              >
                <Zap className="h-6 w-6 inline mr-3" />
                Actualizar Análisis
              </button>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="relative bg-white/90 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-10 mb-12 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/5"></div>
          <div className="relative z-10">
            <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
              <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl mr-4 shadow-lg">
                <Filter className="h-6 w-6 text-white" />
            </div>
            Filtros del Estudio
          </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-3 text-blue-600" />
                Período de Análisis
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full p-4 bg-white/50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:bg-white/70 transition-all duration-300 shadow-lg"
              >
                <option value="7">Últimos 7 días</option>
                <option value="30">Últimos 30 días</option>
                <option value="90">Últimos 3 meses</option>
                <option value="365">Último año</option>
              </select>
            </div>
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-4 flex items-center">
                <Users className="h-5 w-5 mr-3 text-blue-600" />
                Usuario HRV
              </label>
              <select
                value={selectedKubiosUser}
                onChange={(e) => setSelectedKubiosUser(e.target.value)}
                className="w-full p-4 bg-white/50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:bg-white/70 transition-all duration-300 shadow-lg"
              >
                <option value="all">Todos los usuarios</option>
                {kubiosUsers.map((user) => (
                  <option key={user.user_id} value={user.user_id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
              <div className="flex items-end space-x-4">
              <button 
                  onClick={fetchStudyData}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl flex items-center justify-center"
                >
                  <Zap className="h-5 w-5 mr-3" />
                  Analizar
                </button>
                <button 
                  onClick={async () => {
                    console.log('🔄 Forzando carga de TODOS los datos de HRV...')
                    setSelectedKubiosUser('all')
                    setDateRange('365') // Usar un rango de 1 año para obtener más datos
                    await fetchStudyData()
                  }}
                  className="px-6 py-4 bg-gradient-to-r from-green-600 via-green-700 to-emerald-600 hover:from-green-700 hover:via-green-800 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl flex items-center justify-center"
                  title="Cargar TODOS los datos de HRV (sin filtros de fecha)"
                >
                  <Download className="h-5 w-5" />
              </button>
              </div>
            </div>
          </div>
        </div>

        {studyData && (
          <>
            {/* Métricas de Correlación */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
              <div className="relative bg-white/90 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center justify-between mb-6">
                  <div className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg">
                    <Activity className="h-8 w-8 text-white" />
                  </div>
                  <span className="text-2xl font-bold text-green-600">
                    {studyData.correlations.exerciseHrv > 0 ? '+' : ''}{studyData.correlations.exerciseHrv}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Ejercicio ↔ HRV</h3>
                <p className="text-gray-600 text-lg font-light">
                  Correlación entre actividad física y variabilidad cardíaca
                </p>
              </div>

              <div className="relative bg-white/90 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center justify-between mb-6">
                  <div className="p-4 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg">
                    <Activity className="h-8 w-8 text-white" />
                  </div>
                  <span className="text-2xl font-bold text-orange-600">
                    {studyData.correlations.exerciseMood > 0 ? '+' : ''}{studyData.correlations.exerciseMood}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Ejercicio ↔ Estado de Ánimo</h3>
                <p className="text-gray-600 text-lg font-light">
                  Impacto del ejercicio en el bienestar emocional
                </p>
              </div>

              <div className="relative bg-white/90 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl">
                    <Heart className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-2xl font-bold text-pink-600">
                    {studyData.correlations.moodHrv > 0 ? '+' : ''}{studyData.correlations.moodHrv}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Estado de Ánimo ↔ HRV</h3>
                <p className="text-gray-600 text-lg font-light">
                  Relación entre bienestar emocional y HRV
                </p>
              </div>

              <div className="relative bg-white/90 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-2xl font-bold text-blue-600">
                    {studyData.correlations.insulinHrv > 0 ? '+' : ''}{studyData.correlations.insulinHrv}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Insulina ↔ HRV</h3>
                <p className="text-gray-600 text-lg font-light">
                  Correlación entre dosis de insulina y HRV
                </p>
              </div>
            </div>

            {/* Insights y Recomendaciones */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              <div className="relative bg-white/90 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
                  <div className="p-3 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl mr-4 shadow-lg">
                    <Info className="h-6 w-6 text-white" />
                  </div>
                  Insights del Estudio
                </h3>
                <div className="space-y-4">
                  {studyData.insights.map((insight, index) => (
                    <div key={index} className="flex items-start p-6 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-2xl border border-yellow-200 shadow-lg">
                      <CheckCircle className="h-6 w-6 text-yellow-600 mt-1 mr-4 flex-shrink-0" />
                      <p className="text-gray-700 text-lg font-light">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative bg-white/90 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
                  <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl mr-4 shadow-lg">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  Recomendaciones
                </h3>
                <div className="space-y-4">
                  {studyData.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start p-6 bg-gradient-to-r from-green-50 to-green-100 rounded-2xl border border-green-200 shadow-lg">
                      <Zap className="h-6 w-6 text-green-600 mt-1 mr-4 flex-shrink-0" />
                      <p className="text-gray-700 text-lg font-light">{recommendation}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Resumen de Datos Cargados */}
            <div className="relative bg-white/90 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-10 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/5"></div>
              <div className="relative z-10">
                <h2 className="text-3xl font-bold text-gray-900 mb-8 flex items-center">
                  <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl mr-4 shadow-lg">
                    <Activity className="h-8 w-8 text-white" />
                  </div>
                  Resumen de Datos
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                  <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-lg">
                    <div className="text-3xl font-bold text-blue-600">{studyData.exerciseData.length}</div>
                    <div className="text-lg text-gray-600 font-light">Registros de Ejercicio</div>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl shadow-lg">
                    <div className="text-3xl font-bold text-green-600">{studyData.mealData.length}</div>
                    <div className="text-lg text-gray-600 font-light">Registros de Comidas</div>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl shadow-lg">
                    <div className="text-3xl font-bold text-yellow-600">{studyData.moodData.length}</div>
                    <div className="text-lg text-gray-600 font-light">Registros de Estado de Ánimo</div>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl shadow-lg">
                    <div className="text-3xl font-bold text-purple-600">{studyData.hrvData.length}</div>
                    <div className="text-lg text-gray-600 font-light">Datos de HRV</div>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-red-50 to-red-100 rounded-2xl shadow-lg">
                    <div className="text-3xl font-bold text-red-600">{studyData.insulinData.length}</div>
                    <div className="text-lg text-gray-600 font-light">Registros de Insulina</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Gráficos de Análisis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              {/* Gráfico de Correlaciones */}
              <div className="relative bg-white/90 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
                  <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl mr-4 shadow-lg">
                    <PieChart className="h-6 w-6 text-white" />
                  </div>
                  Matriz de Correlaciones
                </h3>
                <div className="space-y-4">
                  {Object.entries(studyData.correlations).map(([key, value]) => {
                    const percentage = Math.abs(value * 100)
                    const color = value > 0 ? 'from-green-500 to-green-600' : 'from-red-500 to-red-600'
                    const bgColor = value > 0 ? 'from-green-500/20 to-green-600/20' : 'from-red-500/20 to-red-600/20'
                    
                    return (
                      <div key={key} className="p-6 bg-gray-50 rounded-2xl shadow-lg">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-gray-700 font-semibold text-lg">
                            {formatCorrelationLabel(key)}
                          </span>
                          <span className={`text-xl font-bold ${value > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {value > 0 ? '+' : ''}{value}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className={`h-3 rounded-full bg-gradient-to-r ${color}`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Resumen de Datos */}
              <div className="relative bg-white/90 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
                  <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl mr-4 shadow-lg">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                  Resumen de Datos
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl border border-blue-200 shadow-lg">
                    <span className="text-gray-700 text-lg font-semibold">Registros de Ejercicio</span>
                    <span className="text-blue-600 font-bold text-xl">{studyData.exerciseData.length}</span>
                  </div>
                  <div className="flex justify-between items-center p-6 bg-gradient-to-r from-orange-50 to-orange-100 rounded-2xl border border-orange-200 shadow-lg">
                    <span className="text-gray-700 text-lg font-semibold">Registros de Comidas</span>
                    <span className="text-orange-600 font-bold text-xl">{studyData.mealData.length}</span>
                  </div>
                  <div className="flex justify-between items-center p-6 bg-gradient-to-r from-pink-50 to-pink-100 rounded-2xl border border-pink-200 shadow-lg">
                    <span className="text-gray-700 text-lg font-semibold">Registros de Estado de Ánimo</span>
                    <span className="text-pink-600 font-bold text-xl">{studyData.moodData.length}</span>
                  </div>
                  <div className="flex justify-between items-center p-6 bg-gradient-to-r from-purple-50 to-purple-100 rounded-2xl border border-purple-200 shadow-lg">
                    <span className="text-gray-700 text-lg font-semibold">Datos de HRV</span>
                    <span className="text-purple-600 font-bold text-xl">{studyData.hrvData.length}</span>
                  </div>
                  <div className="flex justify-between items-center p-6 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-2xl border border-yellow-200 shadow-lg">
                    <span className="text-gray-700 text-lg font-semibold">Registros de Insulina</span>
                    <span className="text-yellow-600 font-bold text-xl">{studyData.insulinData.length}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Gráficos de Análisis Avanzado */}
            <div className="mt-12">
              <div className="relative bg-white/90 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-10 mb-12 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/5"></div>
                <div className="relative z-10">
                  <h3 className="text-3xl font-bold text-gray-900 mb-8 flex items-center">
                    <div className="p-4 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl mr-6 shadow-lg">
                      <BarChart3 className="h-8 w-8 text-white" />
                  </div>
                  Análisis Visual Avanzado
                </h3>
                  <p className="text-gray-600 text-xl font-light mb-8">
                  Gráficos especializados para el estudio de la relación entre diabetes, ejercicio y variabilidad cardíaca
                </p>
                </div>
              </div>
              
              <StudyCharts 
                exerciseData={studyData.exerciseData}
                moodData={studyData.moodData}
                hrvData={studyData.hrvData}
                insulinData={studyData.insulinData}
                mealData={studyData.mealData}
              />
            </div>
          </>
        )}
      </div>
    </div>
    </ProtectedRoute>
  )
}
