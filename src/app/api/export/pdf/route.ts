import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { measurementTypes, measurementEntries, measurementValues, goals } from "@/db/schema"
import { requireAuth } from "@/lib/auth/lucia"
import { eq, and, desc } from "drizzle-orm"
import { formatDate } from "@/lib/utils/date"

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAuth()
    const { searchParams } = new URL(request.url)
    const measureTypeId = searchParams.get("measureTypeId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    if (!measureTypeId) {
      return NextResponse.json(
        { error: "measureTypeId é obrigatório" },
        { status: 400 }
      )
    }

    const measureType = await db.query.measurementTypes.findFirst({
      where: (types, { eq, and }) =>
        and(eq(types.id, parseInt(measureTypeId)), eq(types.userId, user.id)),
    })

    if (!measureType) {
      return NextResponse.json(
        { error: "Tipo de medida não encontrado" },
        { status: 404 }
      )
    }

    const start = startDate ? new Date(startDate + "T00:00:00") : new Date()
    start.setMonth(start.getMonth() - 1) // Último mês por padrão
    const end = endDate ? new Date(endDate + "T23:59:59") : new Date()

    const entries = await db.query.measurementEntries.findMany({
      where: (entries, { eq, and, gte, lte }) =>
        and(
          eq(entries.userId, user.id),
          gte(entries.date, start),
          lte(entries.date, end)
        ),
      orderBy: (entries, { asc }) => [asc(entries.date)],
    })

    const entryIds = entries.map((e) => e.id)
    const values = entryIds.length > 0
      ? await db.query.measurementValues.findMany({
          where: (values, { eq, and, inArray }) =>
            and(
              eq(values.measureTypeId, parseInt(measureTypeId)),
              inArray(values.entryId, entryIds)
            ),
        })
      : []

    const goal = await db.query.goals.findFirst({
      where: (goals, { eq, and }) =>
        and(
          eq(goals.userId, user.id),
          eq(goals.measureTypeId, parseInt(measureTypeId))
        ),
    })

    // Criar dados para o gráfico
    const chartData = entries
      .map((entry) => {
        const value = values.find((v) => v.entryId === entry.id)
        return value
          ? {
              date: formatDate(entry.date),
              value: value.value,
            }
          : null
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)

    // Gerar HTML para PDF usando uma biblioteca simples
    // Por enquanto, retornamos JSON com os dados para o cliente gerar o PDF
    return NextResponse.json({
      measureType: {
        name: measureType.name,
        unit: measureType.unit,
      },
      goal: goal
        ? {
            targetValue: goal.targetValue,
            deadline: goal.deadline ? formatDate(goal.deadline) : null,
          }
        : null,
      data: chartData,
      period: {
        start: formatDate(start),
        end: formatDate(end),
      },
    })
  } catch (error) {
    console.error("PDF export error:", error)
    return NextResponse.json(
      { error: "Erro ao gerar PDF" },
      { status: 500 }
    )
  }
}

