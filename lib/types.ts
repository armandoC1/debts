// lib/types.ts

export interface User {
  id: string
  name: string
  phone?: string | null
  email: string
  password: string
  roles: ("admin" | "superadmin")[]   // se guarda como JSON en DB
  createdAt: string                   // ISO en la app (DB es DATETIME)
  updatedAt: string
}

export interface Client {
  id: string
  name: string
  phone?: string | null
  email?: string | null
  address?: string | null
  totalDebt: number
  createdAt: string
  updatedAt: string
}

export interface Debt {
  id: string
  clientId: string
  title: string              // <- existe en tu tabla debts
  amount: number
  description?: string | null
  createdBy: string          // FK -> users.id
  createdAt: string
  isPaid: 0 | 1              // tinyint(1) en DB (0 = pendiente, 1 = pagado)

  // Campos derivados por JOIN (opcionales)
  clientName?: string
}

export interface Payment {
  id: string
  clientId: string
  amount: number
  description?: string | null
  receivedBy: string         // FK -> users.id
  createdAt: string

  // Derivados por JOIN
  clientName?: string
  receivedByName?: string
}

export interface DashboardStats {
  totalClients: number
  totalDebt: number
  totalPaid: number
  paymentsToday: number
  recentPayments: Payment[]
}
