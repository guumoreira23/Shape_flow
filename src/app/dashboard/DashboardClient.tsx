"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus, TrendingUp, Shield, ArrowRight } from "lucide-react"
import { formatNumber } from "@/lib/utils/number"
import { formatDateDisplay, formatDate, parseDate } from "@/lib/utils/date"
import { WeightChart } from "@/components/charts/WeightChart"
import { MultiLineChart } from "@/components/charts/MultiLineChart"
import { MainLayout } from "@/components/layout/MainLayout"
import { Skeleton } from "@/components/ui/skeleton"
import { ExportButton } from "@/components/ui/export-button"

interface DashboardData {
  user: {
    email: string
    role: string
  }
  measures: Array<{
    id: number
    name: string
    unit: string
  }>
  entries: Array<{
    id: number
    date: string
  }>
  values: Array<{
    id: number
    entryId: number
    measureTypeId: number
    value: number
  }>
  goals: Array<{
    id: number
    measureTypeId: number
    targetValue: number
  }>
}

interface DashboardClientProps {
  initialData: DashboardData
}

export function DashboardClient({ initialData }: DashboardClientProps) {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Verificar autenticação via API ao montar o componente
  // Se não autenticado, redirecionar para login
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/check", {
          credentials: "include",
        })
        const data = await response.json()

        if (data.authenticated) {
          setIsAuthenticated(true)
          // Atualizar dados do usuário se necessário
          if (data.email && initialData.user.email !== data.email) {
            // Dados podem estar desatualizados, mas isso é ok para SSR inicial
          }
        } else {
          setIsAuthenticated(false)
          router.replace("/login")
        }
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error)
        setIsAuthenticated(false)
        router.replace("/login")
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router, initialData.user.email])

  // Mostrar loading enquanto verifica autenticação
  if (isLoading || isAuthenticated === null) {
    return (
      <MainLayout userIsAdmin={false}>
        <div className="space-y-6 sm:space-y-8">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </MainLayout>
    )
  }

  // Se não autenticado, não renderizar (já redirecionou)
  if (!isAuthenticated) {
    return null
  }

  const user = initialData.user
  const userIsAdmin = user.role === "admin"
  const measures = initialData.measures
  const entries = initialData.entries
  const values = initialData.values
  const userGoals = initialData.goals

  const weightMeasure = measures.find((m) => m.name.toLowerCase().includes("peso"))
  const waistMeasure = measures.find((m) => m.name.toLowerCase().includes("cintura"))

  const getLatestValue = (measureId: number) => {
    const measureValues = values.filter((v) => v.measureTypeId === measureId)
    if (measureValues.length === 0) return null
    const entryIds = measureValues.map((v) => v.entryId)
    const latestEntry = entries.find((e) => entryIds.includes(e.id))
    if (!latestEntry) return null
    const latestValue = measureValues.find((v) => v.entryId === latestEntry.id)
    return latestValue?.value || null
  }

  const weightData = weightMeasure
    ? entries
        .map((entry) => {
          // Validar se entry.date existe e é válido
          if (!entry.date) {
            return null
          }
          // Converter para string se necessário
          const dateString = typeof entry.date === 'string' ? entry.date : String(entry.date)
          if (dateString.trim() === "") {
            return null
          }
          const value = values.find(
            (v) => v.entryId === entry.id && v.measureTypeId === weightMeasure.id
          )
          if (!value) {
            return null
          }
          try {
            const parsedDate = parseDate(dateString)
            // Verificar se a data é válida
            if (isNaN(parsedDate.getTime())) {
              return null
            }
            return {
              date: formatDateDisplay(parsedDate),
              value: value.value,
            }
          } catch (error) {
            console.error("Erro ao processar data:", entry.date, error)
            return null
          }
        })
        .filter((d): d is { date: string; value: number } => d !== null)
        .slice(-7)
    : []

  const weightGoal = weightMeasure
    ? userGoals.find((g) => g.measureTypeId === weightMeasure.id)
    : null

  const getDifference = (measureId: number, goalValue: number | undefined) => {
    if (!goalValue) return null
    const currentValue = getLatestValue(measureId)
    if (currentValue === null) return null
    const diff = currentValue - goalValue
    return diff
  }

  const weightDifference = weightMeasure && weightGoal
    ? getDifference(weightMeasure.id, weightGoal.targetValue)
    : null

  const waistGoal = waistMeasure
    ? userGoals.find((g) => g.measureTypeId === waistMeasure.id)
    : null

  const waistDifference = waistMeasure && waistGoal
    ? getDifference(waistMeasure.id, waistGoal.targetValue)
    : null

  const multiChartData = entries
    .slice(-30)
    .map((entry) => {
      // Validar se entry.date existe e é válido
      if (!entry.date) {
        return null
      }
      // Converter para string se necessário
      const dateString = typeof entry.date === 'string' ? entry.date : String(entry.date)
      if (dateString.trim() === "") {
        return null
      }
      const weightValue = values.find(
        (v) => v.entryId === entry.id && weightMeasure && v.measureTypeId === weightMeasure.id
      )
      const waistValue = values.find(
        (v) => v.entryId === entry.id && waistMeasure && v.measureTypeId === waistMeasure.id
      )
      try {
        const parsedDate = parseDate(dateString)
        // Verificar se a data é válida
        if (isNaN(parsedDate.getTime())) {
          return null
        }
        return {
          date: formatDate(parsedDate),
          peso: weightValue ? weightValue.value : null,
          cintura: waistValue ? waistValue.value : null,
        }
      } catch (error) {
        console.error("Erro ao processar data:", entry.date, error)
        return null
      }
    })
    .filter((d): d is { date: string; peso: number | null; cintura: number | null } => d !== null && (d.peso !== null || d.cintura !== null))

  return (
    <MainLayout userIsAdmin={userIsAdmin}>
      <div className="space-y-6 sm:space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-white mb-2">Dashboard</h1>
          <p className="text-sm sm:text-base text-slate-400 break-all sm:break-normal">Bem-vindo de volta, {user.email}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="card-minimal p-6">
            <h3 className="text-sm font-medium text-minimal-muted mb-3">Último Peso</h3>
            <p className="text-3xl font-semibold text-white mb-1">
              {weightMeasure && getLatestValue(weightMeasure.id)
                ? `${formatNumber(getLatestValue(weightMeasure.id)!)} ${weightMeasure.unit}`
                : "N/A"}
            </p>
            {weightGoal && weightMeasure && (
              <div className="mt-2 space-y-1">
                <p className="text-sm text-minimal-muted">
                  Meta: <span className="text-blue-400 font-medium">{weightGoal.targetValue} {weightMeasure.unit}</span>
                </p>
                {weightDifference !== null && (
                  <p className={`text-sm font-medium ${
                    weightDifference > 0 ? "text-red-400" : weightDifference < 0 ? "text-green-400" : "text-blue-400"
                  }`}>
                    {weightDifference > 0 ? "+" : ""}{formatNumber(weightDifference)} {weightMeasure.unit}
                    {weightDifference > 0 ? " acima da meta" : weightDifference < 0 ? " abaixo da meta" : " na meta"}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="card-minimal p-6">
            <h3 className="text-sm font-medium text-minimal-muted mb-3">Última Cintura</h3>
            <p className="text-3xl font-semibold text-white mb-1">
              {waistMeasure && getLatestValue(waistMeasure.id)
                ? `${formatNumber(getLatestValue(waistMeasure.id)!)} ${waistMeasure.unit}`
                : "N/A"}
            </p>
            {waistGoal && waistMeasure && (
              <div className="mt-2 space-y-1">
                <p className="text-sm text-minimal-muted">
                  Meta: <span className="text-blue-400 font-medium">{waistGoal.targetValue} {waistMeasure.unit}</span>
                </p>
                {waistDifference !== null && (
                  <p className={`text-sm font-medium ${
                    waistDifference > 0 ? "text-red-400" : waistDifference < 0 ? "text-green-400" : "text-blue-400"
                  }`}>
                    {waistDifference > 0 ? "+" : ""}{formatNumber(waistDifference)} {waistMeasure.unit}
                    {waistDifference > 0 ? " acima da meta" : waistDifference < 0 ? " abaixo da meta" : " na meta"}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="card-minimal p-6">
            <h3 className="text-sm font-medium text-minimal-muted mb-3">Total de Lançamentos</h3>
            <p className="text-3xl font-semibold text-white">{entries.length}</p>
            <p className="text-sm text-minimal-muted mt-2">Registros totais</p>
          </div>
        </div>

        {weightData.length > 0 && (
          <div className="card-minimal p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-white mb-1 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-400" />
                  Evolução do Peso
                </h2>
                <p className="text-sm text-minimal-muted">Últimos 7 dias</p>
              </div>
            </div>
            <WeightChart data={weightData} goal={weightGoal?.targetValue} />
          </div>
        )}

        {multiChartData.length > 0 && weightMeasure && waistMeasure && (
          <div className="card-minimal p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-white mb-1 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-400" />
                  Comparativo Peso e Cintura
                </h2>
                <p className="text-sm text-minimal-muted">Últimos 30 dias</p>
              </div>
            </div>
            <MultiLineChart
              data={multiChartData}
              lines={[
                {
                  dataKey: "peso",
                  name: "Peso",
                  color: "#3b82f6",
                  unit: weightMeasure.unit,
                },
                {
                  dataKey: "cintura",
                  name: "Cintura",
                  color: "#10b981",
                  unit: waistMeasure.unit,
                },
              ]}
            />
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Link href="/tracker" className="w-full sm:w-auto">
            <Button className="gap-2 w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Gerenciar Medidas</span>
              <span className="sm:hidden">Medidas</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <div className="w-full sm:w-auto">
            <ExportButton />
          </div>
          {userIsAdmin && (
            <Link href="/admin" className="w-full sm:w-auto">
              <Button variant="outline" className="gap-2 w-full sm:w-auto">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Central Administrativa</span>
                <span className="sm:hidden">Admin</span>
              </Button>
            </Link>
          )}
        </div>
      </div>
    </MainLayout>
  )
}

