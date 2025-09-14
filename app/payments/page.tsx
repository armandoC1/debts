"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Database } from "@/lib/database"
import type { Payment } from "@/lib/types"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { DollarSign, Plus, Search, TrendingUp, Calendar, Users } from "lucide-react"

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([])

  useEffect(() => {
    const allPayments = Database.getPayments()
    setPayments(allPayments)
    setFilteredPayments(allPayments)
  }, [])

  useEffect(() => {
    const filtered = payments.filter((payment) => {
      const client = Database.getClientById(payment.clientId)
      const user = Database.getUserById(payment.receivedBy)
      return (
        client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    })
    setFilteredPayments(filtered)
  }, [searchTerm, payments])

  const totalPayments = payments.reduce((sum, payment) => sum + payment.amount, 0)
  const todayPayments = payments.filter((payment) => {
    const paymentDate = new Date(payment.createdAt)
    const today = new Date()
    return paymentDate.toDateString() === today.toDateString()
  })
  const thisMonthPayments = payments.filter((payment) => {
    const paymentDate = new Date(payment.createdAt)
    const now = new Date()
    return paymentDate.getMonth() === now.getMonth() && paymentDate.getFullYear() === now.getFullYear()
  })

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

          {/* Stats Cards */}
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
                <div className="text-2xl font-bold text-green-600">${totalPayments.toLocaleString()}</div>
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
                  ${todayPayments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
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
                  ${thisMonthPayments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
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
                  placeholder="Buscar pago..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </CardContent>
          </Card>

          {/* Payments Table */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Pagos ({filteredPayments.length})</CardTitle>
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
                  {filteredPayments
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((payment) => {
                      const client = Database.getClientById(payment.clientId)
                      const user = Database.getUserById(payment.receivedBy)
                      return (
                        <TableRow key={payment.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{client?.name || "Cliente no encontrado"}</div>
                              <div className="text-sm text-muted-foreground">ID: {payment.clientId}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              ${payment.amount.toLocaleString()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{user?.name || "Usuario no encontrado"}</div>
                              <div className="text-sm text-muted-foreground">
                                {user?.roles.join(", ") || "Sin roles"}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {format(new Date(payment.createdAt), "dd/MM/yyyy", { locale: es })}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {format(new Date(payment.createdAt), "HH:mm", { locale: es })}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <div className="truncate text-sm text-muted-foreground">{payment.notes || "-"}</div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  {filteredPayments.length === 0 && (
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
