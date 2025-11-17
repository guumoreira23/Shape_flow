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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { Play, Pause, Square, Clock, Target } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface FastingSchedule {
  id: number
  fastingType: string
  startTime: string
  endTime: string
  isActive: number
}

interface JejumClientProps {
  userIsAdmin?: boolean
}

const FASTING_TYPES = [
  { value: "16:8", label: "16:8 (16h jejum, 8h alimentação)" },
  { value: "14:10", label: "14:10 (14h jejum, 10h alimentação)" },
  { value: "18:6", label: "18:6 (18h jejum, 6h alimentação)" },
  { value: "20:4", label: "20:4 (20h jejum, 4h alimentação)" },
  { value: "12:12", label: "12:12 (12h jejum, 12h alimentação)" },
  { value: "custom", label: "Personalizado" },
]

export function JejumClient({ userIsAdmin = false }: JejumClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [schedules, setSchedules] = useState<FastingSchedule[]>([])
  const [activeSchedule, setActiveSchedule] = useState<FastingSchedule | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<string>("00:00:00")
  const [isFasting, setIsFasting] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedType, setSelectedType] = useState("16:8")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/check", {
          credentials: "include",
        })
        const data = await response.json()

        if (data.authenticated) {
          setIsAuthenticated(true)
          await loadSchedules()
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

  useEffect(() => {
    if (activeSchedule) {
      const interval = setInterval(() => {
        updateTimer()
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [activeSchedule])

  const loadSchedules = async () => {
    try {
      const response = await fetch("/api/fasting", {
        credentials: "include",
      })

      if (!response.ok) {
        if (response.status === 401) {
          router.replace("/login")
          return
        }
        throw new Error("Erro ao carregar jejuns")
      }

      const data = await response.json()
      setSchedules(data)

      const active = data.find((s: FastingSchedule) => s.isActive === 1)
      if (active) {
        setActiveSchedule(active)
        updateTimer(active)
      }
    } catch (error) {
      console.error("Error loading schedules:", error)
      toast({
        title: "Erro ao carregar jejuns",
        variant: "destructive",
      })
    }
  }

  const updateTimer = (schedule?: FastingSchedule) => {
    const currentSchedule = schedule || activeSchedule
    if (!currentSchedule) return

    const now = new Date()
    const start = new Date(currentSchedule.startTime)
    const end = new Date(currentSchedule.endTime)

    // Determinar se está em jejum ou alimentação
    const isCurrentlyFasting = now >= start && now < end
    setIsFasting(isCurrentlyFasting)

    let targetTime: Date
    if (isCurrentlyFasting) {
      targetTime = end // Tempo até o fim do jejum
    } else if (now < start) {
      targetTime = start // Tempo até o início do jejum
    } else {
      // Jejum terminou, calcular próximo ciclo
      const nextStart = new Date(end)
      const fastingHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
      const eatingHours = 24 - fastingHours
      nextStart.setHours(nextStart.getHours() + eatingHours)
      targetTime = nextStart
    }

    const diff = targetTime.getTime() - now.getTime()

    if (diff <= 0) {
      setTimeRemaining("00:00:00")
      // Notificar quando o período terminar
      if (isCurrentlyFasting) {
        toast({
          title: "🎉 Período de jejum terminou!",
          description: "Você pode começar a se alimentar agora.",
        })
      } else {
        toast({
          title: "⏰ Período de alimentação terminou!",
          description: "Inicie o jejum agora.",
        })
      }
      return
    }

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

    setTimeRemaining(
      `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    )
  }

  const startFasting = async () => {
    try {
      if (!startTime) {
        toast({
          title: "Informe o horário de início",
          variant: "destructive",
        })
        return
      }

      let body: any = {
        fastingType: selectedType,
        startTime: new Date(startTime).toISOString(),
      }

      if (selectedType === "custom") {
        if (!endTime) {
          toast({
            title: "Informe o horário de fim para jejum personalizado",
            variant: "destructive",
          })
          return
        }
        body.endTime = new Date(endTime).toISOString()
      }

      const response = await fetch("/api/fasting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao iniciar jejum")
      }

      toast({
        title: "Jejum iniciado com sucesso!",
      })

      setIsDialogOpen(false)
      setStartTime("")
      setEndTime("")
      await loadSchedules()
    } catch (error: any) {
      toast({
        title: "Erro ao iniciar jejum",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const stopFasting = async () => {
    if (!activeSchedule) return

    try {
      const response = await fetch(`/api/fasting?id=${activeSchedule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isActive: false }),
      })

      if (!response.ok) throw new Error("Erro ao parar jejum")

      toast({
        title: "Jejum interrompido",
      })

      setActiveSchedule(null)
      setTimeRemaining("00:00:00")
      await loadSchedules()
    } catch (error: any) {
      toast({
        title: "Erro ao parar jejum",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    if (selectedType !== "custom") {
      setEndTime("")
    }
  }, [selectedType])

  useEffect(() => {
    if (!startTime) return

    const start = new Date(startTime)
    let end: Date

    if (selectedType === "custom") {
      if (endTime) {
        end = new Date(endTime)
      } else {
        return
      }
    } else {
      const config: Record<string, number> = {
        "16:8": 16,
        "14:10": 14,
        "18:6": 18,
        "20:4": 20,
        "12:12": 12,
      }
      end = new Date(start)
      end.setHours(end.getHours() + (config[selectedType] || 16))
    }

    setEndTime(end.toISOString().slice(0, 16))
  }, [startTime, selectedType])

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
            <h1 className="text-3xl font-semibold text-white mb-1">Jejum Intermitente</h1>
            <p className="text-minimal-muted">Acompanhe seus períodos de jejum</p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Play className="h-4 w-4 mr-2" />
            Iniciar Jejum
          </Button>
        </div>

        {/* Timer ativo */}
        {activeSchedule && (
          <div className="card-minimal p-6">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2">
                <Clock className="h-6 w-6 text-blue-400" />
                <span className="text-sm text-minimal-muted">
                  {isFasting ? "Em Jejum" : "Período de Alimentação"}
                </span>
              </div>
              <div className="text-6xl font-mono font-bold text-white">{timeRemaining}</div>
              <div className="text-sm text-minimal-muted">
                {isFasting
                  ? "Tempo restante até poder se alimentar"
                  : "Tempo restante até iniciar o jejum"}
              </div>
              <div className="pt-4 border-t border-slate-800">
                <div className="text-sm text-minimal-muted mb-2">Informações do Jejum</div>
                <div className="space-y-1 text-sm">
                  <div>
                    Tipo: <span className="text-white font-medium">{activeSchedule.fastingType}</span>
                  </div>
                  <div>
                    Início:{" "}
                    <span className="text-white font-medium">
                      {format(new Date(activeSchedule.startTime), "dd/MM/yyyy HH:mm", {
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                  <div>
                    Fim:{" "}
                    <span className="text-white font-medium">
                      {format(new Date(activeSchedule.endTime), "dd/MM/yyyy HH:mm", {
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                </div>
              </div>
              <Button variant="destructive" onClick={stopFasting}>
                <Square className="h-4 w-4 mr-2" />
                Parar Jejum
              </Button>
            </div>
          </div>
        )}

        {/* Sem jejum ativo */}
        {!activeSchedule && (
          <div className="card-minimal p-6 text-center">
            <Clock className="h-12 w-12 text-minimal-muted mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Nenhum jejum ativo</h3>
            <p className="text-minimal-muted mb-4">
              Inicie um novo período de jejum intermitente para começar a acompanhar
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Play className="h-4 w-4 mr-2" />
              Iniciar Jejum
            </Button>
          </div>
        )}

        {/* Histórico */}
        {schedules.length > 0 && (
          <div className="card-minimal p-4">
            <Label className="mb-3 block">Histórico de Jejuns</Label>
            <div className="space-y-2">
              {schedules.slice(0, 10).map((schedule) => (
                <div
                  key={schedule.id}
                  className="flex justify-between items-center p-3 bg-slate-900/50 rounded"
                >
                  <div>
                    <div className="text-white font-medium">{schedule.fastingType}</div>
                    <div className="text-xs text-minimal-muted">
                      {format(new Date(schedule.startTime), "dd/MM/yyyy HH:mm", {
                        locale: ptBR,
                      })}{" "}
                      -{" "}
                      {format(new Date(schedule.endTime), "dd/MM/yyyy HH:mm", {
                        locale: ptBR,
                      })}
                    </div>
                  </div>
                  {schedule.isActive === 1 && (
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                      Ativo
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dialog de iniciar jejum */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Iniciar Jejum Intermitente</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Tipo de Jejum</Label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FASTING_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Horário de Início</Label>
                <Input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              {selectedType === "custom" && (
                <div>
                  <Label>Horário de Fim</Label>
                  <Input
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              )}
              {selectedType !== "custom" && endTime && (
                <div className="p-3 bg-slate-900/50 rounded">
                  <div className="text-sm text-minimal-muted">Horário de Fim Calculado</div>
                  <div className="text-white font-medium">
                    {format(new Date(endTime), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={startFasting}>Iniciar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  )
}

