"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Users, Shield, Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { formatDateDisplay } from "@/lib/utils/date"

interface User {
  id: string
  email: string
  role: "user" | "admin"
  createdAt: string
}

export function AdminPanel() {
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newRole, setNewRole] = useState<"user" | "admin">("user")

  const loadUsers = async () => {
    try {
      const response = await fetch("/api/admin/users")
      if (!response.ok) {
        if (response.status === 403 || response.status === 401) {
          toast({
            title: "Acesso negado",
            description: "Você não tem permissão para acessar esta página",
            variant: "destructive",
          })
          window.location.href = "/dashboard"
          return
        }
        throw new Error("Erro ao carregar usuários")
      }
      const data = await response.json()
      setUsers(data)
    } catch (error) {
      console.error("Error loading users:", error)
      toast({
        title: "Erro ao carregar usuários",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleUpdateRole = async () => {
    if (!selectedUser) return

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      })

      if (!response.ok) {
        throw new Error("Erro ao atualizar role")
      }

      toast({
        title: "Role atualizada com sucesso!",
      })
      setIsDialogOpen(false)
      loadUsers()
    } catch (error) {
      toast({
        title: "Erro ao atualizar role",
        variant: "destructive",
      })
    }
  }

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`Tem certeza que deseja deletar o usuário ${email}?`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erro ao deletar usuário")
      }

      toast({
        title: "Usuário deletado com sucesso!",
      })
      loadUsers()
    } catch (error: any) {
      toast({
        title: "Erro ao deletar usuário",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (user: User) => {
    setSelectedUser(user)
    setNewRole(user.role)
    setIsDialogOpen(true)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-400">Carregando...</p>
      </div>
    )
  }

  const adminCount = users.filter((u) => u.role === "admin").length
  const userCount = users.filter((u) => u.role === "user").length

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="h-8 w-8 text-blue-400" />
          <h1 className="text-3xl font-bold text-white">Painel Administrativo</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-slate-400" />
              <h3 className="text-sm text-slate-400">Total de Usuários</h3>
            </div>
            <p className="text-2xl font-bold text-white">{users.length}</p>
          </div>

          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-5 w-5 text-blue-400" />
              <h3 className="text-sm text-slate-400">Administradores</h3>
            </div>
            <p className="text-2xl font-bold text-blue-400">{adminCount}</p>
          </div>

          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-green-400" />
              <h3 className="text-sm text-slate-400">Usuários</h3>
            </div>
            <p className="text-2xl font-bold text-green-400">{userCount}</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-lg">
          <div className="p-6 border-b border-slate-700">
            <h2 className="text-xl font-semibold text-white">Gerenciar Usuários</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left p-4 text-slate-400">Email</th>
                  <th className="text-left p-4 text-slate-400">Role</th>
                  <th className="text-left p-4 text-slate-400">Data de Criação</th>
                  <th className="text-right p-4 text-slate-400">Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-slate-700 hover:bg-slate-800">
                    <td className="p-4 text-white">{user.email}</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          user.role === "admin"
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-green-500/20 text-green-400"
                        }`}
                      >
                        {user.role === "admin" ? "Admin" : "User"}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400">
                      {formatDateDisplay(new Date(user.createdAt))}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(user)}
                        >
                          Editar Role
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id, user.email)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Role do Usuário</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Email</Label>
                <p className="text-sm text-slate-400 mt-1">{selectedUser?.email}</p>
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select
                  value={newRole}
                  onValueChange={(value: "user" | "admin") => setNewRole(value)}
                >
                  <SelectTrigger id="role" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateRole}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

