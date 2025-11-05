"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Plus, ChartLine, Pencil, Trash2, X } from "lucide-react"
import { formatDateDisplay } from "@/lib/utils/date"
import { useToast } from "@/components/ui/use-toast"

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

interface MeasuresGridProps {
  measures: Measure[]
  entries: Entry[]
  values: Value[]
  goals: Goal[]
  onAddMeasure: () => void
  onMeasureUpdate?: () => void
}

export function MeasuresGrid({
  measures,
  entries,
  values,
  goals,
  onAddMeasure,
  onMeasureUpdate,
}: MeasuresGridProps) {
  const { toast } = useToast()
  const [localValues, setLocalValues] = useState<Record<string, number>>({})
  const [pendingValues, setPendingValues] = useState<Set<string>>(new Set())
  const [editingMeasure, setEditingMeasure] = useState<Measure | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [measureToDelete, setMeasureToDelete] = useState<Measure | null>(null)
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false)
  const [valueToClear, setValueToClear] = useState<{ entryId: number; measureId: number } | null>(null)
  const [isClearAlertOpen, setIsClearAlertOpen] = useState(false)
  const [editMeasureName, setEditMeasureName] = useState("")
  const [editMeasureUnit, setEditMeasureUnit] = useState("")
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map())
  const debounceTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map())

  useEffect(() => {
    const initialValues: Record<string, number> = {}
    values.forEach((v) => {
      const key = `${v.entryId}-${v.measureTypeId}`
      initialValues[key] = v.value
    })
    setLocalValues(initialValues)
  }, [values])

  const saveValue = useCallback(
    async (entryId: number, measureTypeId: number, value: number) => {
      const key = `${entryId}-${measureTypeId}`

      const previousController = abortControllersRef.current.get(key)
      if (previousController) {
        previousController.abort()
      }

      const controller = new AbortController()
      abortControllersRef.current.set(key, controller)

      try {
        const response = await fetch("/api/value", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entryId, measureTypeId, value }),
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error("Erro ao salvar")
        }

        setPendingValues((prev) => {
          const next = new Set(prev)
          next.delete(key)
          return next
        })
      } catch (error: any) {
        if (error.name !== "AbortError") {
          console.error("Error saving value:", error)
          setPendingValues((prev) => {
            const next = new Set(prev)
            next.delete(key)
            return next
          })
        }
      } finally {
        abortControllersRef.current.delete(key)
      }
    },
    []
  )

  const handleCellChange = useCallback(
    (entryId: number, measureTypeId: number, value: string) => {
      const numValue = parseInt(value, 10)
      if (isNaN(numValue) || numValue <= 0) {
        return
      }

      const key = `${entryId}-${measureTypeId}`
      setLocalValues((prev) => ({ ...prev, [key]: numValue }))
      setPendingValues((prev) => new Set(prev).add(key))

      const previousTimer = debounceTimersRef.current.get(key)
      if (previousTimer) {
        clearTimeout(previousTimer)
      }

      const timer = setTimeout(() => {
        saveValue(entryId, measureTypeId, numValue)
        debounceTimersRef.current.delete(key)
      }, 400)

      debounceTimersRef.current.set(key, timer)
    },
    [saveValue]
  )

  const sortedEntries = [...entries].sort((a, b) =>
    a.date.localeCompare(b.date)
  )

  const getGoal = (measureId: number) => {
    return goals.find((g) => g.measureTypeId === measureId)?.targetValue
  }

  const handleEditMeasure = (measure: Measure) => {
    setEditingMeasure(measure)
    setEditMeasureName(measure.name)
    setEditMeasureUnit(measure.unit)
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingMeasure || !editMeasureName.trim() || !editMeasureUnit.trim()) {
      toast({
        title: "Preencha todos os campos",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`/api/measure-types/${editingMeasure.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editMeasureName.trim(),
          unit: editMeasureUnit.trim(),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erro ao atualizar medida")
      }

      toast({
        title: "Medida atualizada com sucesso!",
      })
      setIsEditDialogOpen(false)
      setEditingMeasure(null)
      onMeasureUpdate?.()
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar medida",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleDeleteMeasure = (measure: Measure) => {
    setMeasureToDelete(measure)
    setIsDeleteAlertOpen(true)
  }

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-slate-800/50">
      <div className="inline-block min-w-full">
        <table className="border-collapse">
          <thead>
            <tr className="bg-slate-900/50">
              <th className="sticky left-0 z-10 bg-slate-900/95 border-r border-slate-800/50 px-4 py-3 text-left backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">Medida</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onAddMeasure}
                    className="h-6 w-6 p-0 hover:bg-slate-800"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </th>
              {sortedEntries.map((entry) => (
                <th
                  key={entry.id}
                  className="border-b border-r border-slate-800/50 px-3 py-3 text-center text-xs font-medium text-minimal-muted min-w-[100px]"
                >
                  {formatDateDisplay(new Date(entry.date + "T00:00:00"))}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {measures.map((measure) => {
              const goal = getGoal(measure.id)
              return (
                <tr key={measure.id} className="border-b border-slate-800/50 hover:bg-slate-900/30 transition-colors">
                  <td className="sticky left-0 z-10 bg-slate-900/95 border-r border-slate-800/50 px-4 py-3 backdrop-blur-sm">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <Link 
                          href={`/tracker/${measure.id}`}
                          className="font-medium text-white hover:text-blue-400 transition-colors cursor-pointer flex-1"
                        >
                          {measure.name}
                        </Link>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:bg-slate-800"
                            onClick={(e) => {
                              e.preventDefault()
                              handleEditMeasure(measure)
                            }}
                            title="Renomear medida"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:bg-red-500/20 hover:text-red-400"
                            onClick={(e) => {
                              e.preventDefault()
                              handleDeleteMeasure(measure)
                            }}
                            title="Excluir medida"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                          <Link href={`/tracker/${measure.id}`}>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-slate-800" title="Ver gráfico">
                              <ChartLine className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                      <span className="text-xs text-minimal-muted">
                        {measure.unit}
                        {goal && (
                          <span className="ml-2 text-blue-400 font-medium">Meta: {goal}</span>
                        )}
                      </span>
                    </div>
                  </td>
                  {sortedEntries.map((entry) => {
                    const key = `${entry.id}-${measure.id}`
                    const value = localValues[key] || ""
                    const isPending = pendingValues.has(key)

                    return (
                      <td
                        key={entry.id}
                        className="border-r border-slate-800/50 px-2 py-2 bg-slate-950/50 relative group"
                      >
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            value={value}
                            onChange={(e) =>
                              handleCellChange(entry.id, measure.id, e.target.value)
                            }
                            className={`h-9 text-center text-sm bg-slate-900/50 border-slate-800 flex-1 ${
                              isPending ? "opacity-50" : ""
                            }`}
                            placeholder="-"
                          />
                          {value && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-9 w-9 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20 hover:text-red-400"
                              onClick={() => handleClearValueClick(entry.id, measure.id)}
                              title="Limpar valor"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Medida</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editName">Nome</Label>
              <Input
                id="editName"
                value={editMeasureName}
                onChange={(e) => setEditMeasureName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="editUnit">Unidade</Label>
              <Input
                id="editUnit"
                value={editMeasureUnit}
                onChange={(e) => setEditMeasureUnit(e.target.value)}
                className="mt-1"
                placeholder="Ex: kg, cm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a medida &quot;{measureToDelete?.name}&quot;? 
              Esta ação não pode ser desfeita e todos os valores associados serão perdidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isClearAlertOpen} onOpenChange={setIsClearAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Limpar Valor</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este valor? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmClearValue}
              className="bg-red-600 hover:bg-red-700"
            >
              Limpar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

