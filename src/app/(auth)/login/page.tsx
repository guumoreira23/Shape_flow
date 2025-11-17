"use client"

import { Suspense, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { loginSchema } from "@/lib/utils/zod"
import { useToast } from "@/components/ui/use-toast"

function LoginForm() {
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectFrom = searchParams.get("from")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const validatedData = loginSchema.parse({ email, password })

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validatedData),
        credentials: "include",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao fazer login")
      }

      toast({
        title: "Login realizado com sucesso!",
      })

      // Usar router.push com refresh para garantir que o cookie seja propagado
      // O refresh garante que o servidor leia o cookie atualizado
      startTransition(() => {
        router.push(redirectFrom || "/dashboard")
        router.refresh()
      })
    } catch (error: any) {
      toast({
        title: "Erro ao fazer login",
        description: error.message || "Verifique suas credenciais",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md space-y-8 card-minimal p-8">
        <div>
          <h2 className="text-3xl font-bold text-center text-white">
            ShapeFlow
          </h2>
          <p className="mt-2 text-center text-slate-400">
            Faça login na sua conta
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading || isPending}>
            {isLoading || isPending ? "Entrando..." : "Entrar"}
          </Button>
        </form>
        <p className="text-center text-sm text-slate-400">
          Não tem uma conta?{" "}
          <Link href="/register" className="text-blue-400 hover:underline">
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}

