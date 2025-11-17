import { cookies } from "next/headers"
import { db } from "@/db"
import { measurementTypes, measurementEntries, measurementValues, goals } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { lucia } from "@/lib/auth/lucia"
import { DashboardClient } from "./DashboardClient"

export default async function DashboardPage() {
  // Buscar dados do servidor para SSR inicial
  // A validação de autenticação será feita no cliente via /api/auth/check
  const cookieStore = await cookies()
  const sessionId = cookieStore.get(lucia.sessionCookieName)?.value

  let user = null
  let measures: any[] = []
  let entries: any[] = []
  let values: any[] = []
  let userGoals: any[] = []

  // Tentar buscar dados se houver sessão (para SSR otimizado)
  if (sessionId) {
    try {
      const validation = await lucia.validateSession(sessionId)
      if (validation.session && validation.user) {
        user = validation.user
        const userId = validation.user.id

        measures = await db.query.measurementTypes.findMany({
          where: (types, { eq }) => eq(types.userId, userId),
          orderBy: (types, { desc }) => [desc(types.createdAt)],
        })

        entries = await db.query.measurementEntries.findMany({
          where: (entries, { eq }) => eq(entries.userId, userId),
          orderBy: (entries, { desc }) => [desc(entries.date)],
          limit: 30,
        })

        values = await db.query.measurementValues.findMany({
          where: (values, { inArray }) =>
            inArray(
              values.entryId,
              entries.map((e) => e.id)
            ),
        })

        userGoals = await db.query.goals.findMany({
          where: (goals, { eq }) => eq(goals.userId, userId),
        })
      }
    } catch (error) {
      // Se houver erro, deixar o cliente fazer a validação
      console.error("Erro ao buscar dados do dashboard:", error)
    }
  }

  // Se não houver dados, passar estrutura vazia (cliente fará validação)
  const initialData = {
    user: user || { email: "", role: "user" },
    measures: measures.map((m) => ({
      id: m.id,
      name: m.name,
      unit: m.unit,
    })),
    entries: entries.map((e) => ({
      id: e.id,
      date: e.date,
    })),
    values: values.map((v) => ({
      id: v.id,
      entryId: v.entryId,
      measureTypeId: v.measureTypeId,
      value: v.value,
    })),
    goals: userGoals.map((g) => ({
      id: g.id,
      measureTypeId: g.measureTypeId,
      targetValue: g.targetValue,
    })),
  }

  return <DashboardClient initialData={initialData} />
}

