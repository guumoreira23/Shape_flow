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
import { Plus, Search, Target, Trash2, ScanLine } from "lucide-react"
import { formatDateDisplay, getTodayDate, formatDate } from "@/lib/utils/date"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"

interface Food {
  id: number | string
  name: string
  brand?: string | null
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  servingSize: number
  unit: string
}

interface MealFood {
  id: number
  foodItemId: number
  foodName: string
  quantity: number
  unit: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
}

interface Meal {
  id: number
  date: string
  mealType: string
  foods: MealFood[]
  totals: {
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber: number
  }
}

interface NutritionGoal {
  id: number
  targetCalories: number
  targetProtein: number
  targetCarbs: number
  targetFat: number
}

interface DiarioClientProps {
  userIsAdmin?: boolean
}

const MEAL_TYPES = [
  { value: "café", label: "Café da Manhã" },
  { value: "lanche-manhã", label: "Lanche da Manhã" },
  { value: "almoço", label: "Almoço" },
  { value: "lanche-tarde", label: "Lanche da Tarde" },
  { value: "jantar", label: "Jantar" },
  { value: "ceia", label: "Ceia" },
]

export function DiarioClient({ userIsAdmin = false }: DiarioClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [meals, setMeals] = useState<Meal[]>([])
  const [nutritionGoal, setNutritionGoal] = useState<NutritionGoal | null>(null)
  const [isFoodDialogOpen, setIsFoodDialogOpen] = useState(false)
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false)
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false)
  const [barcodeInput, setBarcodeInput] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [foods, setFoods] = useState<Food[]>([])
  const [selectedMealType, setSelectedMealType] = useState("café")
  const [selectedFood, setSelectedFood] = useState<Food | null>(null)
  const [foodQuantity, setFoodQuantity] = useState("100")
  const [goalCalories, setGoalCalories] = useState("2000")
  const [goalProtein, setGoalProtein] = useState("150")
  const [goalCarbs, setGoalCarbs] = useState("200")
  const [goalFat, setGoalFat] = useState("65")

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
      
      const [mealsResponse, goalResponse] = await Promise.all([
        fetch(`/api/meals?date=${dateString}`, { credentials: "include" }),
        fetch("/api/nutrition-goals", { credentials: "include" }),
      ])

      if (!mealsResponse.ok || !goalResponse.ok) {
        if (mealsResponse.status === 401 || goalResponse.status === 401) {
          router.replace("/login")
          return
        }
        throw new Error("Erro ao carregar dados")
      }

      const mealsData = await mealsResponse.json()
      const goalData = await goalResponse.json()

      setMeals(mealsData)
      setNutritionGoal(goalData)
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "Erro ao carregar dados",
        variant: "destructive",
      })
    }
  }

  const searchFoods = async (query: string) => {
    if (!query.trim()) {
      setFoods([])
      return
    }

    try {
      const response = await fetch(`/api/foods?search=${encodeURIComponent(query)}`, {
        credentials: "include",
      })
      if (!response.ok) throw new Error("Erro ao buscar alimentos")
      const data = await response.json()
      setFoods(data)
    } catch (error) {
      console.error("Error searching foods:", error)
      toast({
        title: "Erro ao buscar alimentos",
        variant: "destructive",
      })
    }
  }

  const handleAddFood = async () => {
    if (!selectedFood || !foodQuantity.trim()) {
      toast({
        title: "Selecione um alimento e informe a quantidade",
        variant: "destructive",
      })
      return
    }

    // Apenas alimentos do banco de dados (ID numérico) podem ser adicionados
    if (typeof selectedFood.id !== "number") {
      toast({
        title: "Este alimento precisa ser cadastrado primeiro",
        description: "Alimentos do banco estático precisam ser adicionados ao banco de dados",
        variant: "destructive",
      })
      return
    }

    try {
      const dateString = formatDate(selectedDate)
      const quantity = parseFloat(foodQuantity)

      const response = await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          date: dateString,
          mealType: selectedMealType,
          foods: [
            {
              foodItemId: selectedFood.id,
              quantity,
            },
          ],
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao adicionar alimento")
      }

      toast({
        title: "Alimento adicionado com sucesso!",
      })

      setIsFoodDialogOpen(false)
      setSelectedFood(null)
      setFoodQuantity("100")
      setSearchQuery("")
      setFoods([])
      await loadData()
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar alimento",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleBarcodeSearch = async () => {
    if (!barcodeInput.trim()) {
      toast({
        title: "Digite um código de barras",
        variant: "destructive",
      })
      return
    }

    try {
      // Buscar alimento por código de barras
      const response = await fetch(`/api/foods?search=${encodeURIComponent(barcodeInput)}`, {
        credentials: "include",
      })

      if (!response.ok) throw new Error("Erro ao buscar alimento")

      const data = await response.json()
      const foodWithBarcode = data.find((f: Food) => f.barcode === barcodeInput)

      if (foodWithBarcode) {
        setSelectedFood(foodWithBarcode)
        setFoodQuantity(foodWithBarcode.servingSize?.toString() || "100")
        setIsBarcodeScannerOpen(false)
        setIsFoodDialogOpen(true)
        setBarcodeInput("")
        toast({
          title: "Alimento encontrado!",
          description: `Encontrado: ${foodWithBarcode.name}`,
        })
      } else {
        toast({
          title: "Alimento não encontrado",
          description: "Este código de barras não está cadastrado no banco de dados",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Erro ao buscar código de barras",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleSaveGoal = async () => {
    try {
      const response = await fetch("/api/nutrition-goals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          targetCalories: parseInt(goalCalories),
          targetProtein: parseFloat(goalProtein),
          targetCarbs: parseFloat(goalCarbs),
          targetFat: parseFloat(goalFat),
        }),
      })

      if (!response.ok) throw new Error("Erro ao salvar metas")

      const updatedGoal = await response.json()
      setNutritionGoal(updatedGoal)
      setIsGoalDialogOpen(false)
      toast({
        title: "Metas atualizadas com sucesso!",
      })
    } catch (error: any) {
      toast({
        title: "Erro ao salvar metas",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const calculateDailyTotals = () => {
    return meals.reduce(
      (acc, meal) => ({
        calories: acc.calories + meal.totals.calories,
        protein: acc.protein + meal.totals.protein,
        carbs: acc.carbs + meal.totals.carbs,
        fat: acc.fat + meal.totals.fat,
        fiber: acc.fiber + meal.totals.fiber,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
    )
  }

  const dailyTotals = calculateDailyTotals()

  useEffect(() => {
    if (isAuthenticated && selectedDate) {
      loadData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, isAuthenticated])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        searchFoods(searchQuery)
      } else {
        setFoods([])
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    if (nutritionGoal) {
      setGoalCalories(nutritionGoal.targetCalories.toString())
      setGoalProtein(nutritionGoal.targetProtein.toString())
      setGoalCarbs(nutritionGoal.targetCarbs.toString())
      setGoalFat(nutritionGoal.targetFat.toString())
    }
  }, [nutritionGoal])

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
            <h1 className="text-3xl font-semibold text-white mb-1">Diário Alimentar</h1>
            <p className="text-minimal-muted">Acompanhe suas refeições e nutrientes</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsGoalDialogOpen(true)}>
              <Target className="h-4 w-4 mr-2" />
              Metas
            </Button>
            <Button variant="outline" onClick={() => setIsBarcodeScannerOpen(true)}>
              <ScanLine className="h-4 w-4 mr-2" />
              Scanner
            </Button>
            <Button onClick={() => setIsFoodDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Alimento
            </Button>
          </div>
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

        {/* Resumo diário */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card-minimal p-4">
            <div className="text-sm text-minimal-muted mb-1">Calorias</div>
            <div className="text-2xl font-bold text-white">
              {dailyTotals.calories}
              {nutritionGoal && (
                <span className="text-sm font-normal text-minimal-muted ml-2">
                  / {nutritionGoal.targetCalories}
                </span>
              )}
            </div>
            {nutritionGoal && (
              <div className="mt-2 w-full bg-slate-800 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, (dailyTotals.calories / nutritionGoal.targetCalories) * 100)}%`,
                  }}
                />
              </div>
            )}
          </div>
          <div className="card-minimal p-4">
            <div className="text-sm text-minimal-muted mb-1">Proteínas</div>
            <div className="text-2xl font-bold text-white">
              {dailyTotals.protein.toFixed(1)}g
              {nutritionGoal && (
                <span className="text-sm font-normal text-minimal-muted ml-2">
                  / {nutritionGoal.targetProtein}g
                </span>
              )}
            </div>
            {nutritionGoal && (
              <div className="mt-2 w-full bg-slate-800 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, (dailyTotals.protein / nutritionGoal.targetProtein) * 100)}%`,
                  }}
                />
              </div>
            )}
          </div>
          <div className="card-minimal p-4">
            <div className="text-sm text-minimal-muted mb-1">Carboidratos</div>
            <div className="text-2xl font-bold text-white">
              {dailyTotals.carbs.toFixed(1)}g
              {nutritionGoal && (
                <span className="text-sm font-normal text-minimal-muted ml-2">
                  / {nutritionGoal.targetCarbs}g
                </span>
              )}
            </div>
            {nutritionGoal && (
              <div className="mt-2 w-full bg-slate-800 rounded-full h-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, (dailyTotals.carbs / nutritionGoal.targetCarbs) * 100)}%`,
                  }}
                />
              </div>
            )}
          </div>
          <div className="card-minimal p-4">
            <div className="text-sm text-minimal-muted mb-1">Gorduras</div>
            <div className="text-2xl font-bold text-white">
              {dailyTotals.fat.toFixed(1)}g
              {nutritionGoal && (
                <span className="text-sm font-normal text-minimal-muted ml-2">
                  / {nutritionGoal.targetFat}g
                </span>
              )}
            </div>
            {nutritionGoal && (
              <div className="mt-2 w-full bg-slate-800 rounded-full h-2">
                <div
                  className="bg-orange-500 h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, (dailyTotals.fat / nutritionGoal.targetFat) * 100)}%`,
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Lista de refeições */}
        <div className="space-y-4">
          {MEAL_TYPES.map((mealType) => {
            const meal = meals.find((m) => m.mealType === mealType.value)
            return (
              <div key={mealType.value} className="card-minimal p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold text-white">{mealType.label}</h3>
                  {meal && (
                    <span className="text-sm text-minimal-muted">
                      {meal.totals.calories} kcal
                    </span>
                  )}
                </div>
                {meal && meal.foods.length > 0 ? (
                  <div className="space-y-2">
                    {meal.foods.map((food) => (
                      <div
                        key={food.id}
                        className="flex justify-between items-center p-2 bg-slate-900/50 rounded"
                      >
                        <div>
                          <div className="text-white font-medium">{food.foodName}</div>
                          <div className="text-xs text-minimal-muted">
                            {food.quantity} {food.unit} • {food.calories} kcal • P: {food.protein}g • C: {food.carbs}g • G: {food.fat}g
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-minimal-muted">Nenhum alimento registrado</p>
                )}
              </div>
            )
          })}
        </div>

        {/* Dialog de adicionar alimento */}
        <Dialog open={isFoodDialogOpen} onOpenChange={setIsFoodDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Adicionar Alimento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Tipo de Refeição</Label>
                <Select value={selectedMealType} onValueChange={setSelectedMealType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MEAL_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Buscar Alimento</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-minimal-muted" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Digite o nome do alimento..."
                    className="pl-10"
                  />
                </div>
                {foods.length > 0 && (
                  <div className="mt-2 max-h-60 overflow-y-auto border border-slate-800 rounded-md">
                    {foods.map((food) => (
                      <div
                        key={food.id}
                        className="p-3 hover:bg-slate-800 cursor-pointer border-b border-slate-800 last:border-b-0"
                        onClick={() => {
                          setSelectedFood(food)
                          setFoodQuantity(food.servingSize.toString())
                        }}
                      >
                        <div className="font-medium text-white">{food.name}</div>
                        <div className="text-xs text-minimal-muted">
                          {food.calories} kcal • P: {food.protein}g • C: {food.carbs}g • G: {food.fat}g
                          {food.brand && ` • ${food.brand}`}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {selectedFood && (
                <div className="space-y-2 p-3 bg-slate-900/50 rounded">
                  <div className="font-medium text-white">{selectedFood.name}</div>
                  <div>
                    <Label>Quantidade ({selectedFood.unit})</Label>
                    <Input
                      type="number"
                      value={foodQuantity}
                      onChange={(e) => setFoodQuantity(e.target.value)}
                      placeholder="100"
                    />
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsFoodDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddFood} disabled={!selectedFood}>
                Adicionar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de metas nutricionais */}
        <Dialog open={isGoalDialogOpen} onOpenChange={setIsGoalDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Metas Nutricionais Diárias</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Calorias (kcal)</Label>
                <Input
                  type="number"
                  value={goalCalories}
                  onChange={(e) => setGoalCalories(e.target.value)}
                />
              </div>
              <div>
                <Label>Proteínas (g)</Label>
                <Input
                  type="number"
                  value={goalProtein}
                  onChange={(e) => setGoalProtein(e.target.value)}
                />
              </div>
              <div>
                <Label>Carboidratos (g)</Label>
                <Input
                  type="number"
                  value={goalCarbs}
                  onChange={(e) => setGoalCarbs(e.target.value)}
                />
              </div>
              <div>
                <Label>Gorduras (g)</Label>
                <Input
                  type="number"
                  value={goalFat}
                  onChange={(e) => setGoalFat(e.target.value)}
                />
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

        {/* Dialog de scanner de código de barras */}
        <Dialog open={isBarcodeScannerOpen} onOpenChange={setIsBarcodeScannerOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Scanner de Código de Barras</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Código de Barras</Label>
                <Input
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  placeholder="Digite ou escaneie o código de barras"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleBarcodeSearch()
                    }
                  }}
                  autoFocus
                />
                <p className="text-xs text-minimal-muted mt-1">
                  Digite o código de barras do produto ou use um scanner físico
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsBarcodeScannerOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleBarcodeSearch}>Buscar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  )
}

