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
import { Search, Plus, UtensilsCrossed, Clock, Users, Flame } from "lucide-react"

interface Recipe {
  id: number
  name: string
  description?: string | null
  servings: number
  prepTime?: number | null
  cookTime?: number | null
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  tags?: string | null
  difficulty?: string | null
  ingredients?: Array<{
    id: number
    name: string
    quantity: number
    unit: string
  }>
}

interface ReceitasClientProps {
  userIsAdmin?: boolean
}

const DIFFICULTY_OPTIONS = [
  { value: "fácil", label: "Fácil" },
  { value: "médio", label: "Médio" },
  { value: "difícil", label: "Difícil" },
]

const TAG_OPTIONS = [
  { value: "vegetariano", label: "Vegetariano" },
  { value: "vegano", label: "Vegano" },
  { value: "low-carb", label: "Low Carb" },
  { value: "sem-glúten", label: "Sem Glúten" },
  { value: "sem-lactose", label: "Sem Lactose" },
]

export function ReceitasClient({ userIsAdmin = false }: ReceitasClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [maxCalories, setMaxCalories] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/check", {
          credentials: "include",
        })
        const data = await response.json()

        if (data.authenticated) {
          setIsAuthenticated(true)
          await loadRecipes()
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

  const loadRecipes = async () => {
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.append("search", searchQuery)
      if (selectedTags.length > 0) params.append("tags", JSON.stringify(selectedTags))
      if (maxCalories) params.append("maxCalories", maxCalories)

      const response = await fetch(`/api/recipes?${params.toString()}`, {
        credentials: "include",
      })

      if (!response.ok) {
        if (response.status === 401) {
          router.replace("/login")
          return
        }
        throw new Error("Erro ao carregar receitas")
      }

      const data = await response.json()
      setRecipes(data)
    } catch (error) {
      console.error("Error loading recipes:", error)
      toast({
        title: "Erro ao carregar receitas",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      const timer = setTimeout(() => {
        loadRecipes()
      }, 300)

      return () => clearTimeout(timer)
    }
  }, [searchQuery, selectedTags, maxCalories, isAuthenticated])

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
            <h1 className="text-3xl font-semibold text-white mb-1">Receitas</h1>
            <p className="text-minimal-muted">Explore receitas saudáveis e nutritivas</p>
          </div>
          {userIsAdmin && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Receita
            </Button>
          )}
        </div>

        {/* Filtros */}
        <div className="card-minimal p-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-minimal-muted" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar receitas..."
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {TAG_OPTIONS.map((tag) => (
              <Button
                key={tag.value}
                variant={selectedTags.includes(tag.value) ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSelectedTags((prev) =>
                    prev.includes(tag.value)
                      ? prev.filter((t) => t !== tag.value)
                      : [...prev, tag.value]
                  )
                }}
              >
                {tag.label}
              </Button>
            ))}
            <Input
              type="number"
              placeholder="Calorias máx."
              value={maxCalories}
              onChange={(e) => setMaxCalories(e.target.value)}
              className="w-32"
            />
          </div>
        </div>

        {/* Lista de receitas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recipes.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <UtensilsCrossed className="h-12 w-12 text-minimal-muted mx-auto mb-4" />
              <p className="text-minimal-muted">Nenhuma receita encontrada</p>
            </div>
          ) : (
            recipes.map((recipe) => {
              const tags = recipe.tags ? JSON.parse(recipe.tags) : []
              return (
                <div key={recipe.id} className="card-minimal p-4 hover:bg-slate-800/50 transition-colors">
                  <h3 className="text-lg font-semibold text-white mb-2">{recipe.name}</h3>
                  {recipe.description && (
                    <p className="text-sm text-minimal-muted mb-3 line-clamp-2">
                      {recipe.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {tags.map((tag: string) => (
                      <span
                        key={tag}
                        className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-1 text-minimal-muted">
                      <Flame className="h-4 w-4" />
                      <span>{recipe.calories} kcal</span>
                    </div>
                    <div className="flex items-center gap-1 text-minimal-muted">
                      <Users className="h-4 w-4" />
                      <span>{recipe.servings} porções</span>
                    </div>
                    {(recipe.prepTime || recipe.cookTime) && (
                      <div className="flex items-center gap-1 text-minimal-muted">
                        <Clock className="h-4 w-4" />
                        <span>
                          {recipe.prepTime && recipe.cookTime
                            ? `${recipe.prepTime + recipe.cookTime} min`
                            : recipe.prepTime
                            ? `${recipe.prepTime} min`
                            : `${recipe.cookTime} min`}
                        </span>
                      </div>
                    )}
                    <div className="text-minimal-muted">
                      P: {recipe.protein}g • C: {recipe.carbs}g • G: {recipe.fat}g
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Dialog de criar receita (apenas admin) */}
        {userIsAdmin && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nova Receita</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-minimal-muted">
                  Funcionalidade em desenvolvimento. Em breve você poderá criar receitas aqui.
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Fechar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </MainLayout>
  )
}

