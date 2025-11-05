"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { loginSchema } from "@/lib/utils/zod"
import { useToast } from "@/components/ui/use-toast"

const REMEMBER_ME_KEY = "shapeflow_remember_me"
const REMEMBERED_EMAIL_KEY = "shapeflow_remembered_email"

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Carregar email salvo ao montar o componente
  useEffect(() => {
    const rememberedEmail = localStorage.getItem(REMEMBERED_EMAIL_KEY)
    const shouldRemember = localStorage.getItem(REMEMBER_ME_KEY) === "true"
    
    if (shouldRemember && rememberedEmail) {
      setEmail(rememberedEmail)
      setRememberMe(true)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const validatedData = loginSchema.parse({ email, password })

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validatedData),
        credentials: "include", // Importante: incluir cookies na requisição
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao fazer login")
      }

      // Salvar email se "Lembrar-me" estiver marcado
      if (rememberMe) {
        localStorage.setItem(REMEMBER_ME_KEY, "true")
        localStorage.setItem(REMEMBERED_EMAIL_KEY, validatedData.email)
      } else {
        localStorage.removeItem(REMEMBER_ME_KEY)
        localStorage.removeItem(REMEMBERED_EMAIL_KEY)
      }

      // Verificar se o cookie foi definido antes de redirecionar
      // Aguardar um pouco para garantir que o cookie seja processado pelo navegador
      await new Promise((resolve) => setTimeout(resolve, 300))
      
      // Verificar autenticação antes de redirecionar
      try {
        const checkResponse = await fetch("/api/auth/check", {
          credentials: "include",
        })
        const checkData = await checkResponse.json()
        
        if (checkData.authenticated) {
          toast({
            title: "Login realizado com sucesso!",
          })
          // Usar window.location para garantir que a navegação aconteça com os cookies
          window.location.href = "/dashboard"
        } else {
          throw new Error("Falha na autenticação. Tente novamente.")
        }
      } catch (checkError) {
        console.error("Erro ao verificar autenticação:", checkError)
        toast({
          title: "Erro ao fazer login",
          description: "O cookie não foi definido corretamente. Tente novamente.",
          variant: "destructive",
        })
        setIsLoading(false)
      }
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
          <div className="flex items-center space-x-2">
            <Checkbox
              id="remember"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked === true)}
            />
            <Label
              htmlFor="remember"
              className="text-sm font-normal cursor-pointer text-slate-400 hover:text-slate-200"
            >
              Lembrar usuário e senha
            </Label>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Entrando..." : "Entrar"}
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

