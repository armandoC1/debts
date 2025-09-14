"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { User } from "@/lib/types"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { UserPlus, Users, Shield, ShieldCheck } from "lucide-react"

// helpers roles
function normalizeRoles(roles: User["roles"]): ("admin" | "superadmin")[] {
  if (Array.isArray(roles)) return roles as ("admin" | "superadmin")[]
  if (typeof roles === "string") {
    try {
      const parsed = JSON.parse(roles)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}
function normalizeUser(u: User): User {
  return { ...u, roles: normalizeRoles(u.roles) as any }
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    roles: [] as ("admin" | "superadmin")[],
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Cargar usuarios desde API
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/users", { cache: "no-store" })
        const json = await res.json()
        const list = Array.isArray(json?.data) ? json.data.map(normalizeUser) : []
        setUsers(list)
      } catch (e) {
        console.error(e)
        setUsers([])
      }
    }
    load()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!formData.name.trim()) return setError("El nombre es obligatorio")
    if (!formData.email.trim()) return setError("El email es obligatorio")
    if (!formData.password.trim()) return setError("La contraseña es obligatoria")
    if (formData.roles.length === 0) return setError("Debe asignar al menos un rol")

    try {
      // verificar email duplicado vía API
      const check = await fetch(`/api/users?email=${encodeURIComponent(formData.email)}`, { cache: "no-store" })
      const checkJson = await check.json()
      const exists = Array.isArray(checkJson?.data) && checkJson.data.length > 0
      if (exists) {
        setError("Ya existe un usuario con este email")
        return
      }

      // crear
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      const json = await res.json()
      if (!res.ok || !json?.ok) {
        setError(json?.error === "EMAIL_EXISTS" ? "Ya existe un usuario con este email" : "Error al crear el usuario")
        return
      }

      // recargar lista
      const resList = await fetch("/api/users", { cache: "no-store" })
      const jsonList = await resList.json()
      const list = Array.isArray(jsonList?.data) ? jsonList.data.map(normalizeUser) : []
      setUsers(list)

      setSuccess("Usuario creado exitosamente")
      setFormData({ name: "", phone: "", email: "", password: "", roles: [] })
      setTimeout(() => {
        setIsDialogOpen(false)
        setSuccess("")
      }, 1500)
    } catch (err) {
      console.error(err)
      setError("Error al crear el usuario")
    }
  }

  const handleRoleChange = (role: "admin" | "superadmin", checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      roles: checked ? [...prev.roles, role] : prev.roles.filter((r) => r !== role),
    }))
  }

  const getRoleIcon = (roles: string[]) =>
    roles.includes("superadmin") ? <ShieldCheck className="h-4 w-4 text-red-500" /> : <Shield className="h-4 w-4 text-blue-500" />
  const getRoleBadgeVariant = (role: string) => (role === "superadmin" ? "destructive" : "default")

  const adminsCount = users.filter((u) => normalizeRoles(u.roles).includes("admin")).length
  const superadminsCount = users.filter((u) => normalizeRoles(u.roles).includes("superadmin")).length

  return (
    <ProtectedRoute requiredRole="superadmin">
      <DashboardLayout breadcrumbs={[{ label: "Gestión de Usuarios" }]}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h1>
              <p className="text-muted-foreground">Administra los usuarios y sus permisos en el sistema</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Nuevo Usuario
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Usuario</DialogTitle>
                  <DialogDescription>Completa la información del nuevo usuario y asigna sus roles.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Nombre completo"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder="Número de teléfono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="correo@ejemplo.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                      placeholder="Contraseña segura"
                      required
                    />
                  </div>
                  <div className="space-y-3">
                    <Label>Roles *</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="admin"
                          checked={formData.roles.includes("admin")}
                          onCheckedChange={(checked) => handleRoleChange("admin", !!checked)}
                        />
                        <Label htmlFor="admin" className="text-sm font-normal">
                          Admin - Puede gestionar clientes, deudas y pagos
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="superadmin"
                          checked={formData.roles.includes("superadmin")}
                          onCheckedChange={(checked) => handleRoleChange("superadmin", !!checked)}
                        />
                        <Label htmlFor="superadmin" className="text-sm font-normal">
                          Superadmin - Acceso completo al sistema
                        </Label>
                      </div>
                    </div>
                  </div>
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  {success && (
                    <Alert>
                      <AlertDescription>{success}</AlertDescription>
                    </Alert>
                  )}
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">Crear Usuario</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-sm font-medium">Total de Usuarios</CardTitle>
                <CardDescription>Usuarios registrados en el sistema</CardDescription>
              </div>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
              <div className="flex gap-4 mt-2">
                <div className="text-xs text-muted-foreground">Admins: {adminsCount}</div>
                <div className="text-xs text-muted-foreground">Superadmins: {superadminsCount}</div>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Usuarios</CardTitle>
              <CardDescription>Todos los usuarios registrados y sus roles asignados</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Fecha de Registro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => {
                    const rolesArr = normalizeRoles(user.roles)
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {rolesArr.includes("superadmin") ? (
                              <ShieldCheck className="h-4 w-4 text-red-500" />
                            ) : (
                              <Shield className="h-4 w-4 text-blue-500" />
                            )}
                            <div>
                              <div className="font-medium">{user.name}</div>
                              <div className="text-sm text-muted-foreground">ID: {user.id}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.phone || "-"}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {rolesArr.map((role) => (
                              <Badge key={role} variant={role === "superadmin" ? "destructive" : "default"}>
                                {role}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>{format(new Date(user.createdAt), "dd/MM/yyyy", { locale: es })}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
