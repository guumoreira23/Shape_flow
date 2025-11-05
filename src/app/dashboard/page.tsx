import { requireAuth } from "@/lib/auth/middleware"
import { isAdmin } from "@/lib/auth/permissions"
import { db } from "@/db"
import { measurementTypes, measurementEntries, measurementValues, goals } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus, TrendingUp, Shield, ArrowRight } from "lucide-react"
import { formatNumber } from "@/lib/utils/number"
import { formatDateDisplay } from "@/lib/utils/date"
import { WeightChart } from "@/components/charts/WeightChart"
import { MainLayout } from "@/components/layout/MainLayout"

export default async function DashboardPage() {
  const { user } = await requireAuth()
  const userIsAdmin = await isAdmin()

  const measures = await db.query.measurementTypes.findMany({
    where: (types, { eq }) => eq(types.userId, user.id),
    orderBy: (types, { desc }) => [desc(types.createdAt)],
  })

  const entries = await db.query.measurementEntries.findMany({
    where: (entries, { eq }) => eq(entries.userId, user.id),
    orderBy: (entries, { desc }) => [desc(entries.date)],
    limit: 30,
  })

  const values = await db.query.measurementValues.findMany({
    where: (values, { inArray }) =>
      inArray(
        values.entryId,
        entries.map((e) => e.id)
      ),
  })

  const userGoals = await db.query.goals.findMany({
    where: (goals, { eq }) => eq(goals.userId, user.id),
  })

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
          const value = values.find(
            (v) => v.entryId === entry.id && v.measureTypeId === weightMeasure.id
          )
          return value
            ? {
                date: formatDateDisplay(entry.date),
                value: value.value,
              }
            : null
        })
        .filter((d): d is { date: string; value: number } => d !== null)
        .slice(-7)
    : []

  const weightGoal = weightMeasure
    ? userGoals.find((g) => g.measureTypeId === weightMeasure.id)
    : null

  return (
    <MainLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-semibold text-white mb-2">Dashboard</h1>
          <p className="text-slate-400">Bem-vindo de volta, {user.email}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card-minimal p-6">
            <h3 className="text-sm font-medium text-minimal-muted mb-3">Último Peso</h3>
            <p className="text-3xl font-semibold text-white mb-1">
              {weightMeasure && getLatestValue(weightMeasure.id)
                ? `${formatNumber(getLatestValue(weightMeasure.id)!)} ${weightMeasure.unit}`
                : "N/A"}
            </p>
            {weightGoal && weightMeasure && (
              <p className="text-sm text-minimal-muted mt-2">
                Meta: <span className="text-blue-400 font-medium">{weightGoal.targetValue} {weightMeasure.unit}</span>
              </p>
            )}
          </div>

          <div className="card-minimal p-6">
            <h3 className="text-sm font-medium text-minimal-muted mb-3">Última Cintura</h3>
            <p className="text-3xl font-semibold text-white mb-1">
              {waistMeasure && getLatestValue(waistMeasure.id)
                ? `${formatNumber(getLatestValue(waistMeasure.id)!)} ${waistMeasure.unit}`
                : "N/A"}
            </p>
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

        <div className="flex gap-4">
          <Link href="/tracker">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Gerenciar Medidas
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          {userIsAdmin && (
            <Link href="/admin">
              <Button variant="outline" className="gap-2">
                <Shield className="h-4 w-4" />
                Painel Admin
              </Button>
            </Link>
          )}
        </div>
      </div>
    </MainLayout>
        </div>

        {weightData.length > 0 && (
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Evolução do Peso (últimos 7 dias)
            </h2>
            <WeightChart data={weightData} goal={weightGoal?.targetValue} />
          </div>
        )}

        <div className="flex gap-4">
          <Link href="/tracker">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Gerenciar Medidas
            </Button>
          </Link>
          {userIsAdmin && (
            <Link href="/admin">
              <Button variant="outline">
                <Shield className="h-4 w-4 mr-2" />
                Painel Admin
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

