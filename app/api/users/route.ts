import { NextResponse } from "next/server"
import { Database } from "@/lib/database"

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const email = url.searchParams.get("email")

    if (email) {
      const user = await Database.getUserByEmail(email)
      return NextResponse.json({ ok: true, data: user ? [user] : [] })
    }

    const users = await Database.getUsers()
    return NextResponse.json({ ok: true, data: users })
  } catch (e) {
    console.error("GET /api/users error:", e)
    return NextResponse.json({ ok: false, error: "DB_ERROR" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, phone, email, password, roles } = body || {}

    if (!name || !email || !password || !Array.isArray(roles) || roles.length === 0) {
      return NextResponse.json({ ok: false, error: "VALIDATION_ERROR" }, { status: 400 })
    }

    const exists = await Database.getUserByEmail(email)
    if (exists) {
      return NextResponse.json({ ok: false, error: "EMAIL_EXISTS" }, { status: 409 })
    }

    const created = await Database.createUser({ name, phone, email, password, roles })
    return NextResponse.json({ ok: true, data: created }, { status: 201 })
  } catch (e) {
    console.error("POST /api/users error:", e)
    return NextResponse.json({ ok: false, error: "DB_ERROR" }, { status: 500 })
  }
}
