import { NextResponse, type NextRequest } from "next/server"

// Nome do cookie de sessão - deve corresponder ao usado pelo Lucia
// O padrão do Lucia v3 é "auth_session"
const AUTH_COOKIE_NAME = "auth_session"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Verificar cookie de sessão - o Lucia usa "auth_session" por padrão
  const sessionCookie = request.cookies.get(AUTH_COOKIE_NAME)
  const hasSession = !!sessionCookie?.value && sessionCookie.value.length > 0

  // Apenas redirecionar usuários autenticados que tentam acessar login
  // Deixar as rotas protegidas serem validadas pelo próprio componente/page
  // Isso evita problemas de timing com cookies recém-definidos no Edge Runtime
  if (pathname === "/login" && hasSession) {
    const redirectUrl = new URL("/dashboard", request.url)
    return NextResponse.redirect(redirectUrl)
  }

  // Não bloquear rotas protegidas no middleware - deixar a validação nas páginas
  // O middleware do Next.js Edge Runtime pode ter problemas com cookies recém-definidos
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Proteger apenas rotas de páginas (não incluir /api/*)
    "/dashboard/:path*",
    "/admin/:path*",
    "/tracker/:path*",
    "/login",
  ],
}


