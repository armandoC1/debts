import type { User } from "./types"
import { Database } from "./database"

export interface AuthSession {
  user: User
  isAuthenticated: boolean
}

export class AuthService {
  static async authenticate(email: string, password: string): Promise<User | null> {
    const user = await Database.getUserByEmail(email)
    if (user && user.password === password) {
      return user
    }
    return null
  }

  static hasRole(user: User, role: "admin" | "superadmin"): boolean {
    return user.roles.includes(role)
  }

  static canManageUsers(user: User): boolean {
    return this.hasRole(user, "superadmin")
  }

  static canManageClients(user: User): boolean {
    return this.hasRole(user, "admin") || this.hasRole(user, "superadmin")
  }
}
