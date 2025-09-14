import { NextResponse } from "next/server"
import { Database } from "@/lib/database"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const clientId = url.searchParams.get("clientId") || undefined
    const limit = Number(url.searchParams.get("limit")) || 0

    const base = clientId
      ? (await (Database as any).getPaymentsByClientId?.(clientId)) 
      : await Database.getPayments()

    const list: any[] = Array.isArray(base) ? [...base] : []

    list.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    const data = limit > 0 ? list.slice(0, limit) : list

    return NextResponse.json(
      { ok: true, data },
      { headers: { "Cache-Control": "no-store" } }
    )
  } catch (e) {
    console.error("GET /api/payments error:", e)
    return NextResponse.json({ ok: false, error: "DB_ERROR" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as
      | {
          clientId?: string
          amount?: number | string
          notes?: string | null
          description?: string | null
          receivedBy?: string
        }
      | null

    if (!body) {
      return NextResponse.json({ ok: false, error: "INVALID_JSON" }, { status: 400 })
    }

    const clientId = body.clientId?.toString()
    const rawAmount = body.amount
    const receivedBy = body.receivedBy?.toString()

    const description =
      (body.notes ?? body.description)?.toString().trim() || undefined

    if (!clientId) {
      return NextResponse.json({ ok: false, error: "clientId_required" }, { status: 400 })
    }

    const amount =
      typeof rawAmount === "string"
        ? Number.parseFloat(rawAmount)
        : Number(rawAmount)

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ ok: false, error: "amount_invalid" }, { status: 400 })
    }

    if (!receivedBy) {
      return NextResponse.json(
        { ok: false, error: "receivedBy_required" },
        { status: 400 }
      )
    }

    const saved = await Database.createPayment({
      clientId,
      amount,
      receivedBy,
      description, 
    })

    return NextResponse.json(
      { ok: true, data: saved },
      { status: 201, headers: { "Cache-Control": "no-store" } }
    )
  } catch (e) {
    console.error("POST /api/payments error:", e)
    return NextResponse.json({ ok: false, error: "DB_ERROR" }, { status: 500 })
  }
}
