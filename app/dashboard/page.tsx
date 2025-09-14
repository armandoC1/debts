"use client"

import { useState, useEffect, useMemo } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts"
import { Users, CreditCard, DollarSign, Calendar } from "lucide-react"

// 👇 Usa tu spinner
import { Spinner } from "@/components/ui/spinner"

type DashboardStats = {
  totalClients: number
  totalDebt: number
  totalPaid: number
  paymentsToday: number
  recentPayments: Array<{
    id: string
    clientName?: string
    amount: number
    userName?: string
    createdAt: string
    notes?: string | null
  }>
}

const chartConfig = {
  payments: { label: "Pagos", color: "hsl(var(--chart-1))" },
  amount: { label: "Monto", color: "hsl(var(--chart-2))" },
}

// Genera YYYY-MM-DD en zona local (evita el desfase por UTC)
function toLocalDateKey(d: Date) {
  const tz = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - tz).toISOString().slice(0, 10)
}

// Desempaqueta respuestas que vengan como { ok, data } o directas
async function readJsonSafe<T = any>(res: Response): Promise<T | null> {
  try {
    const j = await res.json()
    return (j && typeof j === "object" && "data" in j ? (j as any).data : j) as T
  } catch {
    return null
  }
}

export default function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState<string>(() => toLocalDateKey(new Date()))
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    totalDebt: 0,
    totalPaid: 0,
    paymentsToday: 0,
    recentPayments: [],
  })
  const [chartData, setChartData] = useState<any[]>([])
  const [debtDistribution, setDebtDistribution] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Para mostrar la misma fecha que se usa en las consultas, sin desfase visual
  const selectedDateLabel = useMemo(
    () => format(new Date(selectedDate + "T00:00:00"), "dd/MM/yyyy", { locale: es }),
    [selectedDate],
  )

  useEffect(() => {
    let cancelled = false

    const fetchDashboardData = async () => {
      try {
        setLoading(true)

        // ------- Stats -------
        const sRes = await fetch(`/api/dashboard/stats?date=${encodeURIComponent(selectedDate)}`, {
          cache: "no-store",
        })
        const sData = (await readJsonSafe<any>(sRes)) || {}
        if (!cancelled) {
          setStats({
            totalClients: Number(sData.totalClients ?? 0),
            totalDebt: Number(sData.totalDebt ?? 0),
            totalPaid: Number(sData.totalPaid ?? 0),
            paymentsToday: Number(sData.paymentsToday ?? 0),
            recentPayments: Array.isArray(sData.recentPayments) ? sData.recentPayments : [],
          })
        }

        // ------- Chart (últimos 7 días) -------
        const cRes = await fetch("/api/dashboard/chart-data", { cache: "no-store" })
        const cData = (await readJsonSafe<any[]>(cRes)) || []
        if (!cancelled) setChartData(Array.isArray(cData) ? cData : [])

        // ------- Distribución de deuda -------
        const dRes = await fetch("/api/dashboard/debt-distribution", { cache: "no-store" })
        const dData = (await readJsonSafe<any[]>(dRes)) || []
        if (!cancelled) setDebtDistribution(Array.isArray(dData) ? dData : [])
      } catch (e) {
        console.error("Error fetching dashboard data:", e)
        if (!cancelled) {
          setStats({ totalClients: 0, totalDebt: 0, totalPaid: 0, paymentsToday: 0, recentPayments: [] })
          setChartData([])
          setDebtDistribution([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchDashboardData()
    return () => {
      cancelled = true
    }
  }, [selectedDate])

  return (
    <ProtectedRoute requiredRole="admin">
      <DashboardLayout breadcrumbs={[{ label: "Dashboard" }]}>
        {/* Contenedor relativo para poder superponer el overlay */}
        <div className="relative space-y-6">
          {/* Overlay de carga usando tu Spinner */}
          {loading && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-background/60 backdrop-blur-sm">
              <Spinner size="xl" />
              <p className="text-sm text-muted-foreground">Cargando dashboard…</p>
            </div>
          )}

          {/* Header con selector de fecha (en zona local) */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground">Resumen de pagos y estadísticas de tu negocio</p>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="date">Fecha:</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-auto"
              />
            </div>
          </div>

          {/* Tarjetas de stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalClients}</div>
                <p className="text-xs text-muted-foreground">Clientes registrados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Deuda Total</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${Number(stats.totalDebt || 0).toLocaleString("en-US")}</div>
                <p className="text-xs text-muted-foreground">Pendiente de cobro</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Cobrado</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${Number(stats.totalPaid || 0).toLocaleString("en-US")}</div>
                <p className="text-xs text-muted-foreground">Histórico de pagos</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pagos del Día</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${Number(stats.paymentsToday || 0).toLocaleString("en-US")}
                </div>
                <p className="text-xs text-muted-foreground">{selectedDateLabel}</p>
              </CardContent>
            </Card>
          </div>

          {/* Gráficas */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Pagos de los Últimos 7 Días</CardTitle>
                <CardDescription>Evolución de pagos recibidos</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig}>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line
                        type="monotone"
                        dataKey="amount"
                        stroke="var(--color-amount)"
                        strokeWidth={2}
                        dot={{ fill: "var(--color-amount)" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribución de Deudas</CardTitle>
                <CardDescription>Deudas pendientes por cliente</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig}>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={debtDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry: any) => `${entry.name} ${(entry.percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {debtDistribution.map((_, index) => (
                          <Cell key={index} fill={`hsl(var(--chart-${(index % 5) + 1}))`} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Pagos recientes */}
          <Card>
            <CardHeader>
              <CardTitle>Pagos Recientes</CardTitle>
              <CardDescription>Últimos 10 pagos registrados en el sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Recibido por</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Notas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(stats.recentPayments ?? []).length > 0 ? (
                    stats.recentPayments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.clientName || "Cliente no encontrado"}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">${Number(p.amount || 0).toLocaleString("en-US")}</Badge>
                        </TableCell>
                        <TableCell>{p.userName || "Usuario no encontrado"}</TableCell>
                        <TableCell>
                          {format(new Date(p.createdAt), "dd/MM/yyyy hh:mm a", { locale: es }).replace(".", "")}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{p.notes || "-"}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No hay pagos recientes
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
