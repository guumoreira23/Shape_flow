"use client"

import { useCallback, useMemo, useState, useEffect } from "react"
import { Users, Shield, RefreshCcw, Search, UserPlus, ShieldCheck, UserCog, Trash2, KeyRound, FileText, Calendar } from "lucide-react"
import { MainLayout } from "@/components/layout/MainLayout"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/use-toast"
import { formatDateDisplay } from "@/lib/utils/date"
import { cn } from "@/lib/utils"

type AdminUser = {
  id: string
  email: string
  role: "user" | "admin"
  createdAt: string
}

type RoleFilter = "all" | "admin" | "user"

type AdminMetrics = {
  totalUsers: number
  adminCount: number
  memberCount: number
  newUsersThisWeek: number
  lastSync: string
}

interface AdminDashboardProps {
  currentAdminEmail: string
  currentAdminId: string
  initialUsers: AdminUser[]
  metrics: AdminMetrics
}

const roleLabels: Record<AdminUser["role"], string> = {
  admin: "Administrador",
  user: "Usuário",
}

const roleFilterLabels: Record<RoleFilter, string> = {
  all: "Todos",
  admin: "Administradores",
  user: "Usuários",
}

function formatDateTime(value: string) {
  const date = new Date(value)
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export function AdminDashboard({
  currentAdminEmail,
  currentAdminId,
  initialUsers,
  metrics,
}: AdminDashboardProps) {
  const { toast } = useToast()
  const [users, setUsers] = useState<AdminUser[]>(initialUsers)
  const [stats, setStats] = useState<AdminMetrics>(metrics)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all")
  const [dateFilter, setDateFilter] = useState<string>("") // Filtro por data de cadastro
  const [isSyncing, setIsSyncing] = useState(false)
  const [activeTab, setActiveTab] = useState<"users" | "audit">("users")
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [isLoadingAudit, setIsLoadingAudit] = useState(false)

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newUserEmail, setNewUserEmail] = useState("")
  const [newUserPassword, setNewUserPassword] = useState("")
  const [newUserRole, setNewUserRole] = useState<AdminUser["role"]>("user")
  const [isCreatingUser, setIsCreatingUser] = useState(false)

  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [newRole, setNewRole] = useState<AdminUser["role"]>("user")
  const [isUpdatingRole, setIsUpdatingRole] = useState(false)

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [userPendingDeletion, setUserPendingDeletion] = useState<AdminUser | null>(null)
  const [isDeletingUser, setIsDeletingUser] = useState(false)

  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [userPendingPasswordReset, setUserPendingPasswordReset] = useState<AdminUser | null>(null)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isResettingPassword, setIsResettingPassword] = useState(false)

  const recalcStats = useCallback(
    (list: AdminUser[]): AdminMetrics => {
      const total = list.length
      const adminCount = list.filter((user) => user.role === "admin").length
      const memberCount = total - adminCount

      const now = new Date()
      const sevenDaysAgo = new Date(now)
      sevenDaysAgo.setDate(now.getDate() - 7)

      const newUsersThisWeek = list.filter((user) => {
        const createdAt = new Date(user.createdAt)
        return createdAt >= sevenDaysAgo
      }).length

      return {
        totalUsers: total,
        adminCount,
        memberCount,
        newUsersThisWeek,
        lastSync: new Date().toISOString(),
      }
    },
    []
  )

  const handleRefresh = useCallback(async () => {
    setIsSyncing(true)
    try {
      const response = await fetch("/api/admin/users", {
        method: "GET",
        cache: "no-store",
      })

      if (!response.ok) {
        throw new Error("Erro ao atualizar lista de usuários")
      }

      const data: AdminUser[] = await response.json()
      setUsers(data)
      setStats(recalcStats(data))
      toast({
        title: "Lista atualizada",
        description: "Os dados foram sincronizados com sucesso.",
      })
    } catch (error: any) {
      toast({
        title: "Não foi possível atualizar",
        description: error?.message || "Tente novamente em instantes.",
        variant: "destructive",
      })
    } finally {
      setIsSyncing(false)
    }
  }, [recalcStats, toast])

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const roleMatch = roleFilter === "all" || user.role === roleFilter
      const searchMatch =
        searchTerm.trim().length === 0 ||
        user.email.toLowerCase().includes(searchTerm.trim().toLowerCase())
      const dateMatch = !dateFilter || user.createdAt.startsWith(dateFilter)
      return roleMatch && searchMatch && dateMatch
    })
  }, [users, roleFilter, searchTerm, dateFilter])

  const openCreateDialog = () => {
    setNewUserEmail("")
    setNewUserPassword("")
    setNewUserRole("user")
    setIsCreateDialogOpen(true)
  }

  const handleCreateUser = async () => {
    if (!newUserEmail.trim() || !newUserPassword.trim()) {
      toast({
        title: "Preencha todos os campos",
        description: "Informe email, senha e role para criar o usuário.",
        variant: "destructive",
      })
      return
    }

    if (newUserPassword.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      })
      return
    }

    setIsCreatingUser(true)
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

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result?.error || "Erro ao criar usuário")
      }

      toast({
        title: "Usuário criado com sucesso!",
        description: "As credenciais foram registradas e já podem ser usadas.",
      })

      const createdUser: AdminUser = {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        createdAt: new Date().toISOString(),
      }

      setIsCreateDialogOpen(false)
      setUsers((current) => {
        const updated = [createdUser, ...current]
        setStats(recalcStats(updated))
        return updated
      })
    } catch (error: any) {
      toast({
        title: "Erro ao criar usuário",
        description: error?.message || "Tente novamente em instantes.",
        variant: "destructive",
      })
    } finally {
      setIsCreatingUser(false)
    }
  }

  const openRoleDialog = (user: AdminUser) => {
    setSelectedUser(user)
    setNewRole(user.role)
    setIsRoleDialogOpen(true)
  }

  const handleUpdateRole = async () => {
    if (!selectedUser) return

    if (selectedUser.id === currentAdminId && newRole !== "admin") {
      toast({
        title: "Ação não permitida",
        description: "Você não pode remover seu próprio acesso de administrador.",
        variant: "destructive",
      })
      return
    }

    setIsUpdatingRole(true)
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data?.error || "Erro ao atualizar role do usuário")
      }

      toast({
        title: "Permissões atualizadas",
        description: `${selectedUser.email} agora é ${roleLabels[newRole]}.`,
      })

      setUsers((current) => {
        const updated = current.map((user) =>
          user.id === selectedUser.id
            ? {
                ...user,
                role: newRole,
              }
            : user
        )
        setStats(recalcStats(updated))
        return updated
      })
      setIsRoleDialogOpen(false)
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar role",
        description: error?.message || "Tente novamente em instantes.",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingRole(false)
    }
  }

  const openDeleteDialog = (user: AdminUser) => {
    setUserPendingDeletion(user)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteUser = async () => {
    if (!userPendingDeletion) return

    if (userPendingDeletion.id === currentAdminId) {
      toast({
        title: "Ação não permitida",
        description: "Você não pode excluir seu próprio usuário.",
        variant: "destructive",
      })
      return
    }

    setIsDeletingUser(true)
    try {
      const response = await fetch(`/api/admin/users/${userPendingDeletion.id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || "Erro ao excluir usuário")
      }

      toast({
        title: "Usuário removido",
        description: `${userPendingDeletion.email} foi excluído do sistema.`,
      })

      setUsers((current) => {
        const updated = current.filter((user) => user.id !== userPendingDeletion.id)
        setStats(recalcStats(updated))
        return updated
      })
      setIsDeleteDialogOpen(false)
      setUserPendingDeletion(null)
    } catch (error: any) {
      toast({
        title: "Erro ao excluir usuário",
        description: error?.message || "Tente novamente em instantes.",
        variant: "destructive",
      })
    } finally {
      setIsDeletingUser(false)
    }
  }

  const openPasswordDialog = (user: AdminUser) => {
    setUserPendingPasswordReset(user)
    setNewPassword("")
    setConfirmPassword("")
    setIsPasswordDialogOpen(true)
  }

  const handleResetPassword = async () => {
    if (!userPendingPasswordReset) return

    if (!newPassword.trim() || !confirmPassword.trim()) {
      toast({
        title: "Preencha todos os campos",
        description: "Informe a nova senha e confirmação.",
        variant: "destructive",
      })
      return
    }

    if (newPassword.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      })
      return
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Senhas não coincidem",
        description: "As senhas informadas não são iguais.",
        variant: "destructive",
      })
      return
    }

    setIsResettingPassword(true)
    try {
      const response = await fetch(`/api/admin/users/${userPendingPasswordReset.id}/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || "Erro ao resetar senha")
      }

      toast({
        title: "Senha atualizada",
        description: `A senha de ${userPendingPasswordReset.email} foi alterada com sucesso.`,
      })

      setIsPasswordDialogOpen(false)
      setUserPendingPasswordReset(null)
      setNewPassword("")
      setConfirmPassword("")
    } catch (error: any) {
      toast({
        title: "Erro ao resetar senha",
        description: error?.message || "Tente novamente em instantes.",
        variant: "destructive",
      })
    } finally {
      setIsResettingPassword(false)
    }
  }

  const hasFilters = searchTerm.trim().length > 0 || roleFilter !== "all" || dateFilter !== ""

  const loadAuditLogs = async () => {
    setIsLoadingAudit(true)
    try {
      const response = await fetch("/api/admin/audit", {
        credentials: "include",
      })
      if (!response.ok) throw new Error("Erro ao carregar logs")
      const data = await response.json()
      setAuditLogs(data)
    } catch (error) {
      console.error("Error loading audit logs:", error)
      toast({
        title: "Erro ao carregar logs de auditoria",
        variant: "destructive",
      })
    } finally {
      setIsLoadingAudit(false)
    }
  }

  useEffect(() => {
    if (activeTab === "audit") {
      loadAuditLogs()
    }
  }, [activeTab])

  return (
    <MainLayout userIsAdmin>
      <div className="space-y-10">
        <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-semibold text-white">Central Administrativa</h1>
                <p className="text-sm sm:text-base text-minimal-muted">
                  Controle usuários, permissões e acompanhe a saúde da plataforma.
                </p>
              </div>
            </div>
            <p className="mt-4 text-xs sm:text-sm text-slate-400">
              Logado como <span className="font-medium text-white">{currentAdminEmail}</span>. Última sincronização{" "}
              <span className="font-medium text-white">{formatDateTime(stats.lastSync)}</span>.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              className="gap-2 text-sm sm:text-base"
              onClick={handleRefresh}
              disabled={isSyncing}
            >
              <RefreshCcw className={cn("h-4 w-4", isSyncing && "animate-spin")} />
              <span className="hidden sm:inline">{isSyncing ? "Sincronizando..." : "Atualizar dados"}</span>
              <span className="sm:hidden">{isSyncing ? "Sincronizando..." : "Atualizar"}</span>
            </Button>
            <Button className="gap-2 text-sm sm:text-base" onClick={openCreateDialog}>
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Novo usuário</span>
              <span className="sm:hidden">Novo</span>
            </Button>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <div className="card-minimal p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-minimal-muted">Total de usuários</p>
              <Users className="h-5 w-5 text-slate-500" />
            </div>
            <p className="mt-4 text-3xl font-semibold text-white">{stats.totalUsers}</p>
            <p className="mt-2 text-xs text-slate-400">Contando contas ativas cadastradas</p>
          </div>

          <div className="card-minimal p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-minimal-muted">Administradores</p>
              <Shield className="h-5 w-5 text-blue-400" />
            </div>
            <p className="mt-4 text-3xl font-semibold text-blue-400">{stats.adminCount}</p>
            <p className="mt-2 text-xs text-slate-400">Equipe com acesso total ao painel</p>
          </div>

          <div className="card-minimal p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-minimal-muted">Usuários finais</p>
              <Users className="h-5 w-5 text-green-400" />
            </div>
            <p className="mt-4 text-3xl font-semibold text-green-400">{stats.memberCount}</p>
            <p className="mt-2 text-xs text-slate-400">Clientes utilizando o ShapeFlow</p>
          </div>

          <div className="card-minimal p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-minimal-muted">Novos na semana</p>
              <UserCog className="h-5 w-5 text-purple-400" />
            </div>
            <p className="mt-4 text-3xl font-semibold text-purple-400">{stats.newUsersThisWeek}</p>
            <p className="mt-2 text-xs text-slate-400">Inscritos nos últimos 7 dias</p>
          </div>
        </section>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-800">
          <button
            onClick={() => setActiveTab("users")}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
              activeTab === "users"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-minimal-muted hover:text-white"
            )}
          >
            <Users className="h-4 w-4 inline mr-2" />
            Usuários
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
              activeTab === "audit"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-minimal-muted hover:text-white"
            )}
          >
            <FileText className="h-4 w-4 inline mr-2" />
            Auditoria
          </button>
        </div>

        {activeTab === "users" && (
        <section className="card-minimal">
          <div className="border-b border-slate-800/50 p-4 sm:p-6 space-y-4 sm:space-y-6">
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-semibold text-white">Gestão de usuários</h2>
              <p className="text-sm text-minimal-muted">
                Filtre, edite permissões e gerencie o ciclo de vida das contas.
              </p>
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="relative lg:flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Buscar por email..."
                  className="pl-10 text-sm sm:text-base"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {(Object.keys(roleFilterLabels) as RoleFilter[]).map((filter) => (
                  <Button
                    key={filter}
                    type="button"
                    variant={roleFilter === filter ? "default" : "outline"}
                    className={cn(
                      "text-xs sm:text-sm",
                      roleFilter !== filter && "text-slate-300 border-slate-700"
                    )}
                    onClick={() => setRoleFilter(filter)}
                  >
                    {roleFilterLabels[filter]}
                  </Button>
                ))}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-500" />
                  <Input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-40 text-sm"
                    placeholder="Filtrar por data"
                  />
                </div>
              </div>
            </div>

            {hasFilters && (
              <div className="flex items-center justify-between rounded-lg border border-slate-800/60 bg-slate-900/60 px-4 py-3 text-sm text-slate-300">
                <span>
                  {filteredUsers.length} usuário{filteredUsers.length === 1 ? "" : "s"} encontrado
                  {roleFilter !== "all" ? ` com role ${roleFilterLabels[roleFilter].toLowerCase()}` : ""}.
                </span>
                <Button variant="ghost" className="text-slate-400 hover:text-white" onClick={() => {
                  setSearchTerm("")
                  setRoleFilter("all")
                  setDateFilter("")
                }}>
                  Limpar filtros
                </Button>
              </div>
            )}
          </div>

          <div className="overflow-x-auto -mx-4 sm:-mx-6 sm:mx-0">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-slate-800/50 text-left text-xs sm:text-sm text-minimal-muted">
                  <th className="p-3 sm:p-4 font-medium">Email</th>
                  <th className="p-3 sm:p-4 font-medium">Role</th>
                  <th className="p-3 sm:p-4 font-medium hidden sm:table-cell">Criado em</th>
                  <th className="p-3 sm:p-4 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-sm text-slate-400">
                      Nenhum usuário encontrado com os filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-slate-800/40 transition-colors hover:bg-slate-800/40"
                    >
                      <td className="p-3 sm:p-4">
                        <div className="space-y-1">
                          <p className="font-medium text-white text-sm sm:text-base break-all">{user.email}</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            {user.id === currentAdminId && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-300">
                                Você
                              </span>
                            )}
                            <span className="sm:hidden text-xs text-slate-400">
                              {formatDateDisplay(new Date(user.createdAt))}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 sm:p-4">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-md px-2 sm:px-3 py-1 text-xs font-semibold",
                            user.role === "admin"
                              ? "border border-blue-500/40 bg-blue-500/10 text-blue-300"
                              : "border border-slate-700 bg-slate-800/60 text-slate-300"
                          )}
                        >
                          {roleLabels[user.role]}
                        </span>
                      </td>
                      <td className="p-3 sm:p-4 text-sm text-slate-300 hidden sm:table-cell">
                        {formatDateDisplay(new Date(user.createdAt))}
                      </td>
                      <td className="p-3 sm:p-4">
                        <div className="flex justify-end gap-1 sm:gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 sm:gap-2 text-xs sm:text-sm"
                            onClick={() => openRoleDialog(user)}
                          >
                            <UserCog className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="hidden sm:inline">Permissões</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 sm:gap-2 text-xs sm:text-sm text-yellow-400 border-yellow-500/40 hover:bg-yellow-500/10"
                            onClick={() => openPasswordDialog(user)}
                          >
                            <KeyRound className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="hidden sm:inline">Senha</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2"
                            onClick={() => openDeleteDialog(user)}
                          >
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
        )}

        {activeTab === "audit" && (
          <section className="card-minimal">
            <div className="border-b border-slate-800/50 p-4 sm:p-6">
              <h2 className="text-xl font-semibold text-white">Logs de Auditoria</h2>
              <p className="text-sm text-minimal-muted mt-2">
                Histórico de ações realizadas pelos usuários no sistema.
              </p>
            </div>
            <div className="overflow-x-auto">
              {isLoadingAudit ? (
                <div className="p-8 text-center text-slate-400">Carregando logs...</div>
              ) : auditLogs.length === 0 ? (
                <div className="p-8 text-center text-slate-400">Nenhum log encontrado.</div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-800/50 text-left text-xs sm:text-sm text-minimal-muted">
                      <th className="p-3 sm:p-4 font-medium">Usuário</th>
                      <th className="p-3 sm:p-4 font-medium">Ação</th>
                      <th className="p-3 sm:p-4 font-medium">Entidade</th>
                      <th className="p-3 sm:p-4 font-medium hidden sm:table-cell">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => (
                      <tr
                        key={log.id}
                        className="border-b border-slate-800/40 transition-colors hover:bg-slate-800/40"
                      >
                        <td className="p-3 sm:p-4 text-sm text-white">{log.userId}</td>
                        <td className="p-3 sm:p-4 text-sm text-white">{log.action}</td>
                        <td className="p-3 sm:p-4 text-sm text-white">{log.entityType}</td>
                        <td className="p-3 sm:p-4 text-sm text-slate-300 hidden sm:table-cell">
                          {formatDateTime(log.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        )}

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Criar novo usuário</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newUserEmail">Email</Label>
                <Input
                  id="newUserEmail"
                  type="email"
                  value={newUserEmail}
                  onChange={(event) => setNewUserEmail(event.target.value)}
                  placeholder="usuario@exemplo.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newUserPassword">Senha temporária</Label>
                <Input
                  id="newUserPassword"
                  type="password"
                  value={newUserPassword}
                  onChange={(event) => setNewUserPassword(event.target.value)}
                  placeholder="Mínimo de 6 caracteres"
                />
                <p className="text-xs text-slate-400">
                  Solicite que o usuário altere a senha no primeiro acesso.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="newUserRole">Role inicial</Label>
                <Select value={newUserRole} onValueChange={(value: AdminUser["role"]) => setNewUserRole(value)}>
                  <SelectTrigger id="newUserRole">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Usuário</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateUser} disabled={isCreatingUser}>
                {isCreatingUser ? "Criando..." : "Criar usuário"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Atualizar permissões</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Email</Label>
                <p className="mt-1 text-sm text-white">{selectedUser?.email}</p>
              </div>
              <div>
                <Label htmlFor="newRole">Role</Label>
                <Select value={newRole} onValueChange={(value: AdminUser["role"]) => setNewRole(value)}>
                  <SelectTrigger id="newRole">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Usuário</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateRole} disabled={isUpdatingRole}>
                {isUpdatingRole ? "Salvando..." : "Salvar alterações"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Resetar senha</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Email</Label>
                <p className="mt-1 text-sm text-white">{userPendingPasswordReset?.email}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova senha</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="Mínimo de 6 caracteres"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Digite a senha novamente"
                />
              </div>
              <p className="text-xs text-slate-400">
                A senha será alterada imediatamente. O usuário precisará usar a nova senha no próximo login.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleResetPassword} disabled={isResettingPassword}>
                {isResettingPassword ? "Salvando..." : "Salvar senha"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Deseja remover este usuário?</AlertDialogTitle>
              <AlertDialogDescription>
                {userPendingDeletion ? (
                  <>
                    Você está prestes a remover <strong>{userPendingDeletion.email}</strong>. Todos os dados
                    associados serão excluídos permanentemente.
                  </>
                ) : (
                  "A exclusão do usuário é permanente."
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setUserPendingDeletion(null)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteUser}
                className="bg-red-600 hover:bg-red-700"
                disabled={isDeletingUser}
              >
                {isDeletingUser ? "Excluindo..." : "Excluir usuário"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  )
}


