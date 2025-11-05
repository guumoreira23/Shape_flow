import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { measurementTypes, measurementEntries, measurementValues } from "@/db/schema"
import { requireAuth } from "@/lib/auth/lucia"
import { eq } from "drizzle-orm"
import { formatDateCSV } from "@/lib/utils/date"
import { formatNumberCSV } from "@/lib/utils/number"

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

    // Função para escapar valores CSV (adicionar aspas se necessário)
    const escapeCSV = (value: string | number): string => {
      const str = String(value)
      // Se contém vírgula, ponto e vírgula, quebra de linha ou aspas, precisa de aspas
      if (str.includes(",") || str.includes(";") || str.includes("\n") || str.includes('"')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }

    // Criar estrutura de dados para CSV no padrão brasileiro
    // Linhas = datas, Colunas = medidas
    const csvRows: string[] = []

    // Cabeçalho: Data, Medida1, Medida2, ...
    const header = ["Data", ...measures.map((m) => escapeCSV(`${m.name} (${m.unit})`))]
    csvRows.push(header.join(";"))

    // Para cada data, criar uma linha com os valores formatados no padrão brasileiro
    entries.forEach((entry) => {
      const row: string[] = [escapeCSV(formatDateCSV(entry.date))]

      measures.forEach((measure) => {
        const value = values.find(
          (v) => v.entryId === entry.id && v.measureTypeId === measure.id
        )
        if (value) {
          // Formatar número no padrão brasileiro (vírgula como separador decimal)
          // O valor já está armazenado como número inteiro (em centímetros, gramas, etc)
          row.push(escapeCSV(formatNumberCSV(value.value, 0)))
        } else {
          row.push("")
        }
      })

      csvRows.push(row.join(";"))
    })

    const csvContent = csvRows.join("\n")
    
    // Adicionar BOM UTF-8 para compatibilidade com Excel brasileiro
    const BOM = "\uFEFF"
    const csvWithBOM = BOM + csvContent

    // Retornar como arquivo CSV
    return new NextResponse(csvWithBOM, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="shapeflow-dados-${formatDateCSV(new Date()).replace(/\//g, "-")}.csv"`,
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

