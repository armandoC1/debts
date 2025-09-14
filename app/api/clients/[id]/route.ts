import { NextResponse } from "next/server"
import { Database } from "@/lib/database"

type Params = { params: { id: string } }

export async function GET(_req: Request, { params }: Params) {
  try {
    const client = await Database.getClientById(params.id)
    if (!client) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 })
    }
    return NextResponse.json({ ok: true, data: client })
  } catch (e) {
    console.error("GET /api/clients/[id] error:", e)
    return NextResponse.json({ ok: false, error: "DB_ERROR" }, { status: 500 })
  }
}
