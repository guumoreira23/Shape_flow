import { NextRequest, NextResponse } from "next/server"
import ExcelJS from "exceljs"
import { requireAuth } from "@/lib/auth/lucia"
import { db } from "@/db"
import { formatDateCSV } from "@/lib/utils/date"
import { inArray } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAuth()

    const measures = await db.query.measurementTypes.findMany({
      where: (types, { eq }) => eq(types.userId, user.id),
      orderBy: (types, { asc }) => [asc(types.createdAt)],
    })

    const entries = await db.query.measurementEntries.findMany({
      where: (entries, { eq }) => eq(entries.userId, user.id),
      orderBy: (entries, { asc }) => [asc(entries.date)],
    })

    const entryIds = entries.map((entry) => entry.id)
    const values =
      entryIds.length > 0
        ? await db.query.measurementValues.findMany({
            where: (values, { inArray }) =>
              inArray(values.entryId, entryIds),
          })
        : []

    const workbook = new ExcelJS.Workbook()
    workbook.creator = "ShapeFlow"
    workbook.subject = "Exportação de medidas corporais"
    const worksheet = workbook.addWorksheet("Medidas")

    worksheet.views = [{ state: "frozen", xSplit: 1, ySplit: 1 }]

    const columns: Partial<ExcelJS.Column>[] = [
      {
        header: "Data",
        key: "date",
        width: 18,
      },
      ...measures.map(
        (measure): Partial<ExcelJS.Column> => ({
          header: `${measure.name} (${measure.unit})`,
          key: `measure-${measure.id}`,
          width: 18,
          style: {
            alignment: { horizontal: "center" },
            numFmt: "#,##0.00",
          },
        })
      ),
    ]

    worksheet.columns = columns

    entries.forEach((entry) => {
      const row: Record<string, string | number | null> = {
        date: formatDateCSV(entry.date),
      }

      measures.forEach((measure) => {
        const value = values.find(
          (v) =>
            v.entryId === entry.id && v.measureTypeId === measure.id
        )
        row[`measure-${measure.id}`] =
          typeof value?.value === "number" ? value.value : null
      })

      worksheet.addRow(row)
    })

    worksheet.getRow(1).font = {
      bold: true,
      color: { argb: "FFFFFFFF" },
    }
    worksheet.getRow(1).alignment = { horizontal: "center" }
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1F2937" },
    }

    worksheet.eachRow((row, rowNumber) => {
      row.border = {
        top: { style: "thin", color: { argb: "FF1F2937" } },
        left: { style: "thin", color: { argb: "FF1F2937" } },
        bottom: { style: "thin", color: { argb: "FF1F2937" } },
        right: { style: "thin", color: { argb: "FF1F2937" } },
      }

      if (rowNumber > 1) {
        row.getCell(1).alignment = { horizontal: "center" }
      }
    })

    const buffer = await workbook.xlsx.writeBuffer()

    const fileName = `shapeflow-dados-${formatDateCSV(new Date()).replace(
      /\//g,
      "-"
    )}.xlsx`

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    })
  } catch (error) {
    console.error("XLS export error:", error)
    return NextResponse.json(
      { error: "Erro ao exportar dados em XLS" },
      { status: 500 }
    )
  }
}


