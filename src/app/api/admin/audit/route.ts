import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { auditLogs } from "@/db/schema"
import { requireAdmin } from "@/lib/auth/permissions"
import { eq, desc, and, gte, lte, ilike } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const action = searchParams.get("action")
    const entityType = searchParams.get("entityType")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const limit = parseInt(searchParams.get("limit") || "100")

    let query = db.query.auditLogs.findMany({
      orderBy: (logs, { desc }) => [desc(logs.createdAt)],
      limit,
    })

    // Aplicar filtros
    const conditions: any[] = []

    if (userId) {
      conditions.push(eq(auditLogs.userId, userId))
    }
    if (action) {
      conditions.push(eq(auditLogs.action, action))
    }
    if (entityType) {
      conditions.push(ilike(auditLogs.entityType, `%${entityType}%`))
    }
    if (startDate) {
      conditions.push(gte(auditLogs.createdAt, new Date(startDate)))
    }
    if (endDate) {
      conditions.push(lte(auditLogs.createdAt, new Date(endDate)))
    }

    if (conditions.length > 0) {
      query = db.query.auditLogs.findMany({
        where: (logs, { and }) => and(...conditions),
        orderBy: (logs, { desc }) => [desc(logs.createdAt)],
        limit,
      })
    }

    const logs = await query

    return NextResponse.json(logs)
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      )
    }
    console.error("Audit GET error:", error)
    return NextResponse.json(
      { error: "Erro ao buscar logs de auditoria" },
      { status: 500 }
    )
  }
}

