import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { measurementTypes, measurementEntries, measurementValues } from "@/db/schema"
import { requireAuth } from "@/lib/auth/lucia"
import { eq } from "drizzle-orm"
import { formatDate } from "@/lib/utils/date"

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAuth()

    // Buscar todas as medidas do usuário
    const measures = await db.query.measurementTypes.findMany({
      where: (types, { eq }) => eq(types.userId, user.id),
      orderBy: (types, { asc }) => [asc(types.createdAt)],
    })

    // Buscar todas as entradas ordenadas por data
    const entries = await db.query.measurementEntries.findMany({
      where: (entries, { eq }) => eq(entries.userId, user.id),
      orderBy: (entries, { asc }) => [asc(entries.date)],
    })

    // Buscar todos os valores
    const values = await db.query.measurementValues.findMany({
      where: (values, { inArray }) =>
        inArray(
          values.entryId,
          entries.map((e) => e.id)
        ),
    })

    // Criar estrutura de dados para CSV
    // Linhas = datas, Colunas = medidas
    const csvRows: string[] = []

    // Cabeçalho: Data, Medida1, Medida2, ...
    const header = ["Data", ...measures.map((m) => `${m.name} (${m.unit})`)]
    csvRows.push(header.join(","))

    // Para cada data, criar uma linha com os valores
    entries.forEach((entry) => {
      const row: (string | number)[] = [formatDate(entry.date)]

      measures.forEach((measure) => {
        const value = values.find(
          (v) => v.entryId === entry.id && v.measureTypeId === measure.id
        )
        row.push(value ? value.value : "")
      })

      csvRows.push(row.join(","))
    })

    const csvContent = csvRows.join("\n")

    // Retornar como arquivo CSV
    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="shapeflow-dados-${formatDate(new Date())}.csv"`,
      },
    })
  } catch (error) {
    console.error("CSV export error:", error)
    return NextResponse.json(
      { error: "Erro ao exportar dados" },
      { status: 500 }
    )
  }
}

