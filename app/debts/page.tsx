"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Debt, Client, User } from "@/lib/types"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CreditCard, Plus, Search, DollarSign, TrendingUp, Calendar } from "lucide-react"

export default function DebtsPage() {
  const [debts, setDebts] = useState<Debt[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredDebts, setFilteredDebts] = useState<Debt[]>([])

  // Cargar datos desde la API (evita usar Database.* directo en el cliente)
  useEffect(() => {
    const load = async () => {
      try {
        const [resDebts, resClients, resUsers] = await Promise.all([
          fetch("/api/debts", { cache: "no-store" }),
          fetch("/api/clients", { cache: "no-store" }),
          fetch("/api/users", { cache: "no-store" }),
        ])

        const jsonDebts = await resDebts.json().catch(() => ({}))
        const jsonClients = await resClients.json().catch(() => ({}))
        const jsonUsers = await resUsers.json().catch(() => ({}))

        setDebts(Array.isArray(jsonDebts?.data) ? jsonDebts.data : [])
        setClients(Array.isArray(jsonClients?.data) ? jsonClients.data : [])
        setUsers(Array.isArray(jsonUsers?.data) ? jsonUsers.data : [])
        setFilteredDebts(Array.isArray(jsonDebts?.data) ? jsonDebts.data : [])
      } catch {
        setDebts([])
        setClients([])
        setUsers([])
        setFilteredDebts([])
      }
    }
    load()
  }, [])

  // Índices para buscar rápido en render (sin Promises)
  const clientsById = useMemo(
    () =>
      clients.reduce<Record<string, Client>>((acc, c) => {
        acc[c.id] = c
        return acc
      }, {}),
    [clients],
  )

  const usersById = useMemo(
    () =>
      users.reduce<Record<string, User>>((acc, u) => {
        acc[u.id] = u
        return acc
      }, {}),
    [users],
  )

  // Filtro por título, cliente o usuario que creó
  useEffect(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) {
      setFilteredDebts(debts)
      return
    }
    const filtered = debts.filter((debt) => {
      const clientName = clientsById[debt.clientId]?.name?.toLowerCase() || ""
      const userName = usersById[debt.createdBy]?.name?.toLowerCase() || ""
      return (
        debt.title.toLowerCase().includes(term) ||
        clientName.includes(term) ||
        userName.includes(term)
      )
    })
    setFilteredDebts(filtered)
  }, [searchTerm, debts, clientsById, usersById])

  // Monto total = suma de saldos actuales (clients.totalDebt)
  const totalDebtAmount =
    clients.length > 0
      ? clients.reduce((sum, c) => sum + Number(c.totalDebt || 0), 0)
      : 0

  const unpaidDebts = debts.filter((debt) => !debt.isPaid).length
  const thisMonthDebts = debts.filter((debt) => {
    const debtDate = new Date(debt.createdAt)
    const now = new Date()
    return debtDate.getMonth() === now.getMonth() && debtDate.getFullYear() === now.getFullYear()
  })

  return (
    <ProtectedRoute requiredRole="admin">
      <DashboardLayout breadcrumbs={[{ label: "Gestión de Deudas" }]}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Gestión de Deudas</h1>
              <p className="text-muted-foreground">Administra todas las deudas registradas en el sistema</p>
            </div>
            <Button asChild>
              <Link href="/debts/new">
                <Plus className="mr-2 h-4 w-4" />
                Nueva Deuda
              </Link>
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Deudas</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{debts.length}</div>
                <p className="text-xs text-muted-foreground">Deudas registradas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monto Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${Number(totalDebtAmount || 0).toLocaleString("en-US")}
                </div>
                <p className="text-xs text-muted-foreground">Saldo actual pendiente</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Deudas Pendientes</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{unpaidDebts}</div>
                <p className="text-xs text-muted-foreground">Sin saldar completamente</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Este Mes</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{thisMonthDebts.length}</div>
                <p className="text-xs text-muted-foreground">Deudas creadas</p>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <Card>
            <CardHeader>
              <CardTitle>Buscar Deudas</CardTitle>
              <CardDescription>Busca por título, cliente o usuario que creó la deuda</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar deuda..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </CardContent>
          </Card>

          {/* Debts Table */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Deudas ({filteredDebts.length})</CardTitle>
              <CardDescription>Todas las deudas registradas en el sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Creado por</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDebts.map((debt) => {
                    const client = clientsById[debt.clientId]
                    const user = usersById[debt.createdBy]
                    // Mostrar SALDO ACTUAL del cliente; si no está el cliente cargado aún, usa el monto original
                    const currentClientDebt =
                      client?.totalDebt !== undefined ? Number(client.totalDebt) : Number(debt.amount)

                    return (
                      <TableRow key={debt.id}>
                        <TableCell className="font-medium">{debt.title}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{client?.name || "Cliente no encontrado"}</div>
                            <div className="text-sm text-muted-foreground">ID: {debt.clientId}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="destructive">
                            ${currentClientDebt.toLocaleString("en-US")}
                          </Badge>
                        </TableCell>
                        <TableCell>{user?.name || "Usuario no encontrado"}</TableCell>
                        <TableCell>
                          {format(new Date(debt.createdAt), "dd/MM/yyyy HH:mm", { locale: es })}
                        </TableCell>
                        <TableCell>
                          <Badge variant={debt.isPaid ? "secondary" : "destructive"}>
                            {debt.isPaid ? "Pagada" : "Pendiente"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {filteredDebts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="text-muted-foreground">
                          {searchTerm ? "No se encontraron deudas" : "No hay deudas registradas"}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
