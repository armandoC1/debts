import { NextResponse } from "next/server"
import { Database } from "@/lib/database"

export const runtime = "nodejs" 

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const clientId = url.searchParams.get("clientId") ?? ""

    const rows = clientId
      ? await Database.getDebtsByClientId(clientId)
      : await Database.getDebts?.() ?? [] 

    return NextResponse.json(
      { ok: true, data: rows },
      { headers: { "Cache-Control": "no-store" } }
    )
  } catch (e) {
    console.error("GET /api/debts error:", e)
    return NextResponse.json({ ok: false, error: "DB_ERROR" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const clientId: string | undefined = body?.clientId
    const createdBy: string | undefined = body?.createdBy
    const rawAmount = body?.amount
    const title = (body?.title ?? "Deuda").toString().trim()
    const description = body?.description?.toString().trim() || undefined

    if (!clientId || !createdBy) {
      return NextResponse.json(
        { ok: false, error: "MISSING_FIELDS", fields: ["clientId", "createdBy"] },
        { status: 400 }
      )
    }

    const amount = Number.parseFloat(rawAmount)
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { ok: false, error: "INVALID_AMOUNT" },
        { status: 400 }
      )
    }

    const debt = await Database.createDebt({
      clientId,
      title,
      amount,
      description, 
      createdBy,
    })

    return NextResponse.json({ ok: true, data: debt }, { status: 201 })
  } catch (e) {
    console.error("POST /api/debts error:", e)
    return NextResponse.json({ ok: false, error: "DB_ERROR" }, { status: 500 })
  }
}
