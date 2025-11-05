import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { measurementTypes } from "@/db/schema"
import { requireAuth } from "@/lib/auth/lucia"
import { createMeasureTypeSchema } from "@/lib/utils/zod"

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAuth()

    const measureTypes = await db.query.measurementTypes.findMany({
      where: (types, { eq }) => eq(types.userId, user.id),
      orderBy: (types, { asc }) => [asc(types.createdAt)],
    })

    return NextResponse.json(measureTypes)
  } catch (error) {
    console.error("Measure types GET error:", error)
    return NextResponse.json(
      { error: "Erro ao buscar tipos de medida" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth()
    const body = await request.json()
    const validatedData = createMeasureTypeSchema.parse(body)

    // Verificar se já existe medida com o mesmo nome para o usuário
    const existingMeasure = await db.query.measurementTypes.findFirst({
      where: (types, { eq, and }) =>
        and(eq(types.userId, user.id), eq(types.name, validatedData.name)),
    })

    if (existingMeasure) {
      return NextResponse.json(
        { error: "Já existe uma medida com este nome" },
        { status: 400 }
      )
    }

    const [newMeasureType] = await db
      .insert(measurementTypes)
      .values({
        userId: user.id,
        name: validatedData.name,
        unit: validatedData.unit,
      })
      .returning()

    return NextResponse.json(newMeasureType, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Dados inválidos" },
        { status: 400 }
      )
    }
    console.error("Measure types POST error:", error)
    return NextResponse.json(
      { error: "Erro ao criar tipo de medida" },
      { status: 500 }
    )
  }
}

