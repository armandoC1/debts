"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import type { Client, Payment, User } from "@/lib/types"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { DollarSign, Plus, Search, TrendingUp, Calendar, Users } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"

async function readJsonSafe<T = any>(res: Response): Promise<T | null> {
  try {
    const j = await res.json()
    return (j && typeof j === "object" && "data" in j ? (j as any).data : j) as T
  } catch {
    return null
  }
}

type PayRow = Payment & {
  clientName?: string
  userName?: string
  userRoles?: string[]
  notes?: string | null
}

export default function PaymentsPage() {
  const [loading, setLoading] = useState(true)

  const [payments, setPayments] = useState<PayRow[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [users, setUsers] = useState<User[]>([])

  const [searchTerm, setSearchTerm] = useState("")
  const [filtered, setFiltered] = useState<PayRow[]>([])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        setLoading(true)

        const [pRes, cRes, uRes] = await Promise.all([
          fetch("/api/payments", { cache: "no-store" }),
          fetch("/api/clients", { cache: "no-store" }),
          fetch("/api/users", { cache: "no-store" }),
        ])

        const [pData, cData, uData] = await Promise.all([
          readJsonSafe<Payment[]>(pRes),
          readJsonSafe<Client[]>(cRes),
          readJsonSafe<User[]>(uRes),
        ])

        if (cancelled) return

        const cl = Array.isArray(cData) ? cData : []
        const us = Array.isArray(uData) ? uData : []
        const ps = Array.isArray(pData) ? pData : []

        const byClient = new Map(cl.map((c) => [c.id, c]))
        const byUser = new Map(us.map((u) => [u.id, u]))

        const withNames: PayRow[] = ps.map((p) => {
          const c = byClient.get(p.clientId)
          const u = byUser.get(p.receivedBy)
          return {
            ...p,
            clientName: c?.name,
            userName: u?.name,
            userRoles: u?.roles ?? [],
            notes: p.description ?? null, 
          }
        })

        setClients(cl)
        setUsers(us)
        setPayments(withNames)
        setFiltered(withNames)
      } catch (e) {
        console.error("Error loading payments page:", e)
        setClients([])
        setUsers([])
        setPayments([])
        setFiltered([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) {
      setFiltered(payments)
      return
    }

    const f = payments.filter((p) => {
      const client = (p.clientName || "").toLowerCase()
      const user = (p.userName || "").toLowerCase()
      const notes = (p.notes || "").toLowerCase()
      return client.includes(q) || user.includes(q) || notes.includes(q)
    })
    setFiltered(f)
  }, [searchTerm, payments])

  const totalPayments = useMemo(
    () => payments.reduce((s, p) => s + Number(p.amount || 0), 0),
    [payments],
  )

  const todayPayments = useMemo(() => {
    const todayKey = new Date().toDateString()
    return payments.filter((p) => new Date(p.createdAt).toDateString() === todayKey)
  }, [payments])

  const thisMonthPayments = useMemo(() => {
    const now = new Date()
    const m = now.getMonth()
    const y = now.getFullYear()
    return payments.filter((p) => {
      const d = new Date(p.createdAt)
      return d.getMonth() === m && d.getFullYear() === y
    })
  }, [payments])

  if (loading) {
    return (
      <ProtectedRoute requiredRole="admin">
        <DashboardLayout breadcrumbs={[{ label: "Gestión de Pagos" }]}>
          <div className="flex items-center justify-center h-64 gap-3 text-muted-foreground">
            <Spinner size="lg" />
            <span>Cargando pagos…</span>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <DashboardLayout breadcrumbs={[{ label: "Gestión de Pagos" }]}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Gestión de Pagos</h1>
              <p className="text-muted-foreground">Administra todos los pagos registrados en el sistema</p>
            </div>
            <Button asChild>
              <Link href="/payments/new">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Pago
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Pagos</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{payments.length}</div>
                <p className="text-xs text-muted-foreground">Pagos registrados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monto Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  ${totalPayments.toLocaleString("en-US")}
                </div>
                <p className="text-xs text-muted-foreground">Total recaudado</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pagos Hoy</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{todayPayments.length}</div>
                <p className="text-xs text-muted-foreground">
                  ${todayPayments.reduce((s, p) => s + Number(p.amount || 0), 0).toLocaleString("en-US")}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Este Mes</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{thisMonthPayments.length}</div>
                <p className="text-xs text-muted-foreground">
                  ${thisMonthPayments.reduce((s, p) => s + Number(p.amount || 0), 0).toLocaleString("en-US")}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <Card>
            <CardHeader>
              <CardTitle>Buscar Pagos</CardTitle>
              <CardDescription>Busca por cliente, usuario que recibió el pago o notas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar pago…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </CardContent>
          </Card>

          {/* Tabla */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Pagos ({filtered.length})</CardTitle>
              <CardDescription>Todos los pagos registrados en el sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Recibido por</TableHead>
                    <TableHead>Fecha y Hora</TableHead>
                    <TableHead>Notas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered
                    .slice()
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{p.clientName || "Cliente no encontrado"}</div>
                            <div className="text-sm text-muted-foreground">ID: {p.clientId}</div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            ${Number(p.amount || 0).toLocaleString("en-US")}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <div>
                            <div className="font-medium">{p.userName || "Usuario no encontrado"}</div>
                            <div className="text-sm text-muted-foreground">
                              {(p.userRoles ?? []).join(", ") || "Sin roles"}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {format(new Date(p.createdAt), "dd/MM/yyyy", { locale: es })}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {format(new Date(p.createdAt), "HH:mm", { locale: es })}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="max-w-xs">
                          <div className="truncate text-sm text-muted-foreground">{p.notes || "-"}</div>
                        </TableCell>
                      </TableRow>
                    ))}

                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <div className="text-muted-foreground">
                          {searchTerm ? "No se encontraron pagos" : "No hay pagos registrados"}
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
