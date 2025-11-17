"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MeasureChart } from "@/components/charts/MeasureChart"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { ArrowLeft, Target, Download, FileText } from "lucide-react"
import { MainLayout } from "@/components/layout/MainLayout"
import { useToast } from "@/components/ui/use-toast"
import { generatePDFReport } from "@/lib/utils/pdfExport"

interface Measure {
  id: number
  name: string
  unit: string
}

interface Goal {
  id: number
  measureTypeId: number
  targetValue: number
  deadline?: Date | string | null
}

interface MeasureChartClientProps {
  measure: Measure
  data: Array<{ date: string; value: number }>
  goal: Goal | undefined
  measureId: number
  userIsAdmin?: boolean
}

export function MeasureChartClient({
  measure,
  data,
  goal,
  measureId,
  userIsAdmin = false,
}: MeasureChartClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [goalValue, setGoalValue] = useState(goal?.targetValue.toString() || "")
  const [goalDeadline, setGoalDeadline] = useState(() => {
    if (goal?.deadline) {
      const date = typeof goal.deadline === 'string' ? new Date(goal.deadline) : goal.deadline
      return date.toISOString().split('T')[0]
    }
    return ""
  })

  const handleGoalChange = async (value: number, deadline?: string) => {
    try {
      const body: {
        measureTypeId: number
        targetValue: number
        deadline?: string
      } = {
        measureTypeId: measureId,
        targetValue: value,
      }

      if (deadline && deadline.trim()) {
        body.deadline = deadline
      }

      const response = await fetch("/api/goal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!response.ok) throw new Error("Erro ao salvar meta")

      toast({
        title: "Meta atualizada com sucesso!",
      })
      setIsDialogOpen(false)
      router.refresh()
    } catch (error) {
      toast({
        title: "Erro ao salvar meta",
        variant: "destructive",
      })
    }
  }

  const handleSaveGoal = () => {
    const numValue = parseInt(goalValue, 10)
    if (isNaN(numValue) || numValue <= 0) {
      toast({
        title: "Valor inválido",
        description: "Informe um valor positivo para a meta",
        variant: "destructive",
      })
      return
    }
    handleGoalChange(numValue, goalDeadline)
  }

  return (
    <MainLayout userIsAdmin={userIsAdmin}>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.push("/tracker")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-semibold text-white mb-1">
                {measure.name}
                {goal && (
                  <span className="ml-3 text-lg font-normal text-blue-400">
                    – meta {goal.targetValue} {measure.unit}
                    {goal.deadline && (
                      <span className="ml-2 text-sm text-slate-400">
                        (até {new Date(goal.deadline).toLocaleDateString('pt-BR')})
                      </span>
                    )}
                  </span>
                )}
              </h1>
              <p className="text-minimal-muted">{measure.unit}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={handleExportPDF}>
              <FileText className="h-4 w-4" />
              Exportar PDF
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Target className="h-4 w-4" />
                  {goal ? "Editar Meta" : "Definir Meta"}
                </Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Definir Meta</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="goalValue">Valor da Meta ({measure.unit})</Label>
                  <Input
                    id="goalValue"
                    type="number"
                    value={goalValue}
                    onChange={(e) => setGoalValue(e.target.value)}
                    placeholder="Ex: 70"
                  />
                </div>
                <div>
                  <Label htmlFor="goalDeadline">Data Limite (opcional)</Label>
                  <Input
                    id="goalDeadline"
                    type="date"
                    value={goalDeadline}
                    onChange={(e) => setGoalDeadline(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Defina uma data limite para alcançar esta meta
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveGoal}>Salvar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        <div className="card-minimal p-6">
          <MeasureChart
            data={data}
            measureName={measure.name}
            unit={measure.unit}
            targetValue={goal?.targetValue}
            onGoalChange={handleGoalChange}
          />
        </div>
      </div>
    </MainLayout>
  )
}

