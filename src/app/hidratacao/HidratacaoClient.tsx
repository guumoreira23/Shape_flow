"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { MainLayout } from "@/components/layout/MainLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Target, Droplet, Trash2 } from "lucide-react"
import { formatDate, getTodayDate } from "@/lib/utils/date"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"

interface WaterIntake {
  id: number
  amount: number
  timestamp: string
  date: string
}

interface WaterGoal {
  id: number
  targetAmount: number
}

interface HidratacaoClientProps {
  userIsAdmin?: boolean
}

const QUICK_AMOUNTS = [100, 200, 250, 300, 500, 1000] // ml

export function HidratacaoClient({ userIsAdmin = false }: HidratacaoClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [intakes, setIntakes] = useState<WaterIntake[]>([])
  const [waterGoal, setWaterGoal] = useState<WaterGoal | null>(null)
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false)
  const [isCustomDialogOpen, setIsCustomDialogOpen] = useState(false)
  const [customAmount, setCustomAmount] = useState("200")
  const [goalAmount, setGoalAmount] = useState("2000")

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/check", {
          credentials: "include",
        })
        const data = await response.json()

        if (data.authenticated) {
          setIsAuthenticated(true)
          await loadData()
        } else {
          setIsAuthenticated(false)
          router.replace("/login")
        }
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error)
        setIsAuthenticated(false)
        router.replace("/login")
      } finally {
        setIsLoading(false)
      }
    }
    checkAuth()
  }, [router])

  const loadData = async () => {
    try {
      const dateString = formatDate(selectedDate)

      const [intakesResponse, goalResponse] = await Promise.all([
        fetch(`/api/water?date=${dateString}`, { credentials: "include" }),
        fetch("/api/water-goals", { credentials: "include" }),
      ])

      if (!intakesResponse.ok || !goalResponse.ok) {
        if (intakesResponse.status === 401 || goalResponse.status === 401) {
          router.replace("/login")
          return
        }
        throw new Error("Erro ao carregar dados")
      }

      const intakesData = await intakesResponse.json()
      const goalData = await goalResponse.json()

      setIntakes(intakesData)
      setWaterGoal(goalData)
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "Erro ao carregar dados",
        variant: "destructive",
      })
    }
  }

  const addWater = async (amount: number) => {
    try {
      const dateString = formatDate(selectedDate)

      const response = await fetch("/api/water", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          amount,
          date: dateString,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao adicionar água")
      }

      toast({
        title: `${amount}ml adicionados!`,
      })

      setIsCustomDialogOpen(false)
      setCustomAmount("200")
      await loadData()
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar água",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const deleteIntake = async (id: number) => {
    try {
      const response = await fetch(`/api/water?id=${id}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!response.ok) throw new Error("Erro ao remover registro")

      toast({
        title: "Registro removido",
      })

      await loadData()
    } catch (error: any) {
      toast({
        title: "Erro ao remover registro",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleSaveGoal = async () => {
    try {
      const response = await fetch("/api/water-goals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          targetAmount: parseInt(goalAmount),
        }),
      })

      if (!response.ok) throw new Error("Erro ao salvar meta")

      const updatedGoal = await response.json()
      setWaterGoal(updatedGoal)
      setIsGoalDialogOpen(false)
      toast({
        title: "Meta atualizada com sucesso!",
      })
    } catch (error: any) {
      toast({
        title: "Erro ao salvar meta",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const totalAmount = intakes.reduce((sum, intake) => sum + intake.amount, 0)
  const progress = waterGoal ? (totalAmount / waterGoal.targetAmount) * 100 : 0

  useEffect(() => {
    if (isAuthenticated && selectedDate) {
      loadData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, isAuthenticated])

  useEffect(() => {
    if (waterGoal) {
      setGoalAmount(waterGoal.targetAmount.toString())
    }
  }, [waterGoal])

  if (isLoading || isAuthenticated === null) {
    return (
      <MainLayout userIsAdmin={userIsAdmin}>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </MainLayout>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <MainLayout userIsAdmin={userIsAdmin}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-semibold text-white mb-1">Hidratação</h1>
            <p className="text-minimal-muted">Acompanhe seu consumo de água diário</p>
          </div>
          <Button variant="outline" onClick={() => setIsGoalDialogOpen(true)}>
            <Target className="h-4 w-4 mr-2" />
            Meta
          </Button>
        </div>

        {/* Seleção de data */}
        <div className="card-minimal p-4">
          <Label className="mb-2 block">Data</Label>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            className="rounded-md border"
          />
        </div>

        {/* Resumo */}
        <div className="card-minimal p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Droplet className="h-8 w-8 text-blue-400" />
              <div>
                <div className="text-sm text-minimal-muted">Consumo de Hoje</div>
                <div className="text-3xl font-bold text-white">
                  {totalAmount}ml
                  {waterGoal && (
                    <span className="text-lg font-normal text-minimal-muted ml-2">
                      / {waterGoal.targetAmount}ml
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-minimal-muted">Progresso</div>
              <div className="text-2xl font-bold text-blue-400">
                {Math.min(100, Math.round(progress))}%
              </div>
            </div>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-4">
            <div
              className="bg-gradient-to-r from-blue-500 to-cyan-500 h-4 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
        </div>

        {/* Botões rápidos */}
        <div className="card-minimal p-4">
          <Label className="mb-3 block">Adicionar Água</Label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {QUICK_AMOUNTS.map((amount) => (
              <Button
                key={amount}
                variant="outline"
                onClick={() => addWater(amount)}
                className="flex flex-col h-auto py-3"
              >
                <Droplet className="h-5 w-5 mb-1" />
                <span className="text-xs">{amount}ml</span>
              </Button>
            ))}
            <Button
              variant="outline"
              onClick={() => setIsCustomDialogOpen(true)}
              className="flex flex-col h-auto py-3"
            >
              <Plus className="h-5 w-5 mb-1" />
              <span className="text-xs">Custom</span>
            </Button>
          </div>
        </div>

        {/* Histórico do dia */}
        <div className="card-minimal p-4">
          <Label className="mb-3 block">Registros de Hoje</Label>
          {intakes.length > 0 ? (
            <div className="space-y-2">
              {intakes.map((intake) => (
                <div
                  key={intake.id}
                  className="flex justify-between items-center p-3 bg-slate-900/50 rounded"
                >
                  <div>
                    <div className="text-white font-medium">{intake.amount}ml</div>
                    <div className="text-xs text-minimal-muted">
                      {format(new Date(intake.timestamp), "HH:mm")}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteIntake(intake.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-minimal-muted">Nenhum registro hoje</p>
          )}
        </div>

        {/* Dialog de meta */}
        <Dialog open={isGoalDialogOpen} onOpenChange={setIsGoalDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Meta Diária de Água</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Quantidade (ml)</Label>
                <Input
                  type="number"
                  value={goalAmount}
                  onChange={(e) => setGoalAmount(e.target.value)}
                  placeholder="2000"
                />
                <p className="text-xs text-minimal-muted mt-1">
                  Recomendação: 2000ml (2L) por dia
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsGoalDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveGoal}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de quantidade customizada */}
        <Dialog open={isCustomDialogOpen} onOpenChange={setIsCustomDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Água</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Quantidade (ml)</Label>
                <Input
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="200"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCustomDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={() => addWater(parseInt(customAmount) || 200)}>
                Adicionar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  )
}

