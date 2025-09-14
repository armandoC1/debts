"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import type { User } from "@/lib/types"

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
  hasRole: (role: "admin" | "superadmin") => boolean
  canManageUsers: () => boolean
  canManageClients: () => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedUser = localStorage.getItem("debt-tracker-user")
    const sessionExpiry = localStorage.getItem("debt-tracker-session-expiry")

    if (storedUser && sessionExpiry) {
      const expiryDate = new Date(sessionExpiry)
      const now = new Date()

      if (now < expiryDate) {
        setUser(JSON.parse(storedUser))
      } else {
        // Session expired, clear storage
        localStorage.removeItem("debt-tracker-user")
        localStorage.removeItem("debt-tracker-session-expiry")
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (data.success && data.user) {
        setUser(data.user)
        const expiryDate = new Date()
        expiryDate.setDate(expiryDate.getDate() + 30)

        localStorage.setItem("debt-tracker-user", JSON.stringify(data.user))
        localStorage.setItem("debt-tracker-session-expiry", expiryDate.toISOString())
        return true
      }
      return false
    } catch (error) {
      console.error("Login error:", error)
      return false
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("debt-tracker-user")
    localStorage.removeItem("debt-tracker-session-expiry")
  }

  const hasRole = (role: "admin" | "superadmin"): boolean => {
    return user ? user.roles.includes(role) : false
  }

  const canManageUsers = (): boolean => {
    return user ? user.roles.includes("superadmin") : false
  }

  const canManageClients = (): boolean => {
    return user ? user.roles.includes("admin") || user.roles.includes("superadmin") : false
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isLoading,
        hasRole,
        canManageUsers,
        canManageClients,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
