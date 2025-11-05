import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { measurementValues, measurementEntries } from "@/db/schema"
import { requireAuth } from "@/lib/auth/lucia"
import { createValueSchema } from "@/lib/utils/zod"
import { eq, and } from "drizzle-orm"
import { z } from "zod"

const deleteValueSchema = z.object({
  entryId: z.number().int().positive(),
  measureTypeId: z.number().int().positive(),
})

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth()
    const body = await request.json()
    const validatedData = createValueSchema.parse(body)

    const entry = await db.query.measurementEntries.findFirst({
      where: (entries, { eq }) => eq(entries.id, validatedData.entryId),
    })

    if (!entry || entry.userId !== user.id) {
      return NextResponse.json(
        { error: "Entrada não encontrada" },
        { status: 404 }
      )
    }

    const existingValue = await db.query.measurementValues.findFirst({
      where: (values, { eq, and }) =>
        and(
          eq(values.entryId, validatedData.entryId),
          eq(values.measureTypeId, validatedData.measureTypeId)
        ),
    })

    if (existingValue) {
      const [updatedValue] = await db
        .update(measurementValues)
        .set({
          value: validatedData.value,
          updatedAt: new Date(),
        })
        .where(eq(measurementValues.id, existingValue.id))
        .returning()

      return NextResponse.json(updatedValue)
    }

    const [newValue] = await db
      .insert(measurementValues)
      .values({
        entryId: validatedData.entryId,
        measureTypeId: validatedData.measureTypeId,
        value: validatedData.value,
      })
      .returning()

    return NextResponse.json(newValue)
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Dados inválidos" },
        { status: 400 }
      )
    }
    console.error("Value POST error:", error)
    return NextResponse.json(
      { error: "Erro ao salvar valor" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { user } = await requireAuth()
    const body = await request.json()
    const validatedData = deleteValueSchema.parse(body)

    const entry = await db.query.measurementEntries.findFirst({
      where: (entries, { eq }) => eq(entries.id, validatedData.entryId),
    })

    if (!entry || entry.userId !== user.id) {
      return NextResponse.json(
        { error: "Entrada não encontrada" },
        { status: 404 }
      )
    }

    const value = await db.query.measurementValues.findFirst({
      where: (values, { eq, and }) =>
        and(
          eq(values.entryId, validatedData.entryId),
          eq(values.measureTypeId, validatedData.measureTypeId)
        ),
    })

    if (!value) {
      return NextResponse.json(
        { error: "Valor não encontrado" },
        { status: 404 }
      )
    }

    await db.delete(measurementValues).where(eq(measurementValues.id, value.id))

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Dados inválidos" },
        { status: 400 }
      )
    }
    console.error("Value DELETE error:", error)
    return NextResponse.json(
      { error: "Erro ao deletar valor" },
      { status: 500 }
    )
  }
}

