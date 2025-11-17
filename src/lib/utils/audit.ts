import { db } from "@/db"
import { auditLogs } from "@/db/schema"

export interface AuditLogData {
  userId: string
  action: "create" | "update" | "delete" | "view" | "export"
  entityType: string
  entityId?: string | number
  details?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}

export async function logAudit(data: AuditLogData) {
  try {
    await db.insert(auditLogs).values({
      userId: data.userId,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId ? String(data.entityId) : null,
      details: data.details ? JSON.stringify(data.details) : null,
      ipAddress: data.ipAddress || null,
      userAgent: data.userAgent || null,
    })
  } catch (error) {
    // Não falhar a operação principal se o log falhar
    console.error("Erro ao registrar auditoria:", error)
  }
}

