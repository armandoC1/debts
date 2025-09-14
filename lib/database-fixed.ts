// mock-database.ts
import type { Client } from "./types"

// datos de ejemplo completos (incluye address y updatedAt)
const mockClients: Client[] = [
  {
    id: "cli-001",
    name: "Juan Pérez",
    email: "juan@example.com",
    phone: "+1234567890",
    address: "San Salvador",
    totalDebt: 1500,
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z",
  },
  {
    id: "cli-002",
    name: "María García",
    email: "maria@example.com",
    phone: "+0987654321",
    address: "Santa Ana",
    totalDebt: 750,
    createdAt: "2024-01-20T14:30:00Z",
    updatedAt: "2024-01-20T14:30:00Z",
  },
  {
    id: "cli-003",
    name: "Carlos López",
    email: "carlos@example.com",
    phone: "+1122334455",
    address: "San Miguel",
    totalDebt: 0,
    createdAt: "2024-02-01T09:15:00Z",
    updatedAt: "2024-02-01T09:15:00Z",
  },
]

// Renombrado para no chocar con el Database real
export const MockDatabase = {
  async getClients(): Promise<Client[]> {
    return new Promise((resolve) => setTimeout(() => resolve([...mockClients]), 50))
  },

  async getClient(id: string): Promise<Client | null> {
    return new Promise((resolve) =>
      setTimeout(() => resolve(mockClients.find((c) => c.id === id) ?? null), 50)
    )
  },

  async createClient(client: Omit<Client, "id" | "createdAt" | "updatedAt">): Promise<Client> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const now = new Date().toISOString()
        const newClient: Client = {
          ...client,
          id: `cli-${Date.now()}`,
          createdAt: now,
          updatedAt: now,
        }
        mockClients.push(newClient)
        resolve(newClient)
      }, 50)
    })
  },

  async updateClient(id: string, updates: Partial<Client>): Promise<Client | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const i = mockClients.findIndex((c) => c.id === id)
        if (i === -1) return resolve(null)
        mockClients[i] = { ...mockClients[i], ...updates, updatedAt: new Date().toISOString() }
        resolve(mockClients[i])
      }, 50)
    })
  },

  async deleteClient(id: string): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const i = mockClients.findIndex((c) => c.id === id)
        if (i === -1) return resolve(false)
        mockClients.splice(i, 1)
        resolve(true)
      }, 50)
    })
  },
}
