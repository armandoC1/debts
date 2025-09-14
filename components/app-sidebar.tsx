"use client"

import { Users, UserPlus, CreditCard, Plus, BarChart3, LogOut, Settings, FileText } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const menuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: BarChart3,
    roles: ["admin", "superadmin"],
  },
  {
    title: "Ver Clientes",
    url: "/clients",
    icon: Users,
    roles: ["admin", "superadmin"],
  },
  {
    title: "Agregar Cliente",
    url: "/clients/new",
    icon: UserPlus,
    roles: ["admin", "superadmin"],
  },
  {
    title: "Agregar Deuda",
    url: "/debts/new",
    icon: CreditCard,
    roles: ["admin", "superadmin"],
  },
  {
    title: "Agregar Pago",
    url: "/payments/new",
    icon: Plus,
    roles: ["admin", "superadmin"],
  },
  {
    title: "Reportes",
    url: "/reports",
    icon: FileText,
    roles: ["admin", "superadmin"],
  },
  {
    title: "Gestión de Usuarios",
    url: "/users",
    icon: Settings,
    roles: ["superadmin"],
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { user, logout, hasRole } = useAuth()

  const filteredMenuItems = menuItems.filter((item) =>
    item.roles.some((role) => hasRole(role as "admin" | "superadmin")),
  )

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <CreditCard className="h-4 w-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">Debt Tracker</span>
            <span className="truncate text-xs text-muted-foreground">Gestión de Deudas</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url} tooltip={item.title}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarSeparator />
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 px-2 py-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {user?.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user?.name}</span>
                <span className="truncate text-xs text-muted-foreground">{user?.roles.join(", ")}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={logout} className="h-8 w-8">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
