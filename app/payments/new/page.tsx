"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
import { useAuth } from "@/contexts/auth-context"
import type { Client, User } from "@/lib/types"
import { ArrowLeft, DollarSign, AlertCircle } from "lucide-react"
import Link from "next/link"

export default function NewPaymentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()

  // Si viene clientId por query, bloqueamos el Select de cliente
  const preselectedClientId = searchParams.get("clientId") ?? ""

  const [clients, setClients] = useState<Client[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [formData, setFormData] = useState({
    clientId: preselectedClientId,
    amount: "",
    receivedBy: user?.id || "", // se mostrará fijo al usuario actual
    notes: "",
  })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Modal para sobrepago
  const [overpayOpen, setOverpayOpen] = useState(false)
  const [overpayInfo, setOverpayInfo] = useState<{ amount: number; debt: number } | null>(null)

  // Si cambia el usuario (hidrata tarde), forzamos receivedBy a user.id
  useEffect(() => {
    if (user?.id) {
      setFormData((prev) => (prev.receivedBy === user.id ? prev : { ...prev, receivedBy: user.id }))
    }
  }, [user?.id])

  // Cargar clientes y usuarios desde la API
  useEffect(() => {
    const load = async () => {
      try {
        // CLIENTES
        const resC = await fetch("/api/clients", { cache: "no-store" })
        const jsonC = await resC.json()
        setClients(Array.isArray(jsonC?.data) ? jsonC.data : [])

        // USUARIOS (solo para panel resumen, aunque el “recibido por” está fijo)
        const resU = await fetch("/api/users", { cache: "no-store" })
        if (resU.ok) {
          const jsonU = await resU.json()
          const list = Array.isArray(jsonU?.data) ? jsonU.data : []
          setUsers(list)
        } else {
          setUsers([])
        }
      } catch (e) {
        console.error(e)
        setClients([])
        setUsers([])
      }
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Arrays seguros
  const safeClients = Array.isArray(clients) ? clients : []
  const safeUsers = Array.isArray(users) ? users : []

  const selectedClient = safeClients.find((client) => client.id === formData.clientId)
  const selectedUser = safeUsers.find((u) => u.id === formData.receivedBy) || (user as unknown as User | undefined)
  const paymentAmount = Number.parseFloat(formData.amount) || 0
  const currentDebt = Number(selectedClient?.totalDebt || 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    // Validaciones base
    if (!formData.clientId) {
      setError("Debe seleccionar un cliente")
      setIsLoading(false)
      return
    }

    const amountNum = Number.parseFloat(formData.amount)
    if (!formData.amount || isNaN(amountNum) || amountNum <= 0) {
      setError("El monto debe ser mayor a 0")
      setIsLoading(false)
      return
    }

    // 🔒 “Recibido por” fijo al usuario actual
    const receivedById = user?.id
    if (!receivedById) {
      setError("No se pudo determinar el usuario que recibe el pago.")
      setIsLoading(false)
      return
    }

    // ✅ NO permitir pagos mayores a la deuda
    if (amountNum > currentDebt) {
      setOverpayInfo({ amount: amountNum, debt: currentDebt })
      setOverpayOpen(true)
      setIsLoading(false)
      return
    }

    try {
      const payload = {
        clientId: formData.clientId,
        amount: amountNum,
        description: formData.notes?.trim() || null,
        receivedBy: receivedById, // siempre user.id
      }

      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.ok) {
        setError(json?.error || "Error al registrar el pago")
        setIsLoading(false)
        return
      }

      router.push(`/clients/${formData.clientId}`)
    } catch (err) {
      console.error(err)
      setError("Error al registrar el pago")
      setIsLoading(false)
    }
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <DashboardLayout breadcrumbs={[{ label: "Agregar Pago" }]}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/clients">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Agregar Pago</h1>
              <p className="text-muted-foreground">Registra un nuevo pago recibido de un cliente</p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Nuevo Pago
                  </CardTitle>
                  <CardDescription>
                    Registra el pago recibido. La fecha y hora se guardarán automáticamente.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="client">Cliente *</Label>
                      <Select
                        value={formData.clientId}
                        onValueChange={(value) => setFormData((prev) => ({ ...prev, clientId: value }))}
                        disabled={isLoading || !!preselectedClientId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un cliente" />
                        </SelectTrigger>
                        <SelectContent>
                          {safeClients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name} - Debe: ${Number(client.totalDebt || 0).toLocaleString("en-US")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="amount">Monto Recibido *</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={formData.amount}
                        onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
                        placeholder="0.00"
                        required
                        disabled={isLoading}
                      />
                    </div>

                    {/* Recibido por: F I J O  */}
                    <div className="space-y-2">
                      <Label>Recibido por *</Label>
                      <Input
                        value={user?.name ?? "—"}
                        disabled
                        readOnly
                        className="bg-muted/50"
                      />
                      {/* Campo oculto por si quisieras inspeccionarlo en el submit nativo (aquí usamos fetch) */}
                      {/* <input type="hidden" name="receivedBy" value={user?.id ?? ""} /> */}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Notas (opcional)</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                        placeholder="Información adicional sobre el pago..."
                        disabled={isLoading}
                        rows={3}
                      />
                    </div>

                    {error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button type="button" variant="outline" asChild disabled={isLoading}>
                        <Link href="/clients">Cancelar</Link>
                      </Button>
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? "Registrando..." : "Registrar Pago"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Summary Panel */}
            <div className="space-y-4">
              {selectedClient && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Resumen del Cliente</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Cliente</Label>
                      <p className="text-lg font-semibold">{selectedClient.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Deuda Actual</Label>
                      <p className="text-2xl font-bold text-destructive">
                        ${Number(selectedClient.totalDebt || 0).toLocaleString("en-US")}
                      </p>
                    </div>
                    {paymentAmount > 0 && (
                      <>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Pago a Registrar</Label>
                          <p className="text-2xl font-bold text-green-600">
                            ${paymentAmount.toLocaleString("en-US")}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Deuda Después del Pago</Label>
                          <p className="text-2xl font-bold">
                            ${Math.max(0, currentDebt - paymentAmount).toLocaleString("en-US")}
                          </p>
                        </div>
                        {paymentAmount > currentDebt && (
                          <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              El pago es mayor a la deuda actual. El cliente quedará con saldo a favor.
                            </AlertDescription>
                          </Alert>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              )}

              {selectedUser && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Usuario que Recibe</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Nombre</Label>
                      <p className="text-lg font-semibold">{selectedUser.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Roles</Label>
                      <p className="text-sm">{(selectedUser.roles || []).join(", ")}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Información Automática</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>• La fecha y hora se registrarán automáticamente</p>
                    <p>• El pago se descontará de la deuda del cliente</p>
                    <p>• Se guardará un registro completo de la transacción</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </DashboardLayout>

      {/* Modal de sobrepago */}
      <AlertDialog open={overpayOpen} onOpenChange={setOverpayOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>El pago supera la deuda</AlertDialogTitle>
            <AlertDialogDescription>
              El monto ingresado{" "}
              <strong>
                ${overpayInfo ? overpayInfo.amount.toLocaleString("en-US") : ""}
              </strong>{" "}
              es mayor que la deuda actual del cliente{" "}
              <strong>
                ${overpayInfo ? overpayInfo.debt.toLocaleString("en-US") : ""}
              </strong>
              . Ajusta el monto o registra un pago parcial.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Entendido</AlertDialogCancel>
            <AlertDialogAction onClick={() => setOverpayOpen(false)}>
              Revisar monto
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ProtectedRoute>
  )
}
