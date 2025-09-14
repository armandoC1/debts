// app/api/dashboard/debt-distribution/route.ts
import { NextResponse } from "next/server"
import { Database } from "@/lib/database"

export async function GET() {
  try {
    // Aseguramos que siempre resolvemos la promesa (sin importar si es sync/async)
    let clients = await Promise.resolve(Database.getClients())
    if (!Array.isArray(clients)) clients = []

    const debtDistribution = clients
      .map((client: any) => ({
        name: client?.name ?? "Desconocido",
        value: Number(client?.totalDebt ?? 0),
      }))
      .filter((item) => item.value > 0)

    return NextResponse.json(debtDistribution)
  } catch (error) {
    console.error("GET /api/dashboard/debt-distribution error:", error)
    return NextResponse.json({ error: "DEBT_DISTRIBUTION_ERROR" }, { status: 500 })
  }
}
