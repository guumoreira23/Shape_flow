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
import { Users, Shield, Trash2, UserPlus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { formatDateDisplay } from "@/lib/utils/date"
import { MainLayout } from "@/components/layout/MainLayout"

interface User {
  id: string
  email: string
  role: "user" | "admin"
  createdAt: string
}

interface AdminPanelProps {
  userIsAdmin?: boolean
}

export function AdminPanel({ userIsAdmin = true }: AdminPanelProps) {
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newRole, setNewRole] = useState<"user" | "admin">("user")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newUserEmail, setNewUserEmail] = useState("")
  const [newUserPassword, setNewUserPassword] = useState("")
  const [newUserRole, setNewUserRole] = useState<"user" | "admin">("user")

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

  const handleCreateUser = async () => {
    if (!newUserEmail.trim() || !newUserPassword.trim()) {
      toast({
        title: "Preencha todos os campos",
        variant: "destructive",
      })
      return
    }

    if (newUserPassword.length < 6) {
      toast({
        title: "Senha deve ter no mínimo 6 caracteres",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newUserEmail,
          password: newUserPassword,
          role: newUserRole,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erro ao criar usuário")
      }

      toast({
        title: "Usuário criado com sucesso!",
      })
      setIsCreateDialogOpen(false)
      setNewUserEmail("")
      setNewUserPassword("")
      setNewUserRole("user")
      loadUsers()
    } catch (error: any) {
      toast({
        title: "Erro ao criar usuário",
        description: error.message,
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
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-minimal-muted">Carregando...</p>
        </div>
      </MainLayout>
    )
  }

  const adminCount = users.filter((u) => u.role === "admin").length
  const userCount = users.filter((u) => u.role === "user").length

  return (
    <MainLayout userIsAdmin={userIsAdmin}>
      <div className="space-y-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Shield className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-white">Painel Administrativo</h1>
              <p className="text-minimal-muted">Gerencie usuários e permissões</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card-minimal p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
                <Users className="h-5 w-5 text-slate-400" />
              </div>
              <h3 className="text-sm font-medium text-minimal-muted">Total de Usuários</h3>
            </div>
            <p className="text-3xl font-semibold text-white mb-1">{users.length}</p>
          </div>

          <div className="card-minimal p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <Shield className="h-5 w-5 text-blue-400" />
              </div>
              <h3 className="text-sm font-medium text-minimal-muted">Administradores</h3>
            </div>
            <p className="text-3xl font-semibold text-blue-400 mb-1">{adminCount}</p>
          </div>

          <div className="card-minimal p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                <Users className="h-5 w-5 text-green-400" />
              </div>
              <h3 className="text-sm font-medium text-minimal-muted">Usuários</h3>
            </div>
            <p className="text-3xl font-semibold text-green-400 mb-1">{userCount}</p>
          </div>
        </div>

        <div className="card-minimal">
          <div className="p-6 border-b border-slate-800/50 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-white mb-1">Gerenciar Usuários</h2>
              <p className="text-sm text-minimal-muted">Visualize e gerencie todos os usuários do sistema</p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Criar Usuário
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Novo Usuário</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="newEmail">Email</Label>
                    <Input
                      id="newEmail"
                      type="email"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      placeholder="usuario@exemplo.com"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="newPassword">Senha</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="newUserRole">Role</Label>
                    <Select
                      value={newUserRole}
                      onValueChange={(value: "user" | "admin") => setNewUserRole(value)}
                    >
                      <SelectTrigger id="newUserRole" className="mt-1">
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
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateUser}>Criar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800/50">
                  <th className="text-left p-4 text-sm font-medium text-minimal-muted">Email</th>
                  <th className="text-left p-4 text-sm font-medium text-minimal-muted">Role</th>
                  <th className="text-left p-4 text-sm font-medium text-minimal-muted">Data de Criação</th>
                  <th className="text-right p-4 text-sm font-medium text-minimal-muted">Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 text-white font-medium">{user.email}</td>
                    <td className="p-4">
                      <span
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                          user.role === "admin"
                            ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                            : "bg-green-500/10 text-green-400 border border-green-500/20"
                        }`}
                      >
                        {user.role === "admin" ? "Admin" : "User"}
                      </span>
                    </td>
                    <td className="p-4 text-minimal-muted">
                      {formatDateDisplay(new Date(user.createdAt))}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(user)}
                          className="gap-2"
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
    </MainLayout>
  )
}

