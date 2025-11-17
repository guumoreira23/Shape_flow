import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { waterIntake } from "@/db/schema"
import { requireAuth } from "@/lib/auth/lucia"
import { eq, and, gte, lte } from "drizzle-orm"
import { formatDate } from "@/lib/utils/date"

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAuth()
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date") // Formato: YYYY-MM-DD

    let entries
    if (date) {
      const startDate = new Date(date + "T00:00:00")
      const endDate = new Date(date + "T23:59:59")
      entries = await db.query.waterIntake.findMany({
        where: (intake, { eq, and, gte, lte }) =>
          and(
            eq(intake.userId, user.id),
            gte(intake.date, startDate),
            lte(intake.date, endDate)
          ),
        orderBy: (intake, { asc }) => [asc(intake.timestamp)],
      })
    } else {
      entries = await db.query.waterIntake.findMany({
        where: (intake, { eq }) => eq(intake.userId, user.id),
        orderBy: (intake, { desc }) => [desc(intake.timestamp)],
        limit: 100,
      })
    }

    return NextResponse.json(entries)
  } catch (error: any) {
    console.error("Water GET error:", error)
    if (error.status === 401 || error.message === "Unauthorized") {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: "Erro ao buscar consumo de água", details: process.env.NODE_ENV === "development" ? error.message : undefined },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth()
    const body = await request.json()

    const { amount, date } = body

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Quantidade inválida" },
        { status: 400 }
      )
    }

    const intakeDate = date ? new Date(date + "T12:00:00") : new Date()

    const [newIntake] = await db
      .insert(waterIntake)
      .values({
        userId: user.id,
        amount: parseInt(amount),
        timestamp: new Date(),
        date: intakeDate,
      })
      .returning()

    return NextResponse.json(newIntake, { status: 201 })
  } catch (error) {
    console.error("Water POST error:", error)
    return NextResponse.json(
      { error: "Erro ao registrar consumo de água" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { user } = await requireAuth()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "ID não fornecido" },
        { status: 400 }
      )
    }

    const intake = await db.query.waterIntake.findFirst({
      where: (intake, { eq, and }) =>
        and(eq(intake.id, parseInt(id)), eq(intake.userId, user.id)),
    })

    if (!intake) {
      return NextResponse.json(
        { error: "Registro não encontrado" },
        { status: 404 }
      )
    }

    await db.delete(waterIntake).where(eq(waterIntake.id, intake.id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Water DELETE error:", error)
    return NextResponse.json(
      { error: "Erro ao deletar registro" },
      { status: 500 }
    )
  }
}

