// app/api/dashboard/chart-data/route.ts
import { NextResponse } from "next/server"
import { Database } from "@/lib/database"
import { format } from "date-fns"
import { es } from "date-fns/locale"

// Normaliza a YYYY-MM-DD en hora local para evitar desfases con UTC
function toLocalDateKey(d: Date) {
  const tz = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - tz).toISOString().slice(0, 10)
}

export async function GET() {
  try {
    const last7Days: Array<{ date: string; payments: number; amount: number }> = []

    for (let i = 6; i >= 0; i--) {
      const day = new Date()
      day.setDate(day.getDate() - i)

      const dayKey = toLocalDateKey(day)

      // Si tu DB expone getPaymentsByDate, úsalo; si no, fall-back a filtrar todos
      let dayPayments = await Promise.resolve(
        (Database as any).getPaymentsByDate
          ? (Database as any).getPaymentsByDate(dayKey)
          : Promise.resolve(Database.getPayments()).then((all: any[]) =>
              all.filter((p) => toLocalDateKey(new Date(p.createdAt)) === dayKey),
            )
      )

      // Seguridad por si el método retorna algo raro
      if (!Array.isArray(dayPayments)) dayPayments = []

      const totalAmount = dayPayments.reduce(
        (sum: number, p: any) => sum + Number(p?.amount ?? 0),
        0
      )

      last7Days.push({
        date: format(day, "dd/MM", { locale: es }),
        payments: dayPayments.length,
        amount: totalAmount,
      })
    }

    return NextResponse.json(last7Days)
  } catch (error) {
    console.error("GET /api/dashboard/chart-data error:", error)
    return NextResponse.json({ error: "CHART_DATA_ERROR" }, { status: 500 })
  }
}
