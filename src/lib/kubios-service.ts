/**
 * Servicio de Kubios Cloud en Node.js
 * Reemplaza la funcionalidad de Python para compatibilidad con Vercel
 */

import fs from 'fs'
import path from 'path'

// Configuración de Kubios Cloud
const KUBIOSCLOUD_BASE_URL = "https://analysis.kubioscloud.com/"
const USER_AGENT = "DiabetesTracker 1.0"

interface KubiosConfig {
  username: string
  password: string
  client_id: string
}

interface KubiosTokens {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
  id_token: string
}

interface HRVResult {
  result_id: string
  measure_id: string
  measured_timestamp: string
  user_id: string
  user_name?: string
  stress_level: number
  recovery_time: number
  hrv_score: number
  resting_hr: number
  rmssd: number
  pns_index: number
  sns_index: number
  mean_rr: number
  sdnn: number
  respiratory_rate: number
  lf_power: number
  hf_power: number
  quality: string
  readiness_percentage: number
  readiness_level: string
  feeling_score: number
  acute_fatigue: number
  chronic_fatigue: number
  user_happiness?: number
  // Campos adicionales para compatibilidad con el frontend
  readiness: number
  stress: number
  recovery: number
  hrv: number
  heart_rate: number
}

export class KubiosService {
  private config: KubiosConfig | null = null
  private tokens: KubiosTokens | null = null
  private configPath: string

  constructor(configPath: string = 'kub-kubioscloud-demo/my_config.yaml') {
    this.configPath = configPath
    this.loadConfig()
  }

  private loadConfig(): void {
    try {
      // En producción (Vercel), usar variables de entorno
      if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
        const config = {
          username: process.env.KUBIOS_USERNAME,
          password: process.env.KUBIOS_PASSWORD,
          client_id: process.env.KUBIOS_CLIENT_ID
        }

        if (!config.username || !config.password || !config.client_id) {
          console.warn('⚠️ Variables de entorno de Kubios no configuradas')
          return
        }

        this.config = config as KubiosConfig
        console.log('✅ Configuración de Kubios cargada desde variables de entorno')
        return
      }

      // En desarrollo, usar archivo YAML
      const fullPath = path.join(process.cwd(), this.configPath)
      
      if (!fs.existsSync(fullPath)) {
        console.warn(`⚠️ Archivo de configuración no encontrado: ${fullPath}`)
        return
      }

      const yamlContent = fs.readFileSync(fullPath, 'utf8')
      
      // Parsear YAML básico
      const lines = yamlContent.split('\n')
      const config: any = {}
      
      lines.forEach(line => {
        const trimmed = line.trim()
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, value] = trimmed.split(':').map(s => s.trim())
          if (key && value) {
            config[key] = value
          }
        }
      })

      this.config = config as KubiosConfig
      console.log('✅ Configuración de Kubios cargada correctamente')
    } catch (error) {
      console.error('❌ Error cargando configuración de Kubios:', error)
    }
  }

  async authenticate(): Promise<boolean> {
    if (!this.config) {
      console.error('❌ Configuración de Kubios no disponible')
      return false
    }

    try {
      console.log('🔐 Autenticando con Kubios Cloud...')
      
      // Usar el flujo de autenticación correcto de Kubios Cloud
      const csrf = crypto.randomUUID()
      const redirectUri = 'https://analysis.kubioscloud.com/v1/portal/login'
      
      const loginData = {
        client_id: this.config.client_id,
        redirect_uri: redirectUri,
        username: this.config.username,
        password: this.config.password,
        response_type: 'token',
        scope: 'openid',
        _csrf: csrf
      }

      const response = await fetch('https://kubioscloud.auth.eu-west-1.amazoncognito.com/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': `XSRF-TOKEN=${csrf}`,
          'User-Agent': USER_AGENT
        },
        body: new URLSearchParams(loginData),
        redirect: 'manual' // No seguir redirects automáticamente
      })

      console.log(`📊 Respuesta de autenticación: ${response.status}`)
      
      // Manejar diferentes códigos de respuesta
      if (response.status === 302) {
        // Redirección exitosa - extraer tokens de la URL de redirección
        const location = response.headers.get('location')
        console.log(`📍 URL de redirección: ${location}`)
        
        if (location) {
          try {
            const url = new URL(location)
            const fragment = url.hash.substring(1) // Remover el #
            const params = new URLSearchParams(fragment)
            
            const idToken = params.get('id_token')
            const accessToken = params.get('access_token')
            
            console.log(`🔑 Tokens encontrados: id_token=${!!idToken}, access_token=${!!accessToken}`)
            
            if (idToken && accessToken) {
              this.tokens = {
                id_token: idToken,
                access_token: accessToken,
                refresh_token: '', // No disponible en este flujo de autenticación
                token_type: 'Bearer',
                expires_in: 3600
              }
              
              console.log('✅ Autenticación exitosa')
              return true
            } else {
              console.error('❌ Tokens no encontrados en la URL de redirección')
              console.log(`Fragmento de URL: ${fragment}`)
              return false
            }
          } catch (urlError) {
            console.error('❌ Error parseando URL de redirección:', urlError)
            return false
          }
        } else {
          console.error('❌ No se encontró header de Location en la respuesta')
          return false
        }
      } else if (response.status === 200) {
        // Posible redirección de vuelta al login (autenticación falló)
        console.error('❌ Autenticación falló - redirigido de vuelta al login')
        return false
      } else {
        const errorText = await response.text()
        console.error('❌ Error en autenticación:', response.status, errorText)
        return false
      }
    } catch (error) {
      console.error('❌ Error en autenticación:', error)
      return false
    }
  }

  async getUserInfo(): Promise<any> {
    if (!this.tokens) {
      const authenticated = await this.authenticate()
      if (!authenticated) return null
    }

    try {
      const response = await fetch(`${KUBIOSCLOUD_BASE_URL}v1/user/self`, {
        headers: {
          'Authorization': this.tokens!.id_token,
          'User-Agent': USER_AGENT
        }
      })

      if (!response.ok) {
        console.error('❌ Error obteniendo información del usuario:', response.status)
        return null
      }

      return await response.json()
    } catch (error) {
      console.error('❌ Error obteniendo información del usuario:', error)
      return null
    }
  }

  async getHRVResults(userId: string = 'self'): Promise<HRVResult[]> {
    if (!this.tokens) {
      const authenticated = await this.authenticate()
      if (!authenticated) return []
    }

    try {
      console.log(`📊 Obteniendo resultados HRV para usuario: ${userId}`)
      
      // Usar el endpoint correcto según el código Python que funciona
      const response = await fetch(`${KUBIOSCLOUD_BASE_URL}v1/result/${userId}`, {
        headers: {
          'Authorization': this.tokens!.id_token,
          'User-Agent': USER_AGENT
        }
      })

      if (response.status === 401) {
        console.log('🔄 Token expirado, reautenticando...')
        const reauthenticated = await this.authenticate()
        if (!reauthenticated) {
          console.error('❌ No se pudo reautenticar')
          return []
        }
        
        // Reintentar la petición con el nuevo token
        const retryResponse = await fetch(`${KUBIOSCLOUD_BASE_URL}v1/result/${userId}`, {
          headers: {
            'Authorization': this.tokens!.id_token,
            'User-Agent': USER_AGENT
          }
        })
        
        if (!retryResponse.ok) {
          console.error(`❌ Error obteniendo resultados HRV después de reautenticación: ${retryResponse.status}`)
          return []
        }
        
        const data = await retryResponse.json()
        const results = data.results || []
        
        console.log(`✅ Obtenidos ${results.length} resultados HRV (después de reautenticación)`)
        return results.map((result: any) => this.formatHRVResult(result))
      }

      if (!response.ok) {
        console.error('❌ Error obteniendo resultados HRV:', response.status)
        return []
      }

      const data = await response.json()
      const results = data.results || []
      
      console.log(`✅ Obtenidos ${results.length} resultados HRV`)
      return results.map((result: any) => this.formatHRVResult(result))
    } catch (error) {
      console.error('❌ Error obteniendo resultados HRV:', error)
      return []
    }
  }

  async getHRVResultsCount(userId: string = 'self'): Promise<number> {
    if (!this.tokens) {
      const authenticated = await this.authenticate()
      if (!authenticated) return 0
    }

    try {
      console.log(`📊 Contando resultados HRV para usuario: ${userId}`)
      
      // Usar el endpoint correcto según el código Python que funciona
      const response = await fetch(`${KUBIOSCLOUD_BASE_URL}v1/result/${userId}`, {
        headers: {
          'Authorization': this.tokens!.id_token,
          'User-Agent': USER_AGENT
        }
      })

      if (response.status === 401) {
        console.log('🔄 Token expirado, reautenticando...')
        const reauthenticated = await this.authenticate()
        if (!reauthenticated) {
          console.error('❌ No se pudo reautenticar')
          return 0
        }
        
        // Reintentar la petición con el nuevo token
        const retryResponse = await fetch(`${KUBIOSCLOUD_BASE_URL}v1/result/${userId}`, {
          headers: {
            'Authorization': this.tokens!.id_token,
            'User-Agent': USER_AGENT
          }
        })
        
        if (!retryResponse.ok) {
          console.error(`❌ Error contando resultados HRV después de reautenticación: ${retryResponse.status}`)
          return 0
        }
        
        const data = await retryResponse.json()
        const results = data.results || []
        
        console.log(`✅ Contados ${results.length} resultados HRV (después de reautenticación)`)
        return results.length
      }

      if (!response.ok) {
        console.error('❌ Error contando resultados HRV:', response.status)
        return 0
      }

      const data = await response.json()
      const results = data.results || []
      
      console.log(`✅ Contados ${results.length} resultados HRV`)
      return results.length
    } catch (error) {
      console.error('❌ Error contando resultados HRV:', error)
      return 0
    }
  }

  async getHRVResultsDirect(userId: string = 'self'): Promise<any> {
    if (!this.tokens) {
      const authenticated = await this.authenticate()
      if (!authenticated) return null
    }

    try {
      // Usar el endpoint correcto según el SDK de Kubios
      const endpoint = `${KUBIOSCLOUD_BASE_URL}v1/result/${userId}`
      console.log(`🔍 Probando endpoint: ${endpoint}`)
      
      // Usar el formato de header correcto según el SDK
      const headers = {
        'Authorization': this.tokens!.id_token, // Sin "Bearer"
        'User-Agent': 'DemoApp 1.0'
      }
      
      const response = await fetch(endpoint, { headers })
      console.log(`📊 Respuesta HTTP ${response.status}`)
      
      if (response.status === 200) {
        const data = await response.json()
        console.log(`✅ Datos recibidos: ${JSON.stringify(data, null, 2)}`)
        return data
      } else {
        console.log(`❌ Error HTTP ${response.status}: ${await response.text()}`)
        return null
      }
      
    } catch (error) {
      console.error(`Error al obtener resultados HRV directos: ${error}`)
      return null
    }
  }

  async getTeamUsers(): Promise<any[]> {
    if (!this.tokens) {
      const authenticated = await this.authenticate()
      if (!authenticated) return []
    }

    try {
      console.log('👥 Obteniendo usuarios del equipo...')
      
      // Primero necesitamos obtener el team_id del usuario
      const userInfo = await this.getUserInfo()
      if (!userInfo) {
        console.error('❌ No se pudo obtener información del usuario')
        return []
      }
      
      console.log('📋 Información del usuario:', JSON.stringify(userInfo, null, 2))
      
      // El team_id está en userInfo.user.teams[0].team_id
      const teams = userInfo.user?.teams || []
      if (teams.length === 0) {
        console.error('❌ No se encontraron equipos para el usuario')
        return []
      }
      
      // Buscar el equipo "Diabetes Tracker - H2TRAIN" o usar el primero
      let targetTeam = teams.find((team: any) => team.name === "Diabetes Tracker - H2TRAIN")
      if (!targetTeam) {
        targetTeam = teams[0] // Usar el primer equipo si no se encuentra el específico
        console.log(`⚠️ No se encontró el equipo específico, usando: ${targetTeam.name}`)
      }
      
      const teamId = targetTeam.team_id
      console.log(`📋 Team ID: ${teamId} (${targetTeam.name})`)
      
      // Usar la URL correcta de la API v2
      const response = await fetch(`${KUBIOSCLOUD_BASE_URL}v2/team/team/${teamId}?members=yes`, {
        headers: {
          'Authorization': this.tokens!.id_token,
          'Content-Type': 'application/json',
          'User-Agent': USER_AGENT
        }
      })

      if (!response.ok) {
        console.error('❌ Error obteniendo usuarios del equipo:', response.status)
        return []
      }

      const data = await response.json()
      const users = data.members || []
      
      console.log(`✅ Obtenidos ${users.length} usuarios del equipo`)
      console.log('📋 Estructura de usuarios:', JSON.stringify(users.slice(0, 2), null, 2))
      
      // Mapear la estructura de Kubios a la estructura esperada
      const mappedUsers = users.map((user: any) => ({
        user_id: user.team_user_id || user.user_id || user.id,
        name: user.name || user.display_name || user.full_name || `${user.given_name || ''} ${user.family_name || ''}`.trim() || 'Usuario sin nombre',
        email: user.email || user.email_address,
        measurement_count: 0 // Se calculará después
      }))
      
      console.log('📋 Usuarios mapeados:', JSON.stringify(mappedUsers.slice(0, 2), null, 2))
      
      // Por ahora, devolver usuarios sin conteo para evitar bucles de reautenticación
      console.log('📊 Usuarios obtenidos (sin conteo de mediciones para evitar bucles)')
      const usersWithCounts = mappedUsers.map((user: { user_id: string; name: string; email: string; measurement_count: number }) => ({
        ...user,
        measurement_count: 0 // Se calculará cuando se seleccione el usuario
      }))
      
      console.log('📋 Usuarios con conteos:', JSON.stringify(usersWithCounts.slice(0, 2), null, 2))
      return usersWithCounts
    } catch (error) {
      console.error('❌ Error obteniendo usuarios del equipo:', error)
      return []
    }
  }

  async getMeasurementCount(userId: string): Promise<number> {
    if (!this.tokens) {
      const authenticated = await this.authenticate()
      if (!authenticated) return 0
    }

    try {
      console.log(`📊 Obteniendo conteo de mediciones para usuario: ${userId}`)
      
      // Usar el endpoint correcto para obtener mediciones
      const response = await fetch(`${KUBIOSCLOUD_BASE_URL}v2/measure/${userId}/session`, {
        headers: {
          'Authorization': this.tokens!.id_token,
          'User-Agent': USER_AGENT
        }
      })

      if (response.status === 401) {
        console.log('🔄 Token expirado, reautenticando...')
        const reauthenticated = await this.authenticate()
        if (!reauthenticated) {
          console.error('❌ No se pudo reautenticar')
          return 0
        }
        
        // Reintentar la petición con el nuevo token
        const retryResponse = await fetch(`${KUBIOSCLOUD_BASE_URL}v2/measure/${userId}/session`, {
          headers: {
            'Authorization': this.tokens!.id_token,
            'User-Agent': USER_AGENT
          }
        })
        
        if (!retryResponse.ok) {
          console.error(`❌ Error obteniendo conteo después de reautenticación: ${retryResponse.status}`)
          return 0
        }
        
        const data = await retryResponse.json()
        console.log(`📊 Respuesta completa para ${userId} (después de reautenticación):`, JSON.stringify(data, null, 2))
        
        const sessions = data.sessions || data.measures || []
        console.log(`📊 Estructura de datos: sessions=${data.sessions?.length || 0}, measures=${data.measures?.length || 0}`)
        
        console.log(`✅ Obtenidos ${sessions.length} mediciones (después de reautenticación)`)
        return sessions.length
      }

      if (!response.ok) {
        console.error('❌ Error obteniendo conteo de mediciones:', response.status)
        return 0
      }

      const data = await response.json()
      console.log(`📊 Respuesta completa para ${userId}:`, JSON.stringify(data, null, 2))
      
      const sessions = data.sessions || data.measures || []
      console.log(`📊 Estructura de datos: sessions=${data.sessions?.length || 0}, measures=${data.measures?.length || 0}`)
      
      console.log(`✅ Obtenidos ${sessions.length} mediciones`)
      return sessions.length
    } catch (error) {
      console.error('❌ Error obteniendo conteo de mediciones:', error)
      return 0
    }
  }

  private formatHRVResult(result: any): any {
    // Crear la estructura que el frontend espera
    const formattedResult = {
      result_id: result.result_id || result.id,
      measure_id: result.measure_id || result.measurement_id,
      measured_timestamp: result.measured_timestamp || result.timestamp,
      user_id: result.user_id || 'self',
      user_name: result.user_name,
      // Estructura anidada que el frontend espera
      result: {
        readiness: result.readiness_percentage || result.readiness || 0,
        mean_hr_bpm: result.resting_hr || result.heart_rate || 0,
        rmssd_ms: result.rmssd || 0,
        pns_index: result.pns_index || result.pns || 0,
        sns_index: result.sns_index || result.sns || 0,
        physiological_age: result.physiological_age || 35,
        respiratory_rate: result.respiratory_rate || result.resp_rate || 0,
        stress_index: result.stress_level || result.stress || 0,
        artefact_level: result.quality || 'good',
        freq_domain: {
          HF_power: result.hf_power || result.hf || 0,
          LF_power: result.lf_power || result.lf || 0,
          VLF_power: result.vlf_power || 0,
          tot_power: (result.hf_power || 0) + (result.lf_power || 0) + (result.vlf_power || 0)
        }
      },
      // Campos adicionales para compatibilidad
      stress_level: result.stress_level || result.stress || 0,
      recovery_time: result.recovery_time || result.recovery || 0,
      hrv_score: result.hrv_score || result.hrv || 0,
      resting_hr: result.resting_hr || result.heart_rate || 0,
      rmssd: result.rmssd || 0,
      pns_index: result.pns_index || result.pns || 0,
      sns_index: result.sns_index || result.sns || 0,
      mean_rr: result.mean_rr || result.rr_mean || 0,
      sdnn: result.sdnn || 0,
      respiratory_rate: result.respiratory_rate || result.resp_rate || 0,
      lf_power: result.lf_power || result.lf || 0,
      hf_power: result.hf_power || result.hf || 0,
      quality: result.quality || 'unknown',
      readiness_percentage: result.readiness_percentage || result.readiness || 0,
      readiness_level: result.readiness_level || 'unknown',
      feeling_score: result.feeling_score || result.feeling || 0,
      acute_fatigue: result.acute_fatigue || result.fatigue_acute || 0,
      chronic_fatigue: result.chronic_fatigue || result.fatigue_chronic || 0,
      user_happiness: result.user_happiness || result.happiness,
      // Campos adicionales para compatibilidad con el frontend
      stress: result.stress_level || result.stress || 0,
      recovery: result.recovery_time || result.recovery || 0,
      hrv: result.hrv_score || result.hrv || 0,
      heart_rate: result.resting_hr || result.heart_rate || 0
    }
    
    return formattedResult
  }

  // Método para generar datos de ejemplo cuando no hay conexión
  generateMockResults(userId: string, count: number = 10): any[] {
    const results: any[] = []
    const now = new Date()
    
    for (let i = 0; i < count; i++) {
      const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000))
      
      const stressLevel = Math.round(30 + Math.random() * 40)
      const recoveryTime = Math.round(60 + Math.random() * 30)
      const hrvScore = Math.round(60 + Math.random() * 40)
      const restingHr = Math.round(55 + Math.random() * 20)
      const readinessPercentage = Math.round(60 + Math.random() * 40)
      const rmssd = Math.round((20 + Math.random() * 40) * 10) / 10
      const pnsIndex = Math.round(50 + Math.random() * 40)
      const snsIndex = Math.round(10 + Math.random() * 40)
      const respiratoryRate = Math.round((10 + Math.random() * 8) * 10) / 10
      const lfPower = Math.round((0.2 + Math.random() * 0.6) * 100) / 100
      const hfPower = Math.round((0.2 + Math.random() * 0.6) * 100) / 100
      const vlfPower = Math.round((0.1 + Math.random() * 0.3) * 100) / 100
      
      results.push({
        result_id: `mock_result_${userId}_${Date.now()}_${i + 1}`,
        measure_id: `mock_measure_${userId}_${Date.now()}_${i + 1}`,
        measured_timestamp: date.toISOString(),
        user_id: userId,
        user_name: 'Usuario Demo',
        // Estructura anidada que el frontend espera
        result: {
          readiness: readinessPercentage,
          mean_hr_bpm: restingHr,
          rmssd_ms: rmssd,
          pns_index: pnsIndex,
          sns_index: snsIndex,
          physiological_age: Math.round(25 + Math.random() * 20),
          respiratory_rate: respiratoryRate,
          stress_index: stressLevel,
          artefact_level: Math.random() > 0.1 ? 'good' : 'excellent',
          freq_domain: {
            HF_power: hfPower,
            LF_power: lfPower,
            VLF_power: vlfPower,
            tot_power: hfPower + lfPower + vlfPower
          }
        },
        // Campos adicionales para compatibilidad
        stress_level: stressLevel,
        recovery_time: recoveryTime,
        hrv_score: hrvScore,
        resting_hr: restingHr,
        rmssd: rmssd,
        pns_index: pnsIndex,
        sns_index: snsIndex,
        mean_rr: Math.round(800 + Math.random() * 300),
        sdnn: Math.round((30 + Math.random() * 50) * 10) / 10,
        respiratory_rate: respiratoryRate,
        lf_power: lfPower,
        hf_power: hfPower,
        quality: Math.random() > 0.1 ? 'good' : 'excellent',
        readiness_percentage: readinessPercentage,
        readiness_level: Math.random() > 0.3 ? 'good' : 'excellent',
        feeling_score: Math.round(5 + Math.random() * 4),
        acute_fatigue: Math.round((1 + Math.random() * 3) * 10) / 10,
        chronic_fatigue: Math.round((1 + Math.random() * 2) * 10) / 10,
        user_happiness: Math.round(6 + Math.random() * 3),
        // Campos adicionales para compatibilidad con el frontend
        stress: stressLevel,
        recovery: recoveryTime,
        hrv: hrvScore,
        heart_rate: restingHr
      })
    }
    
    return results
  }
}
