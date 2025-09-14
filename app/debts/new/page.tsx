"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"

import { useAuth } from "@/contexts/auth-context"
import type { Client } from "@/lib/types"
import { ArrowLeft, CreditCard } from "lucide-react"

export default function NewDebtPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()

  // Si la URL trae ?clientId=xxx lo guardamos; si no, string vacío
  const preselectedClientId = searchParams.get("clientId") ?? ""

  const [clients, setClients] = useState<Client[]>([])
  const [formData, setFormData] = useState({
    clientId: preselectedClientId, // si viene, lo usamos; si no, ""
    title: "",
    amount: "",
  })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Cargar clientes desde la API
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/clients", { cache: "no-store" })
        const json = await res.json().catch(() => null)
        setClients(Array.isArray(json?.data) ? json.data : [])
      } catch {
        setClients([])
      }
    }
    load()
  }, [])

  // Buscar el cliente preseleccionado (si hay)
  const selectedClient = useMemo(
    () => clients.find((c) => c.id === formData.clientId),
    [clients, formData.clientId]
  )

  const havePreselected = Boolean(preselectedClientId) // ¿URL trae clientId?
  const shouldShowSelect = !havePreselected // si NO viene en la URL, mostramos el Select

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    // Validaciones
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

    if (!user?.id) {
      setError("Usuario no autenticado")
      setIsLoading(false)
      return
    }

    try {
      const payload = {
        clientId: formData.clientId,
        title: formData.title.trim() || "Deuda",
        amount: amountNum,
        createdBy: user.id,
      }

      const res = await fetch("/api/debts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.ok) {
        setError(json?.error || "Error al crear la deuda")
        setIsLoading(false)
        return
      }

      router.push(`/clients/${formData.clientId}`)
    } catch (err) {
      setError("Error al crear la deuda")
      setIsLoading(false)
    }
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <DashboardLayout breadcrumbs={[{ label: "Agregar Deuda" }]}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/clients">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Agregar Deuda</h1>
              <p className="text-muted-foreground">Registra una nueva deuda para un cliente</p>
            </div>
          </div>

          {/* Form */}
          <div className="max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Nueva Deuda
                </CardTitle>
                <CardDescription>
                  Completa la información de la deuda. El título es opcional, si no se especifica se usará "Deuda".
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Cliente */}
                  {shouldShowSelect ? (
                    <div className="space-y-2">
                      <Label htmlFor="client">Cliente *</Label>
                      <Select
                        value={formData.clientId}
                        onValueChange={(value) => setFormData((prev) => ({ ...prev, clientId: value }))}
                        disabled={isLoading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un cliente" />
                        </SelectTrigger>
                        <SelectContent>
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name} — Deuda actual: ${Number(client.totalDebt || 0).toLocaleString("en-US")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    // Modo bloqueado cuando viene clientId en la URL
                    <div className="p-3 rounded-md border">
                      {selectedClient ? (
                        <div className="text-sm">
                          <div className="font-medium">Cliente seleccionado:</div>
                          <div className="mt-1">
                            <strong>{selectedClient.name}</strong>
                          </div>
                          <div className="text-muted-foreground">
                            Deuda actual:{" "}
                            <strong>${Number(selectedClient.totalDebt || 0).toLocaleString("en-US")}</strong>
                          </div>
                          {selectedClient.phone && (
                            <div className="text-muted-foreground">Teléfono: {selectedClient.phone}</div>
                          )}
                        </div>
                      ) : (
                        // Si vino clientId pero aún no cargó o no existe
                        <Alert variant="destructive">
                          <AlertDescription>No se encontró el cliente.</AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}

                  {/* Título */}
                  <div className="space-y-2">
                    <Label htmlFor="title">Título de la Deuda</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="Ej: Compra de productos, Servicio prestado (opcional)"
                      disabled={isLoading}
                    />
                    <p className="text-xs text-muted-foreground">
                      Si no especificas un título, se usará "Deuda" por defecto
                    </p>
                  </div>

                  {/* Monto */}
                  <div className="space-y-2">
                    <Label htmlFor="amount">Monto *</Label>
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

                  {/* Info automática */}
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium">Información automática:</h4>
                    <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                      <li>• La fecha y hora se registrarán automáticamente</li>
                      <li>
                        • El usuario que crea la deuda: <strong>{user?.name || "—"}</strong>
                      </li>
                      <li>• La deuda se sumará al total del cliente</li>
                    </ul>
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" asChild disabled={isLoading}>
                      <Link href="/clients">Cancelar</Link>
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? "Creando..." : "Crear Deuda"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
