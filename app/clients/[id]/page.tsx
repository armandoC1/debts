"use client";

import { Label } from "@/components/ui/label";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ProtectedRoute } from "@/components/protected-route";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
// ⛔️ Quitado: import { Database } from "@/lib/database";
import type { Client, Debt, Payment } from "@/lib/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowLeft,
  CreditCard,
  Plus,
  DollarSign,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";

const chartConfig = {
  debts: {
    label: "Deudas",
    color: "hsl(var(--chart-1))",
  },
  payments: {
    label: "Pagos",
    color: "hsl(var(--chart-2))",
  },
};

export default function ClientDetailPage() {
  const params = useParams();
  const clientId = params.id as string;
  const [client, setClient] = useState<Client | null>(null);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    if (!clientId) return;

    const fetchData = async () => {
      try {
        const [cRes, dRes, pRes] = await Promise.all([
          fetch(`/api/clients/${clientId}`, { cache: "no-store" }),
          fetch(`/api/debts?clientId=${encodeURIComponent(clientId)}`, {
            cache: "no-store",
          }),
          fetch(`/api/payments?clientId=${encodeURIComponent(clientId)}`, {
            cache: "no-store",
          }),
        ]);

        const cJson = await cRes.json();
        const dJson = await dRes.json();
        const pJson = await pRes.json();

        setClient(cJson?.data ?? null);
        setDebts(dJson?.data ?? []);
        setPayments(pJson?.data ?? []);

        // Generate chart data for the last 30 days
        const last30Days: any[] = [];
        const clientDebts: Debt[] = dJson?.data ?? [];
        const clientPayments: Payment[] = pJson?.data ?? [];

        for (let i = 29; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);

          const dayDebts = clientDebts.filter(
            (debt) =>
              new Date(debt.createdAt).toDateString() === date.toDateString()
          );
          const dayPayments = clientPayments.filter(
            (payment) =>
              new Date(payment.createdAt).toDateString() === date.toDateString()
          );

          const totalDebts = dayDebts.reduce(
            (sum, debt) => sum + Number(debt.amount || 0),
            0
          );
          const totalPayments = dayPayments.reduce(
            (sum, payment) => sum + Number(payment.amount || 0),
            0
          );

          if (totalDebts > 0 || totalPayments > 0) {
            last30Days.push({
              date: format(date, "dd/MM", { locale: es }),
              debts: totalDebts,
              payments: totalPayments,
            });
          }
        }
        setChartData(last30Days);
      } catch (e) {
        console.error("Error loading client detail:", e);
        setClient(null);
        setDebts([]);
        setPayments([]);
        setChartData([]);
      }
    };

    fetchData();
  }, [clientId]);

  if (!client) {
    return (
      <ProtectedRoute requiredRole="admin">
        <DashboardLayout>
          <div className="text-center py-8">
            <h1 className="text-2xl font-bold text-destructive">
              Cliente no encontrado
            </h1>
            <p className="text-muted-foreground mt-2">
              El cliente que buscas no existe.
            </p>
            <Button asChild className="mt-4">
              <Link href="/clients">Volver a Clientes</Link>
            </Button>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const totalPaid = payments.reduce(
    (sum, payment) => sum + Number(payment.amount || 0),
    0
  );
  const totalDebtAmount = debts.reduce(
    (sum, debt) => sum + Number(debt.amount || 0),
    0
  );

  return (
    <ProtectedRoute requiredRole="admin">
      <DashboardLayout
        breadcrumbs={[
          { label: "Ver Clientes", href: "/clients" },
          { label: client.name },
        ]}
      >
        {/* TODO: el resto del JSX queda EXACTAMENTE igual */}
        {/* --- A partir de aquí todo tu diseño original sin cambios --- */}

        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/clients">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold tracking-tight">
                {client.name}
              </h1>
              <p className="text-muted-foreground">
                Historial completo del cliente
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href={`/debts/new?clientId=${client.id}`}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Agregar Deuda
                </Link>
              </Button>
              <Button asChild>
                <Link href={`/payments/new?clientId=${client.id}`}>
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Pago
                </Link>
              </Button>
            </div>
          </div>

          {/* Client Info */}
          <Card>
            <CardHeader>
              <CardTitle>Información del Cliente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Nombre
                  </Label>
                  <p className="text-lg font-semibold">{client.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    ID Cliente
                  </Label>
                  <p className="text-lg font-semibold">{client.id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Teléfono
                  </Label>
                  <p className="text-lg font-semibold">
                    {client.phone || "No registrado"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Email
                  </Label>
                  <p className="text-lg font-semibold">
                    {client.email || "No registrado"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Fecha de Registro
                  </Label>
                  <p className="text-lg font-semibold">
                    {format(new Date(client.createdAt), "dd/MM/yyyy", {
                      locale: es,
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Deuda Actual
                </CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  ${client.totalDebt.toLocaleString("en-US")}
                </div>
                <p className="text-xs text-muted-foreground">Saldo pendiente</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Pagado
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  ${totalPaid.toLocaleString("en-US")}
                </div>
                <p className="text-xs text-muted-foreground">
                  Histórico de pagos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Deudas
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${totalDebtAmount.toLocaleString("en-US")}
                </div>
                <p className="text-xs text-muted-foreground">
                  {debts.length} deudas registradas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pagos Realizados
                </CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{payments.length}</div>
                <p className="text-xs text-muted-foreground">Transacciones</p>
              </CardContent>
            </Card>
          </div>

          {/* Chart */}
          {chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Historial de Deudas y Pagos</CardTitle>
                <CardDescription>
                  Evolución de deudas y pagos en los últimos 30 días
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig}>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar
                        dataKey="debts"
                        fill="var(--color-debts)"
                        name="Deudas"
                      />
                      <Bar
                        dataKey="payments"
                        fill="var(--color-payments)"
                        name="Pagos"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          {/* Tables */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Debts Table */}
            <Card>
              <CardHeader>
                <CardTitle>Deudas ({debts.length})</CardTitle>
                <CardDescription>
                  Historial de deudas registradas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Título</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Fecha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {debts.map((debt) => (
                      <TableRow key={debt.id}>
                        <TableCell className="font-medium">
                          {debt.title}
                        </TableCell>
                        <TableCell>
                          <Badge variant="destructive">
                            ${Number(debt.amount).toLocaleString("en-US")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(debt.createdAt), "dd/MM/yyyy", {
                            locale: es,
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                    {debts.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="text-center py-4 text-muted-foreground"
                        >
                          No hay deudas registradas
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Payments Table */}
            <Card>
              <CardHeader>
                <CardTitle>Pagos ({payments.length})</CardTitle>
                <CardDescription>Historial de pagos recibidos</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Monto</TableHead>
                      <TableHead>Recibido por</TableHead>
                      <TableHead>Fecha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <Badge variant="secondary">
                            ${Number(payment.amount).toLocaleString("en-US")}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {payment.receivedByName ?? "Usuario no encontrado"}
                        </TableCell>
                        <TableCell>
                          {format(
                            new Date(payment.createdAt),
                            "dd/MM/yyyy HH:mm",
                            { locale: es }
                          )}
                        </TableCell>
                      </TableRow>
                    ))}

                    {payments.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="text-center py-4 text-muted-foreground"
                        >
                          No hay pagos registrados
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
