import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/lucia"

// Rota para verificar se o usuário está autenticado
export async function GET(request: NextRequest) {
  try {
    const { user, session } = await getSession()
    
    return NextResponse.json({
      authenticated: !!user && !!session,
      userId: user?.id,
      email: user?.email,
      role: user?.role,
      hasSession: !!session,
    })
  } catch (error: any) {
    return NextResponse.json({
      authenticated: false,
      error: error.message,
    }, { status: 500 })
  }
}

