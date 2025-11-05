"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { MeasuresGrid } from "@/components/tracker/MeasuresGrid"
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
import { Plus } from "lucide-react"
import { MainLayout } from "@/components/layout/MainLayout"
import { useToast } from "@/components/ui/use-toast"
import { getTodayDate, formatDate } from "@/lib/utils/date"

interface Measure {
  id: number
  name: string
  unit: string
}

interface Entry {
  id: number
  date: string
}

interface Value {
  id: number
  entryId: number
  measureTypeId: number
  value: number
}

interface Goal {
  id: number
  measureTypeId: number
  targetValue: number
}

export function TrackerClient() {
  const router = useRouter()
  const { toast } = useToast()
  const [measures, setMeasures] = useState<Measure[]>([])
  const [entries, setEntries] = useState<Entry[]>([])
  const [values, setValues] = useState<Value[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newMeasureName, setNewMeasureName] = useState("")
  const [newMeasureUnit, setNewMeasureUnit] = useState("")

  const loadData = async () => {
    try {
      const response = await fetch("/api/tracker")
      if (!response.ok) throw new Error("Erro ao carregar dados")
      const data = await response.json()
      setMeasures(data.measures)
      setEntries(data.entries)
      setValues(data.values)
      setGoals(data.goals)

      if (data.entries.length === 0) {
        await createTodayEntry()
      }
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "Erro ao carregar dados",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const createTodayEntry = async () => {
    try {
      const response = await fetch("/api/date", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: formatDate(getTodayDate()) }),
      })
      if (response.ok) {
        const newEntry = await response.json()
        setEntries((prev) => [newEntry, ...prev])
      }
    } catch (error) {
      console.error("Error creating entry:", error)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleAddMeasure = async () => {
    if (!newMeasureName.trim() || !newMeasureUnit.trim()) {
      toast({
        title: "Preencha todos os campos",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/measure-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newMeasureName,
          unit: newMeasureUnit,
        }),
      })

      if (!response.ok) throw new Error("Erro ao criar medida")

      const newMeasure = await response.json()
      setMeasures((prev) => [...prev, newMeasure])
      setNewMeasureName("")
      setNewMeasureUnit("")
      setIsDialogOpen(false)
      toast({
        title: "Medida criada com sucesso!",
      })
    } catch (error) {
      toast({
        title: "Erro ao criar medida",
        variant: "destructive",
      })
    }
  }

  const handleAddDate = async () => {
    try {
      const response = await fetch("/api/date", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: formatDate(getTodayDate()) }),
      })

      if (response.ok) {
        const newEntry = await response.json()
        setEntries((prev) => [newEntry, ...prev])
        toast({
          title: "Data adicionada!",
        })
      }
    } catch (error) {
      toast({
        title: "Erro ao adicionar data",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-minimal-muted">Carregando...</p>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-semibold text-white mb-2">Tracker de Medidas</h1>
            <p className="text-minimal-muted">Gerencie suas medidas corporais</p>
          </div>
          <Button onClick={handleAddDate} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            Adicionar Data
          </Button>
        </div>

        <div className="card-minimal p-6">
          <MeasuresGrid
            measures={measures}
            entries={entries}
            values={values}
            goals={goals}
            onAddMeasure={() => setIsDialogOpen(true)}
          />
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Medida</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome da Medida</Label>
                <Input
                  id="name"
                  value={newMeasureName}
                  onChange={(e) => setNewMeasureName(e.target.value)}
                  placeholder="Ex: Peso, Cintura, Quadril"
                />
              </div>
              <div>
                <Label htmlFor="unit">Unidade</Label>
                <Input
                  id="unit"
                  value={newMeasureUnit}
                  onChange={(e) => setNewMeasureUnit(e.target.value)}
                  placeholder="Ex: kg, cm"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddMeasure}>Criar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  )
}

