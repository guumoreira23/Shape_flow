export function formatNumber(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

export function formatNumberCSV(value: number, decimals: number = 0): string {
  // Formatar número brasileiro para CSV (usa vírgula como separador decimal)
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

