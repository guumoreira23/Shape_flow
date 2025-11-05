import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { measurementEntries } from "@/db/schema"
import { requireAuth } from "@/lib/auth/lucia"
import { createDateSchema } from "@/lib/utils/zod"
import { getTodayDate, parseDate, formatDate } from "@/lib/utils/date"
import { eq, and } from "drizzle-orm"

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth()
    const body = await request.json()
    const validatedData = createDateSchema.parse(body)

    let date: Date
    if (validatedData.date) {
      date = parseDate(validatedData.date)
    } else {
      date = getTodayDate()
    }
    
    // Validar se a data não é muito no futuro (máximo 1 ano)
    const maxDate = new Date()
    maxDate.setFullYear(maxDate.getFullYear() + 1)
    if (date > maxDate) {
      return NextResponse.json(
        { error: "Data não pode ser mais de 1 ano no futuro" },
        { status: 400 }
      )
    }
    
    const dateString = formatDate(date)

    const existingEntry = await db.query.measurementEntries.findFirst({
      where: (entries, { eq, and }) =>
        and(
          eq(entries.userId, user.id),
          eq(entries.date, date)
        ),
    })

    if (existingEntry) {
      return NextResponse.json(existingEntry)
    }

    const [newEntry] = await db
      .insert(measurementEntries)
      .values({
        userId: user.id,
        date,
      })
      .returning()

    return NextResponse.json({
      ...newEntry,
      date: dateString,
    })
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Dados inválidos" },
        { status: 400 }
      )
    }
    console.error("Date POST error:", error)
    return NextResponse.json(
      { error: "Erro ao criar data" },
      { status: 500 }
    )
  }
}

