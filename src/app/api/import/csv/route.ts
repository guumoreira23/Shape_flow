import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { measurementEntries, measurementValues, measurementTypes } from "@/db/schema"
import { requireAuth } from "@/lib/auth/lucia"
import { eq, and } from "drizzle-orm"
import { parseDate, formatDate } from "@/lib/utils/date"
import { z } from "zod"

const importSchema = z.object({
  csv: z.string().min(1, "CSV é obrigatório"),
})

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth()
    const body = await request.json()
    const validatedData = importSchema.parse(body)

    const csvContent = validatedData.csv
    const lines = csvContent.split("\n").filter((line) => line.trim())

    if (lines.length < 2) {
      return NextResponse.json(
        { error: "CSV deve conter pelo menos uma linha de cabeçalho e uma linha de dados" },
        { status: 400 }
      )
    }

    // Parse do cabeçalho (primeira linha)
    // Remove BOM se presente e separa por ponto e vírgula ou vírgula
    const headerLine = lines[0].replace(/^\uFEFF/, "").trim()
    const delimiter = headerLine.includes(";") ? ";" : ","
    const headers = headerLine
      .split(delimiter)
      .map((h) => h.trim().replace(/^"|"$/g, ""))
      .filter((h) => h)

    if (headers[0]?.toLowerCase() !== "data") {
      return NextResponse.json(
        { error: "A primeira coluna deve ser 'Data'" },
        { status: 400 }
      )
    }

    // Identificar medidas (colunas após "Data")
    const measureHeaders = headers.slice(1)
    const measureMap = new Map<string, { id: number; name: string; unit: string }>()

    // Buscar ou criar medidas
    for (const measureHeader of measureHeaders) {
      // Formato esperado: "Nome (unidade)" ou apenas "Nome"
      const match = measureHeader.match(/^(.+?)\s*\((.+?)\)$/)
      const measureName = match ? match[1].trim() : measureHeader.trim()
      const measureUnit = match ? match[2].trim() : ""

      if (!measureName) continue

      let measure = await db.query.measurementTypes.findFirst({
        where: (types, { eq, and }) =>
          and(eq(types.userId, user.id), eq(types.name, measureName)),
      })

      if (!measure) {
        const [newMeasure] = await db
          .insert(measurementTypes)
          .values({
            userId: user.id,
            name: measureName,
            unit: measureUnit || "un",
          })
          .returning()
        measure = newMeasure
      }

      measureMap.set(measureHeader, {
        id: measure.id,
        name: measure.name,
        unit: measure.unit,
      })
    }

    // Processar linhas de dados
    let importedCount = 0
    let skippedCount = 0
    const errors: string[] = []

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      try {
        const values = line
          .split(delimiter)
          .map((v) => v.trim().replace(/^"|"$/g, ""))

        if (values.length < 2) continue

        // Parse da data (formato brasileiro DD/MM/YYYY)
        const dateStr = values[0]
        let date: Date

        try {
          // Tentar parse de DD/MM/YYYY
          const [day, month, year] = dateStr.split("/")
          if (day && month && year) {
            date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
          } else {
            // Tentar parse ISO
            date = parseDate(dateStr)
          }
          date.setHours(0, 0, 0, 0)
        } catch {
          errors.push(`Linha ${i + 1}: Data inválida "${dateStr}"`)
          skippedCount++
          continue
        }

        // Verificar se a entrada já existe
        let entry = await db.query.measurementEntries.findFirst({
          where: (entries, { eq, and }) =>
            and(eq(entries.userId, user.id), eq(entries.date, date)),
        })

        if (!entry) {
          const [newEntry] = await db
            .insert(measurementEntries)
            .values({
              userId: user.id,
              date,
            })
            .returning()
          entry = newEntry
        }

        // Processar valores das medidas
        for (let j = 1; j < values.length && j - 1 < measureHeaders.length; j++) {
          const valueStr = values[j]?.trim()
          if (!valueStr || valueStr === "" || valueStr === "-") continue

          const measureInfo = measureMap.get(measureHeaders[j - 1])
          if (!measureInfo) continue

          // Converter valor brasileiro (vírgula como separador decimal) para número
          const normalizedValue = valueStr.replace(/\./g, "").replace(",", ".")
          const numValue = Math.round(parseFloat(normalizedValue))

          if (isNaN(numValue) || numValue <= 0) {
            errors.push(`Linha ${i + 1}, coluna ${j + 1}: Valor inválido "${valueStr}"`)
            continue
          }

          // Verificar se valor já existe
          const existingValue = await db.query.measurementValues.findFirst({
            where: (values, { eq, and }) =>
              and(
                eq(values.entryId, entry.id),
                eq(values.measureTypeId, measureInfo.id)
              ),
          })

          if (existingValue) {
            // Atualizar valor existente
            await db
              .update(measurementValues)
              .set({
                value: numValue,
                updatedAt: new Date(),
              })
              .where(eq(measurementValues.id, existingValue.id))
          } else {
            // Criar novo valor
            await db.insert(measurementValues).values({
              entryId: entry.id,
              measureTypeId: measureInfo.id,
              value: numValue,
            })
          }
        }

        importedCount++
      } catch (error: any) {
        errors.push(`Linha ${i + 1}: ${error.message || "Erro ao processar"}`)
        skippedCount++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Importação concluída: ${importedCount} linha(s) importada(s), ${skippedCount} linha(s) ignorada(s)`,
      imported: importedCount,
      skipped: skippedCount,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error: any) {
    if (error?.name === "ZodError" || error?.issues) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.issues || error.errors },
        { status: 400 }
      )
    }
    console.error("CSV import error:", error)
    return NextResponse.json(
      { error: error?.message || "Erro ao importar CSV" },
      { status: 500 }
    )
  }
}

