import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { measurementTypes } from "@/db/schema"
import { requireAuth } from "@/lib/auth/lucia"
import { eq, and } from "drizzle-orm"
import { z } from "zod"

const updateMeasureTypeSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").optional(),
  unit: z.string().min(1, "Unidade é obrigatória").optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireAuth()
    const { id } = await params
    const measureId = parseInt(id, 10)

    if (isNaN(measureId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = updateMeasureTypeSchema.parse(body)

    const measureType = await db.query.measurementTypes.findFirst({
      where: (types, { eq, and }) =>
        and(eq(types.id, measureId), eq(types.userId, user.id)),
    })

    if (!measureType) {
      return NextResponse.json(
        { error: "Tipo de medida não encontrado" },
        { status: 404 }
      )
    }

    const updateData: { name?: string; unit?: string } = {}
    if (validatedData.name !== undefined) updateData.name = validatedData.name
    if (validatedData.unit !== undefined) updateData.unit = validatedData.unit

    const [updated] = await db
      .update(measurementTypes)
      .set(updateData)
      .where(eq(measurementTypes.id, measureId))
      .returning()

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })
    }
    console.error("Measure types PATCH error:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar tipo de medida" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireAuth()
    const { id } = await params
    const measureId = parseInt(id, 10)

    if (isNaN(measureId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    const measureType = await db.query.measurementTypes.findFirst({
      where: (types, { eq, and }) =>
        and(eq(types.id, measureId), eq(types.userId, user.id)),
    })

    if (!measureType) {
      return NextResponse.json(
        { error: "Tipo de medida não encontrado" },
        { status: 404 }
      )
    }

    await db
      .delete(measurementTypes)
      .where(eq(measurementTypes.id, measureId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Measure types DELETE error:", error)
    return NextResponse.json(
      { error: "Erro ao deletar tipo de medida" },
      { status: 500 }
    )
  }
}

