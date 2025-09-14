// app/api/dashboard/stats/route.ts
import { NextRequest, NextResponse } from "next/server"
import { Database } from "@/lib/database"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const dateStr = searchParams.get("date") ?? new Date().toISOString().slice(0, 10)

    // Normalizamos el rango del día en horario local del servidor
    // (si quieres forzar zona del usuario, pásala desde el cliente).
    const dayStart = new Date(`${dateStr}T00:00:00`)
    const dayEnd = new Date(`${dateStr}T23:59:59.999`)

    // Datos base
    const clients = await Database.getClients()
    const payments = await Database.getPayments()

    // Totales generales
    const totalClients = Array.isArray(clients) ? clients.length : 0
    const totalDebt = (clients || []).reduce(
      (sum: number, c: any) => sum + Number(c.totalDebt || 0),
      0
    )
    const totalPaid = (payments || []).reduce(
      (sum: number, p: any) => sum + Number(p.amount || 0),
      0
    )

    // Pagos del día (rango de tiempo)
    const paymentsTodayList = (payments || []).filter((p: any) => {
      const d = new Date(p.createdAt)
      return d >= dayStart && d <= dayEnd
    })
    const paymentsToday = paymentsTodayList.reduce(
      (sum: number, p: any) => sum + Number(p.amount || 0),
      0
    )

    // 10 pagos recientes enriquecidos (cliente/usuario/nota)
    const clientsById = new Map((clients || []).map((c: any) => [c.id, c]))
    const allUsers = await Database.getUsers().catch(() => [])
    const usersById = new Map((allUsers || []).map((u: any) => [u.id, u]))

    const recentPayments = [...(payments || [])]
      .sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 10)
      .map((p: any) => ({
        id: p.id,
        amount: Number(p.amount || 0),
        createdAt: p.createdAt,
        notes: p.description ?? p.notes ?? null,
        clientName: clientsById.get(p.clientId)?.name ?? "Cliente no encontrado",
        userName: usersById.get(p.receivedBy)?.name ?? "Usuario no encontrado",
      }))

    return NextResponse.json({
      totalClients,
      totalDebt,
      totalPaid,
      paymentsToday,
      recentPayments,
    })
  } catch (e) {
    console.error("GET /api/dashboard/stats error:", e)
    return NextResponse.json({ error: "DB_ERROR" }, { status: 500 })
  }
}
