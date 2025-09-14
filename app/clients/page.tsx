"use client";

import { useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Client } from "@/lib/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Users,
  UserPlus,
  Eye,
  CreditCard,
  Plus,
  Search,
  DollarSign,
} from "lucide-react";

// 👇 tu spinner
import { Spinner } from "@/components/ui/spinner";

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true); // 👈 estado de carga

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true); // 👈 inicia carga
        const res = await fetch("/api/clients", { cache: "no-store" });
        const json = await res.json();
        const allClients = json?.data ?? [];
        setClients(allClients);
        setFilteredClients(allClients);
      } catch (e) {
        console.error("Error fetching clients:", e);
        setClients([]);
        setFilteredClients([]);
      } finally {
        setLoading(false); // 👈 termina carga
      }
    };
    fetchClients();
  }, []);

  useEffect(() => {
    const term = searchTerm.toLowerCase();
    const filtered = clients.filter(
      (client) =>
        client.name.toLowerCase().includes(term) ||
        client.phone?.toLowerCase().includes(term) ||
        client.email?.toLowerCase().includes(term)
    );
    setFilteredClients(filtered);
  }, [searchTerm, clients]);

  const totalDebt = clients.reduce(
    (sum, client) => sum + Number(client.totalDebt || 0),
    0
  );

  const clientsWithDebt = clients.filter((client) => client.totalDebt > 0).length;

  return (
    <ProtectedRoute requiredRole="admin">
      <DashboardLayout breadcrumbs={[{ label: "Ver Clientes" }]}>
        {/* Contenedor relativo para poder superponer el overlay */}
        <div className="relative space-y-6">
          {/* Overlay de carga */}
          {loading && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-background/60 backdrop-blur-sm">
              <Spinner size="xl" />
              <p className="text-sm text-muted-foreground">Cargando clientes…</p>
            </div>
          )}

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
              <p className="text-muted-foreground">
                Gestiona la información de tus clientes y sus deudas
              </p>
            </div>
            <Button asChild>
              <Link href="/clients/new">
                <UserPlus className="mr-2 h-4 w-4" />
                Nuevo Cliente
              </Link>
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{clients.length}</div>
                <p className="text-xs text-muted-foreground">Clientes registrados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Clientes con Deuda</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{clientsWithDebt}</div>
                <p className="text-xs text-muted-foreground">Tienen saldo pendiente</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Deuda Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${totalDebt.toLocaleString("en-US")}
                </div>
                <p className="text-xs text-muted-foreground">Pendiente de cobro</p>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <Card>
            <CardHeader>
              <CardTitle>Buscar Clientes</CardTitle>
              <CardDescription>Busca por nombre, teléfono o email</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </CardContent>
          </Card>

          {/* Clients Table */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Clientes ({filteredClients.length})</CardTitle>
              <CardDescription>Todos los clientes registrados en el sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Deuda Actual</TableHead>
                    <TableHead>Fecha de Registro</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{client.name}</div>
                          <div className="text-sm text-muted-foreground">ID: {client.id}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {client.phone && <div className="text-sm">{client.phone}</div>}
                          {client.email && (
                            <div className="text-sm text-muted-foreground">{client.email}</div>
                          )}
                          {!client.phone && !client.email && (
                            <div className="text-sm text-muted-foreground">Sin contacto</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={client.totalDebt > 0 ? "destructive" : "secondary"}>
                          ${Number(client.totalDebt || 0).toLocaleString("en-US")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(client.createdAt), "dd/MM/yyyy", { locale: es })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/clients/${client.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/debts/new?clientId=${client.id}`}>
                              <CreditCard className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/payments/new?clientId=${client.id}`}>
                              <Plus className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredClients.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <div className="text-muted-foreground">
                          {searchTerm ? "No se encontraron clientes" : "No hay clientes registrados"}
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
  );
}
