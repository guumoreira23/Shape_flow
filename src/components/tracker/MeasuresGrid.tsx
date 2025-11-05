"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Plus, ChartLine } from "lucide-react"
import { formatDateDisplay } from "@/lib/utils/date"

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
}

export function MeasuresGrid({
  measures,
  entries,
  values,
  goals,
  onAddMeasure,
}: MeasuresGridProps) {
  const [localValues, setLocalValues] = useState<Record<string, number>>({})
  const [pendingValues, setPendingValues] = useState<Set<string>>(new Set())
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
                        <span className="font-medium text-white">{measure.name}</span>
                        <Link href={`/tracker/${measure.id}`}>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-slate-800">
                            <ChartLine className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
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
                        className="border-r border-slate-800/50 px-2 py-2 bg-slate-950/50"
                      >
                        <Input
                          type="number"
                          value={value}
                          onChange={(e) =>
                            handleCellChange(entry.id, measure.id, e.target.value)
                          }
                          className={`h-9 text-center text-sm bg-slate-900/50 border-slate-800 ${
                            isPending ? "opacity-50" : ""
                          }`}
                          placeholder="-"
                        />
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

