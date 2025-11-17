// Sugestões de medidas predefinidas com suas unidades recomendadas
export interface MeasureSuggestion {
  name: string
  unit: string
  description?: string
}

export const MEASURE_SUGGESTIONS: MeasureSuggestion[] = [
  { name: "Peso", unit: "kg", description: "Peso corporal" },
  { name: "Cintura", unit: "cm", description: "Circunferência da cintura" },
  { name: "Altura", unit: "cm", description: "Altura total" },
  { name: "Quadril", unit: "cm", description: "Circunferência do quadril" },
  { name: "Peito", unit: "cm", description: "Circunferência do peito/tórax" },
  { name: "Braço", unit: "cm", description: "Circunferência do braço" },
  { name: "Coxa", unit: "cm", description: "Circunferência da coxa" },
  { name: "Percentual de Gordura", unit: "%", description: "Percentual de gordura corporal" },
  { name: "Pressão Arterial Sistólica", unit: "mmHg", description: "Pressão arterial máxima" },
  { name: "Pressão Arterial Diastólica", unit: "mmHg", description: "Pressão arterial mínima" },
  { name: "Frequência Cardíaca", unit: "bpm", description: "Batimentos por minuto" },
  { name: "Massa Muscular", unit: "kg", description: "Peso da massa muscular" },
  { name: "Massa Óssea", unit: "kg", description: "Peso da massa óssea" },
  { name: "Água Corporal", unit: "%", description: "Percentual de água no corpo" },
]

// Unidades comuns e suas descrições
export const UNIT_SUGGESTIONS: { unit: string; description: string }[] = [
  { unit: "kg", description: "Quilogramas" },
  { unit: "g", description: "Gramas" },
  { unit: "cm", description: "Centímetros" },
  { unit: "m", description: "Metros" },
  { unit: "%", description: "Percentual" },
  { unit: "mmHg", description: "Milímetros de mercúrio" },
  { unit: "bpm", description: "Batimentos por minuto" },
  { unit: "kcal", description: "Quilocalorias" },
  { unit: "ml", description: "Mililitros" },
  { unit: "L", description: "Litros" },
]

