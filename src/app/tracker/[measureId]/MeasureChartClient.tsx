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
import { ArrowLeft, Target } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface Measure {
  id: number
  name: string
  unit: string
}

interface Goal {
  id: number
  measureTypeId: number
  targetValue: number
}

interface MeasureChartClientProps {
  measure: Measure
  data: Array<{ date: string; value: number }>
  goal: Goal | undefined
  measureId: number
}

export function MeasureChartClient({
  measure,
  data,
  goal,
  measureId,
}: MeasureChartClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [goalValue, setGoalValue] = useState(goal?.targetValue.toString() || "")

  const handleGoalChange = async (value: number) => {
    try {
      const response = await fetch("/api/goal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          measureTypeId: measureId,
          targetValue: value,
        }),
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
        variant: "destructive",
      })
      return
    }
    handleGoalChange(numValue)
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.push("/tracker")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">{measure.name}</h1>
              <p className="text-slate-400">{measure.unit}</p>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Target className="h-4 w-4 mr-2" />
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

        <div className="bg-slate-900 border border-slate-700 rounded-lg">
          <MeasureChart
            data={data}
            measureName={measure.name}
            unit={measure.unit}
            targetValue={goal?.targetValue}
            onGoalChange={handleGoalChange}
          />
        </div>
      </div>
    </div>
  )
}

