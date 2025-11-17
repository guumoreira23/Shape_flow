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
import { Plus, Download, Upload } from "lucide-react"
import { MainLayout } from "@/components/layout/MainLayout"
import { useToast } from "@/components/ui/use-toast"
import { getTodayDate, formatDate, parseDate } from "@/lib/utils/date"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"
import { MEASURE_SUGGESTIONS, UNIT_SUGGESTIONS } from "@/lib/utils/measureSuggestions"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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

interface TrackerClientProps {
  userIsAdmin?: boolean
}

export function TrackerClient({ userIsAdmin = false }: TrackerClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [measures, setMeasures] = useState<Measure[]>([])
  const [entries, setEntries] = useState<Entry[]>([])
  const [values, setValues] = useState<Value[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDateDialogOpen, setIsDateDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [csvContent, setCsvContent] = useState("")
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [newMeasureName, setNewMeasureName] = useState("")
  const [newMeasureUnit, setNewMeasureUnit] = useState("")

  const loadData = async () => {
    try {
      const response = await fetch("/api/tracker", {
        credentials: "include",
      })
      if (!response.ok) {
        if (response.status === 401) {
          router.replace("/login")
          return
        }
        throw new Error("Erro ao carregar dados")
      }
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

  // Verificar autenticação via API ao montar o componente
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/check", {
          credentials: "include",
        })
        const data = await response.json()

        if (data.authenticated) {
          setIsAuthenticated(true)
          // Carregar dados após confirmar autenticação
          await loadData()
        } else {
          setIsAuthenticated(false)
          router.replace("/login")
        }
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error)
        setIsAuthenticated(false)
        router.replace("/login")
      }
    }

    checkAuth()
  }, [router])

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

  const handleImportCSV = async () => {
    if (!csvContent.trim()) {
      toast({
        title: "CSV vazio",
        description: "Por favor, cole o conteúdo do CSV",
        variant: "destructive",
      })
      return
    }

    setIsImporting(true)
    try {
      const response = await fetch("/api/import/csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: csvContent }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao importar CSV")
      }

      toast({
        title: "Importação concluída!",
        description: data.message || `${data.imported} linha(s) importada(s)`,
      })

      if (data.errors && data.errors.length > 0) {
        console.warn("Erros durante importação:", data.errors)
      }

      setIsImportDialogOpen(false)
      setCsvContent("")
      loadData()
    } catch (error: any) {
      toast({
        title: "Erro ao importar CSV",
        description: error.message || "Verifique o formato do arquivo",
        variant: "destructive",
      })
    } finally {
      setIsImporting(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      setCsvContent(content)
    }
    reader.readAsText(file, "UTF-8")
  }

  const handleAddDate = async () => {
    try {
      const dateString = formatDate(selectedDate)
      const response = await fetch("/api/date", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: dateString }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erro ao adicionar data")
      }

      const newEntry = await response.json()
      
      // Verificar se a entrada já existe na lista
      const existingIndex = entries.findIndex(
        (e) => e.id === newEntry.id || formatDate(parseDate(e.date)) === dateString
      )
      
      if (existingIndex === -1) {
        setEntries((prev) => [newEntry, ...prev].sort((a, b) => {
          const dateA = parseDate(a.date)
          const dateB = parseDate(b.date)
          return dateB.getTime() - dateA.getTime()
        }))
      } else {
        // Se já existe, apenas recarregar os dados
        loadData()
      }
      
      setIsDateDialogOpen(false)
      toast({
        title: "Data adicionada com sucesso!",
      })
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar data",
        description: error.message || "Verifique se a data não já existe",
        variant: "destructive",
      })
    }
  }

  // Mostrar loading enquanto verifica autenticação ou carrega dados
  if (isLoading || isAuthenticated === null) {
    return (
      <MainLayout userIsAdmin={userIsAdmin}>
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-5 w-96" />
          </div>
          <div className="card-minimal p-6">
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </MainLayout>
    )
  }

  // Se não autenticado, não renderizar (já redirecionou)
  if (!isAuthenticated) {
    return null
  }

  return (
    <MainLayout userIsAdmin={userIsAdmin}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-white mb-2">Tracker de Medidas</h1>
            <p className="text-sm sm:text-base text-minimal-muted">Gerencie suas medidas corporais</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Dialog open={isDateDialogOpen} onOpenChange={setIsDateDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 text-sm sm:text-base">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Adicionar Data</span>
                  <span className="sm:hidden">Data</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Selecionar Data</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      if (date) setSelectedDate(date)
                    }}
                    className="rounded-md border"
                  />
                  <div className="text-sm text-minimal-muted">
                    Data selecionada: {format(selectedDate, "dd/MM/yyyy")}
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDateDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleAddDate}>Confirmar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button
              variant="outline"
              className="gap-2 text-sm sm:text-base"
              onClick={() => {
                window.location.href = "/api/export/csv"
              }}
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Exportar CSV</span>
              <span className="sm:hidden">CSV</span>
            </Button>
            <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 text-sm sm:text-base">
                  <Upload className="h-4 w-4" />
                  <span className="hidden sm:inline">Importar CSV</span>
                  <span className="sm:hidden">Importar</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Importar Dados de CSV</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="csvFile">Enviar arquivo CSV</Label>
                    <Input
                      id="csvFile"
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="csvContent">Ou cole o conteúdo do CSV</Label>
                    <textarea
                      id="csvContent"
                      value={csvContent}
                      onChange={(e) => setCsvContent(e.target.value)}
                      placeholder="Data;Peso (kg);Cintura (cm)&#10;15/01/2025;75;85"
                      className="mt-1 w-full h-48 p-3 rounded-lg border border-slate-800 bg-slate-900/50 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                    />
                  </div>
                  <div className="text-sm text-minimal-muted space-y-1">
                    <p><strong>Formato esperado:</strong></p>
                    <p>• Primeira linha: cabeçalho com &quot;Data&quot; e nomes das medidas</p>
                    <p>• Delimitador: ponto e vírgula (;) ou vírgula (,)</p>
                    <p>• Data: formato DD/MM/YYYY</p>
                    <p>• Valores: números com vírgula como separador decimal (ex: 75,5)</p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleImportCSV} disabled={isImporting || !csvContent.trim()}>
                    {isImporting ? "Importando..." : "Importar"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="card-minimal p-4 sm:p-6">
          <MeasuresGrid
            measures={measures}
            entries={entries}
            values={values}
            goals={goals}
            onAddMeasure={() => setIsDialogOpen(true)}
            onMeasureUpdate={loadData}
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
                <div className="space-y-2">
                  <Input
                    id="name"
                    value={newMeasureName}
                    onChange={(e) => setNewMeasureName(e.target.value)}
                    placeholder="Ex: Peso, Cintura, Quadril"
                  />
                  <div className="flex flex-wrap gap-2">
                    {MEASURE_SUGGESTIONS.slice(0, 6).map((suggestion) => (
                      <Button
                        key={suggestion.name}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => {
                          setNewMeasureName(suggestion.name)
                          setNewMeasureUnit(suggestion.unit)
                        }}
                      >
                        {suggestion.name} ({suggestion.unit})
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400">
                    Clique em uma sugestão para preencher automaticamente
                  </p>
                </div>
              </div>
              <div>
                <Label htmlFor="unit">Unidade</Label>
                <div className="space-y-2">
                  <Select value={newMeasureUnit} onValueChange={setNewMeasureUnit}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione ou digite uma unidade" />
                    </SelectTrigger>
                    <SelectContent>
                      {UNIT_SUGGESTIONS.map((unit) => (
                        <SelectItem key={unit.unit} value={unit.unit}>
                          {unit.unit} - {unit.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    id="unit"
                    value={newMeasureUnit}
                    onChange={(e) => setNewMeasureUnit(e.target.value)}
                    placeholder="Ou digite: kg, cm, %, mmHg, etc"
                    className="mt-2"
                  />
                </div>
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

