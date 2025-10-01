// Funciones de descifrado para el frontend
// Nota: Esta implementación es básica y asume que algunos datos pueden estar en texto plano

// Función para descifrar o devolver texto plano
export function decryptOrPlain(text: string | null, iv: string | null): string {
  if (!text) return '';
  if (typeof text !== 'string') return String(text);
  
  // Si el texto empieza con __PLAIN__, es texto plano
  if (text.startsWith('__PLAIN__')) {
    return text.replace('__PLAIN__', '');
  }
  
  // Si no hay IV, asume texto plano
  if (!iv) return text;
  
  // Por ahora, para el frontend, devolvemos el texto tal como está
  // ya que el descifrado real requiere la clave secreta del servidor
  // En producción, esto se manejaría en el backend
  return text;
}

// Función para descifrar arrays de datos
export function decryptArray(data: any[] | null, iv: string | null): string[] {
  if (!data || !Array.isArray(data)) return [];
  return data.map(item => decryptOrPlain(item, iv));
}

// Función para descifrar datos de insulina
export function decryptInsulinData(data: any[]): any[] {
  return data.map(item => ({
    ...item,
    insulinType: decryptOrPlain(item.insulinType, item.insulintype_iv),
    dose: decryptOrPlain(item.dose, item.dose_iv),
  }));
}

// Función para descifrar datos de comida
export function decryptFoodData(data: any[]): any[] {
  return data.map(item => ({
    ...item,
    food_type: decryptOrPlain(item.food_type, item.food_type_iv),
    quantity: decryptOrPlain(item.quantity, item.quantity_iv),
    carbs: decryptOrPlain(item.carbs, item.carbs_iv),
  }));
}

// Función para descifrar datos de ejercicio
export function decryptExerciseData(data: any[]): any[] {
  return data.map(item => ({
    ...item,
    exercise_type: decryptOrPlain(item.exercise_type, item.exercise_type_iv),
    exercise_description: decryptOrPlain(item.exercise_description, item.exercise_description_iv),
  }));
}

// Función para descifrar datos de períodos
export function decryptPeriodData(data: any[]): any[] {
  return data.map(item => {
    // Manejar síntomas como array
    let symptomsArr = item.symptoms;
    if (typeof symptomsArr === 'string') {
      symptomsArr = symptomsArr.split(',').map((s: string) => s.trim()).filter((s: string) => s !== '');
    }
    if (!Array.isArray(symptomsArr)) symptomsArr = [];
    
    let symptomsIvArr = item.symptoms_iv;
    if (typeof symptomsIvArr === 'string') {
      symptomsIvArr = symptomsIvArr.split(',').map((s: string) => s.trim()).filter((s: string) => s !== '');
    }
    if (!Array.isArray(symptomsIvArr)) symptomsIvArr = [];
    
    return {
      ...item,
      intensity: decryptOrPlain(item.intensity, item.intensity_iv),
      notes: decryptOrPlain(item.notes, item.notes_iv),
      symptoms: symptomsArr.map((s: string, idx: number) => 
        s ? decryptOrPlain(s, symptomsIvArr[idx]) : ""
      ),
    };
  });
}

// Función para descifrar datos de estado de ánimo
export function decryptMoodData(data: any[]): any[] {
  return data.map(item => {
    // Manejar emociones como array
    let emotionsArr = item.emotions;
    if (typeof emotionsArr === 'string') {
      emotionsArr = emotionsArr.split(',').map((s: string) => s.trim()).filter((s: string) => s !== '');
    }
    if (!Array.isArray(emotionsArr)) emotionsArr = [];
    
    let emotionsIvArr = item.emotions_iv;
    if (typeof emotionsIvArr === 'string') {
      emotionsIvArr = emotionsIvArr.split(',').map((s: string) => s.trim()).filter((s: string) => s !== '');
    }
    if (!Array.isArray(emotionsIvArr)) emotionsIvArr = [];
    
    return {
      ...item,
      routine_description: decryptOrPlain(item.routine_description, item.routine_description_iv),
      other_emotion: decryptOrPlain(item.other_emotion, item.other_emotion_iv),
      emotions: emotionsArr.map((e: string, idx: number) => 
        e ? decryptOrPlain(e, emotionsIvArr[idx]) : ""
      ),
    };
  });
} 