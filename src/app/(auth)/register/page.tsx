"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { registerSchema } from "@/lib/utils/zod"
import { useToast } from "@/components/ui/use-toast"

export default function RegisterPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const validatedData = registerSchema.parse({
        email,
        password,
        confirmPassword,
      })

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: validatedData.email,
          password: validatedData.password,
          confirmPassword: validatedData.confirmPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Se for erro de validação, lançar com detalhes
        if (data.details) {
          throw { message: data.error, details: data.details }
        }
        throw new Error(data.error || "Erro ao criar conta")
      }

      toast({
        title: "Conta criada com sucesso!",
      })

      router.push("/dashboard")
      router.refresh()
    } catch (error: any) {
      let errorMessage = "Erro ao criar conta"
      
      if (error.message) {
        errorMessage = error.message
      } else if (error.details) {
        // Se for erro de validação Zod
        const firstError = Array.isArray(error.details) ? error.details[0] : null
        if (firstError?.message) {
          errorMessage = firstError.message
        }
      }
      
      toast({
        title: "Erro ao criar conta",
        description: errorMessage || "Verifique os dados informados",
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
            Crie sua conta gratuitamente
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
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
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirmar Senha</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Criando conta..." : "Criar conta"}
          </Button>
        </form>
        <p className="text-center text-sm text-slate-400">
          Já tem uma conta?{" "}
          <Link href="/login" className="text-blue-400 hover:underline">
            Faça login
          </Link>
        </p>
      </div>
    </div>
  )
}

