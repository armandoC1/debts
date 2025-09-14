import { NextResponse } from "next/server"
import { Database } from "@/lib/database"

export const runtime = "nodejs"

export async function GET() {
  try {
    const clients = await Database.getClients()
    return NextResponse.json({ ok: true, data: clients }, {
      headers: { "Cache-Control": "no-store" },
    })
  } catch (err) {
    console.error("GET /api/clients", err)
    return NextResponse.json({ ok: false, error: "DB_ERROR" }, { status: 500 })
  }
}

type CreateClientBody = {
  name: string
  email?: string
  phone?: string
  address?: string
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<CreateClientBody> | null
    const name = body?.name?.trim()

    if (!name) {
      return NextResponse.json({ ok: false, error: "NAME_REQUIRED" }, { status: 400 })
    }

    const payload = {
      name,
      email: body?.email?.trim() || undefined,
      phone: body?.phone?.trim() || undefined,
      address: body?.address?.trim() || undefined,
    }

    const newClient = await Database.createClient(payload)
    return NextResponse.json({ ok: true, data: newClient }, { status: 201 })
  } catch (err) {
    console.error("POST /api/clients", err)
    return NextResponse.json({ ok: false, error: "DB_ERROR" }, { status: 500 })
  }
}
