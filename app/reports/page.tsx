"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

import { Download, Eye, FileText, Settings, Users, User } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"
import { useAuth } from "@/contexts/auth-context"

type Client = { id: string; name: string; totalDebt?: number }
type Debt = { id: string; clientId: string; amount: number; title?: string; createdAt: string }
type Payment = { id: string; clientId: string; amount: number; description?: string | null; createdAt: string }

type ReportMode = "general" | "client"

type ReportTemplate = {
  id: string
  name: string
  content: string
  variables: string[]
}

const DEFAULT_TEMPLATE = `
<div style="font-family: Arial, sans-serif; padding: 24px; max-width: 900px; margin: 0 auto;">
  <div style="text-align: center; margin-bottom: 24px; border-bottom: 2px solid #111; padding-bottom: 16px;">
    <h1 style="margin: 0 0 6px 0;">{{COMPANY_NAME}}</h1>
    <h2 style="margin: 0 0 8px 0; color:#444;">Reporte de Deudas y Pagos</h2>
    <small style="color:#777">Fecha: {{REPORT_DATE}} • Generado por: {{USER_NAME}}</small>
  </div>

  {{#IF_GENERAL}}
  <div style="display:grid; grid-template-columns: repeat(3,1fr); gap:14px; margin-bottom: 20px;">
    <div style="border: 1px solid #ddd; border-radius: 8px; padding: 12px; text-align:center;">
      <div style="font-size:12px;color:#666">Total Clientes</div>
      <div style="font-size:22px;font-weight:bold;color:#0d6efd">{{TOTAL_CLIENTS}}</div>
    </div>
    <div style="border: 1px solid #ddd; border-radius: 8px; padding: 12px; text-align:center;">
      <div style="font-size:12px;color:#666">Deuda Total</div>
      <div style="font-size:22px;font-weight:bold;color:#dc3545">$ {{TOTAL_DEBT}}</div>
    </div>
    <div style="border: 1px solid #ddd; border-radius: 8px; padding: 12px; text-align:center;">
      <div style="font-size:12px;color:#666">Total Pagado</div>
      <div style="font-size:22px;font-weight:bold;color:#198754">$ {{TOTAL_PAID}}</div>
    </div>
  </div>

  <h3 style="margin-top: 0; border-bottom:1px solid #ddd; padding-bottom:8px;">Resumen por Cliente</h3>
  <table style="width:100%; border-collapse: collapse;">
    <thead>
      <tr style="background:#f8f9fa">
        <th style="border:1px solid #ddd; padding:8px; text-align:left;">Cliente</th>
        <th style="border:1px solid #ddd; padding:8px; text-align:right;">Deuda</th>
        <th style="border:1px solid #ddd; padding:8px; text-align:right;">Pagado</th>
        <th style="border:1px solid #ddd; padding:8px; text-align:right;">Saldo</th>
      </tr>
    </thead>
    <tbody>
      {{CLIENT_ROWS}}
    </tbody>
  </table>
  {{/IF_GENERAL}}

  {{#IF_CLIENT}}
  <div style="display:grid; grid-template-columns: repeat(3,1fr); gap:14px; margin-bottom: 20px;">
    <div style="border: 1px solid #ddd; border-radius: 8px; padding: 12px; text-align:center;">
      <div style="font-size:12px;color:#666">Cliente</div>
      <div style="font-size:18px;font-weight:bold;">{{CLIENT_NAME}}</div>
    </div>
    <div style="border: 1px solid #ddd; border-radius: 8px; padding: 12px; text-align:center;">
      <div style="font-size:12px;color:#666">Deuda Total</div>
      <div style="font-size:22px;font-weight:bold;color:#dc3545">$ {{CLIENT_DEBT_TOTAL}}</div>
    </div>
    <div style="border: 1px solid #ddd; border-radius: 8px; padding: 12px; text-align:center;">
      <div style="font-size:12px;color:#666">Total Pagado</div>
      <div style="font-size:22px;font-weight:bold;color:#198754">$ {{CLIENT_PAID_TOTAL}}</div>
    </div>
  </div>

  <h3 style="margin-top: 0; border-bottom:1px solid #ddd; padding-bottom:8px;">Deudas</h3>
  <table style="width:100%; border-collapse: collapse; margin-bottom: 14px;">
    <thead>
      <tr style="background:#f8f9fa">
        <th style="border:1px solid #ddd; padding:8px; text-align:left;">Título</th>
        <th style="border:1px solid #ddd; padding:8px; text-align:right;">Monto</th>
        <th style="border:1px solid #ddd; padding:8px; text-align:left;">Fecha</th>
      </tr>
    </thead>
    <tbody>
      {{CLIENT_DEBTS_ROWS}}
    </tbody>
  </table>

  <h3 style="margin-top: 0; border-bottom:1px solid #ddd; padding-bottom:8px;">Pagos</h3>
  <table style="width:100%; border-collapse: collapse;">
    <thead>
      <tr style="background:#f8f9fa">
        <th style="border:1px solid #ddd; padding:8px; text-align:left;">Notas</th>
        <th style="border:1px solid #ddd; padding:8px; text-align:right;">Monto</th>
        <th style="border:1px solid #ddd; padding:8px; text-align:left;">Fecha</th>
      </tr>
    </thead>
    <tbody>
      {{CLIENT_PAYMENTS_ROWS}}
    </tbody>
  </table>
  {{/IF_CLIENT}}

  <div style="margin-top:16px; text-align:center; color:#777; font-size:12px;">
    Generado el {{GENERATION_DATE}}
  </div>
</div>
`

const SELECT_ITEM_CLS =
  "data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"

const fmt = (n: number) =>
  Number(n ?? 0).toLocaleString("en-US", { maximumFractionDigits: 2 })

const cssBlock = `
  <style>
    * { box-sizing: border-box; }
    body { margin:0; font-family: Arial, Helvetica, sans-serif; color:#111; background:#fff; }
    .wrap { padding:24px; max-width:900px; margin:0 auto; background:#fff; }
    .heading { text-align:center; margin-bottom:24px; padding-bottom:16px; border-bottom:2px solid #111; }
    .kpis { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; margin-bottom:20px; }
    .card { border:1px solid #e5e7eb; border-radius:8px; padding:12px; text-align:center; }
    .muted { color:#6b7280; font-size:12px; }
    .big { font-size:22px; font-weight:bold; }
    .red { color:#dc2626; } .green { color:#16a34a; }
    h2 { margin: 0 0 8px 0; }
    h3 { margin: 0 0 8px 0; padding-bottom:8px; border-bottom:1px solid #e5e7eb; }
    table { width:100%; border-collapse: collapse; }
    th, td { border:1px solid #e5e7eb; padding:8px; }
    th { background:#f8f9fa; text-align:left; }
    td.right, th.right { text-align:right; }
    .center { text-align:center; }
  </style>
`

function buildGeneralHTML(
  g: {
    totalClients: number
    totalDebt: number
    totalPaid: number
    byClient: { client: { name: string }; debt: number; paid: number; balance: number }[]
  },
  userName: string,
) {
  const rows =
    g.byClient
      .map(
        (r) => `
    <tr>
      <td>${r.client.name}</td>
      <td class="right">$ ${fmt(r.debt)}</td>
      <td class="right">$ ${fmt(r.paid)}</td>
      <td class="right" style="color:${r.balance > 0 ? "#dc2626" : "#16a34a"}">$ ${fmt(r.balance)}</td>
    </tr>`,
      )
      .join("") || `<tr><td colspan="4" class="center">Sin datos</td></tr>`

  return `
    ${cssBlock}
    <div class="wrap">
      <div class="heading">
        <h2>Reporte de Deudas y Pagos</h2>
        <div class="muted">Fecha: ${format(new Date(), "dd/MM/yyyy", { locale: es })} • Generado por: ${userName}</div>
      </div>

      <div class="kpis">
        <div class="card"><div class="muted">Total Clientes</div><div class="big">${g.totalClients}</div></div>
        <div class="card"><div class="muted">Deuda Total</div><div class="big red">$ ${fmt(g.totalDebt)}</div></div>
        <div class="card"><div class="muted">Total Pagado</div><div class="big green">$ ${fmt(g.totalPaid)}</div></div>
      </div>

      <h3>Resumen por Cliente</h3>
      <table>
        <thead>
          <tr>
            <th>Cliente</th>
            <th class="right">Deuda</th>
            <th class="right">Pagado</th>
            <th class="right">Saldo</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `
}

function buildClientHTML(
  ct: {
    client: { name: string }
    debt: number
    paid: number
    balance: number
    debtsSorted: { title?: string; amount: number; createdAt: string }[]
    clientPayments: { description?: string | null; amount: number; createdAt: string }[]
  },
  userName: string,
) {
  const debts =
    ct.debtsSorted
      .map(
        (d) => `
    <tr>
      <td>${d.title || "Deuda"}</td>
      <td class="right">$ ${fmt(d.amount)}</td>
      <td>${format(new Date(d.createdAt), "dd/MM/yyyy hh:mm a", { locale: es })}</td>
    </tr>`,
      )
      .join("") || `<tr><td colspan="3" class="center">Sin deudas</td></tr>`

  const pays =
    ct.clientPayments
      .map(
        (p) => `
    <tr>
      <td>${p.description || "-"}</td>
      <td class="right">$ ${fmt(p.amount)}</td>
      <td>${format(new Date(p.createdAt), "dd/MM/yyyy hh:mm a", { locale: es })}</td>
    </tr>`,
      )
      .join("") || `<tr><td colspan="3" class="center">Sin pagos</td></tr>`

  return `
    ${cssBlock}
    <div class="wrap">
      <div class="heading">
        <h2>Reporte de Cliente</h2>
        <div class="muted">Fecha: ${format(new Date(), "dd/MM/yyyy", { locale: es })} • Generado por: ${userName}</div>
      </div>

      <div class="kpis">
        <div class="card"><div class="muted">Cliente</div><div class="big">${ct.client.name}</div></div>
        <div class="card"><div class="muted">Deuda Total</div><div class="big red">$ ${fmt(ct.debt)}</div></div>
        <div class="card"><div class="muted">Total Pagado</div><div class="big green">$ ${fmt(ct.paid)}</div></div>
      </div>

      <div class="card" style="margin-bottom:20px;">
        <div class="muted">Saldo</div>
        <div class="big" style="color:${ct.balance > 0 ? "#dc2626" : "#16a34a"}">$ ${fmt(ct.balance)}</div>
      </div>

      <h3>Deudas</h3>
      <table style="margin-bottom:14px">
        <thead>
          <tr><th>Título</th><th class="right">Monto</th><th>Fecha</th></tr>
        </thead>
        <tbody>${debts}</tbody>
      </table>

      <h3>Pagos</h3>
      <table>
        <thead>
          <tr><th>Notas</th><th class="right">Monto</th><th>Fecha</th></tr>
        </thead>
        <tbody>${pays}</tbody>
      </table>
    </div>
  `
}

function createIsolatedIframe(html: string) {
  const iframe = document.createElement("iframe")
  iframe.style.position = "fixed"
  iframe.style.left = "-10000px"
  iframe.style.top = "0"
  iframe.style.width = "1200px"
  iframe.style.height = "2000px"
  iframe.setAttribute("aria-hidden", "true")
  document.body.appendChild(iframe)

  const doc = iframe.contentDocument!
  doc.open()
  doc.write(`<!doctype html><html><head><meta charset="utf-8"></head>
  <body style="margin:0; background:#fff;">${html}</body></html>`)
  doc.close()

  return { iframe, doc }
}
function destroyIsolatedIframe(iframe: HTMLIFrameElement) {
  try { document.body.removeChild(iframe) } catch {}
}

export default function ReportsPage() {
  const { user } = useAuth()

  const [mode, setMode] = useState<ReportMode>("general")
  const [clients, setClients] = useState<Client[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [clientDebts, setClientDebts] = useState<Debt[]>([])
  const [selectedClientId, setSelectedClientId] = useState<string>("")
  const [loading, setLoading] = useState(true)

  const [templates, setTemplates] = useState<ReportTemplate[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("")
  const [templateName, setTemplateName] = useState("")
  const [templateContent, setTemplateContent] = useState("")

  const previewRef = useRef<HTMLDivElement | null>(null)
  const [htmlPreviewOverride, setHtmlPreviewOverride] = useState<string>("")

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [cRes, pRes] = await Promise.all([
          fetch("/api/clients", { cache: "no-store" }),
          fetch("/api/payments", { cache: "no-store" }),
        ])
        const cJson = await cRes.json()
        const pJson = await pRes.json()
        setClients(Array.isArray(cJson?.data) ? cJson.data : [])
        setPayments(Array.isArray(pJson?.data) ? pJson.data : [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    const loadClientDebts = async () => {
      if (mode !== "client" || !selectedClientId) {
        setClientDebts([])
        return
      }
      try {
        const res = await fetch(`/api/debts?clientId=${encodeURIComponent(selectedClientId)}`, { cache: "no-store" })
        const j = await res.json()
        setClientDebts(Array.isArray(j?.data) ? j.data : [])
      } catch (e) {
        console.error(e)
        setClientDebts([])
      }
    }
    loadClientDebts()
  }, [mode, selectedClientId])

  useEffect(() => {
    try {
      const saved = localStorage.getItem("reportTemplates")
      if (saved) {
        setTemplates(JSON.parse(saved))
      } else {
        const def: ReportTemplate = {
          id: "default",
          name: "Plantilla por Defecto",
          content: DEFAULT_TEMPLATE,
          variables: [
            "COMPANY_NAME", "REPORT_DATE", "USER_NAME", "GENERATION_DATE",
            "TOTAL_CLIENTS", "TOTAL_DEBT", "TOTAL_PAID", "CLIENT_ROWS",
            "CLIENT_NAME", "CLIENT_DEBT_TOTAL", "CLIENT_PAID_TOTAL", "CLIENT_BALANCE",
            "CLIENT_DEBTS_ROWS", "CLIENT_PAYMENTS_ROWS", "#IF_GENERAL", "/IF_GENERAL", "#IF_CLIENT", "/IF_CLIENT",
          ],
        }
        setTemplates([def])
        localStorage.setItem("reportTemplates", JSON.stringify([def]))
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  const paymentsByClient = useMemo(() => {
    const map: Record<string, number> = {}
    for (const p of payments) {
      const key = p.clientId
      map[key] = (map[key] ?? 0) + Number(p.amount || 0)
    }
    return map
  }, [payments])

  const generalTotals = useMemo(() => {
    const totalClients = clients.length
    const totalDebt = clients.reduce((s, c) => s + Number(c.totalDebt || 0), 0)
    const totalPaid = payments.reduce((s, p) => s + Number(p.amount || 0), 0)
    const byClient = clients.map((c) => {
      const debt = Number(c.totalDebt || 0)
      const paid = Number(paymentsByClient[c.id] || 0)
      return { client: c, debt, paid, balance: debt - paid }
    })
    return { totalClients, totalDebt, totalPaid, byClient }
  }, [clients, payments, paymentsByClient])

  const clientTotals = useMemo(() => {
    if (mode !== "client" || !selectedClientId) return null
    const client = clients.find((c) => c.id === selectedClientId)
    if (!client) return null
    const paid = Number(paymentsByClient[client.id] || 0)
    const debt = Number(clientDebts.reduce((s, d) => s + Number(d.amount || 0), 0))
    const balance = debt - paid
    const debtsSorted = [...clientDebts].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    const clientPayments = payments
      .filter((p) => p.clientId === client.id)
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    return { client, debt, paid, balance, debtsSorted, clientPayments }
  }, [mode, selectedClientId, clients, clientDebts, payments, paymentsByClient])

  const extractVariables = (html: string) => {
    const matches = html.match(/\{\{([^}]+)\}\}/g)
    return matches ? matches.map((m) => m.replace(/[{}]/g, "")) : []
  }

  const saveTemplate = () => {
    if (!templateName.trim() || !templateContent.trim()) return
    const t: ReportTemplate = {
      id: `${Date.now()}`,
      name: templateName.trim(),
      content: templateContent,
      variables: extractVariables(templateContent),
    }
    const updated = [...templates, t]
    setTemplates(updated)
    localStorage.setItem("reportTemplates", JSON.stringify(updated))
    setTemplateName("")
    setTemplateContent("")
  }

  const renderTemplate = () => {
    if (!selectedTemplateId) {
      setHtmlPreviewOverride("")
      return
    }
    const tpl = templates.find((t) => t.id === selectedTemplateId)
    if (!tpl) {
      setHtmlPreviewOverride("")
      return
    }

    let html = tpl.content
      .replace(/\{\{COMPANY_NAME\}\}/g, "Mi Empresa")
      .replace(/\{\{REPORT_DATE\}\}/g, format(new Date(), "dd/MM/yyyy", { locale: es }))
      .replace(/\{\{USER_NAME\}\}/g, user?.name ?? "Usuario")
      .replace(/\{\{GENERATION_DATE\}\}/g, format(new Date(), "dd/MM/yyyy HH:mm", { locale: es }))

    if (mode === "general") {
      html = html.replace(/\{\{#IF_GENERAL\}\}/g, "").replace(/\{\{\/IF_GENERAL\}\}/g, "")
      html = html.replace(/\{\{#IF_CLIENT\}\}[\s\S]*?\{\{\/IF_CLIENT\}\}/g, "")

      html = html
        .replace(/\{\{TOTAL_CLIENTS\}\}/g, String(generalTotals.totalClients))
        .replace(/\{\{TOTAL_DEBT\}\}/g, fmt(generalTotals.totalDebt))
        .replace(/\{\{TOTAL_PAID\}\}/g, fmt(generalTotals.totalPaid))

      const rows = generalTotals.byClient
        .map(
          (r) => `
          <tr>
            <td style="border:1px solid #ddd; padding:8px;">${r.client.name}</td>
            <td style="border:1px solid #ddd; padding:8px; text-align:right;">$ ${fmt(r.debt)}</td>
            <td style="border:1px solid #ddd; padding:8px; text-align:right;">$ ${fmt(r.paid)}</td>
            <td style="border:1px solid #ddd; padding:8px; text-align:right; color:${
              r.balance > 0 ? "#dc3545" : "#198754"
            }">$ ${fmt(r.balance)}</td>
          </tr>`,
        )
        .join("")
      html = html.replace(/\{\{CLIENT_ROWS\}\}/g, rows || "<tr><td colspan='4'>Sin datos</td></tr>")
    } else {
      html = html.replace(/\{\{#IF_CLIENT\}\}/g, "").replace(/\{\{\/IF_CLIENT\}\}/g, "")
      html = html.replace(/\{\{#IF_GENERAL\}\}[\s\S]*?\{\{\/IF_GENERAL\}\}/g, "")

      const ct = clientTotals
      if (!ct) {
        setHtmlPreviewOverride("<div style='padding:16px'>Selecciona un cliente…</div>")
        return
      }

      html = html
        .replace(/\{\{CLIENT_NAME\}\}/g, ct.client.name)
        .replace(/\{\{CLIENT_DEBT_TOTAL\}\}/g, fmt(ct.debt))
        .replace(/\{\{CLIENT_PAID_TOTAL\}\}/g, fmt(ct.paid))
        .replace(/\{\{CLIENT_BALANCE\}\}/g, fmt(ct.balance))

      const dr = ct.debtsSorted
        .map(
          (d) => `
          <tr>
            <td style="border:1px solid #ddd; padding:8px;">${d.title || "Deuda"}</td>
            <td style="border:1px solid #ddd; padding:8px; text-align:right;">$ ${fmt(Number(d.amount))}</td>
            <td style="border:1px solid #ddd; padding:8px;">${format(new Date(d.createdAt), "dd/MM/yyyy hh:mm a", {
              locale: es,
            })}</td>
          </tr>`,
        )
        .join("")
      html = html.replace(/\{\{CLIENT_DEBTS_ROWS\}\}/g, dr || "<tr><td colspan='3'>Sin deudas</td></tr>")

      const pr = ct.clientPayments
        .map(
          (p) => `
          <tr>
            <td style="border:1px solid #ddd; padding:8px;">${p.description || "-"}</td>
            <td style="border:1px solid #ddd; padding:8px; text-align:right;">$ ${fmt(Number(p.amount))}</td>
            <td style="border:1px solid #ddd; padding:8px;">${format(new Date(p.createdAt), "dd/MM/yyyy hh:mm a", {
              locale: es,
            })}</td>
          </tr>`,
        )
        .join("")
      html = html.replace(/\{\{CLIENT_PAYMENTS_ROWS\}\}/g, pr || "<tr><td colspan='3'>Sin pagos</td></tr>")
    }

    setHtmlPreviewOverride(html)
  }

  useEffect(() => {
    renderTemplate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTemplateId, mode, clientTotals, generalTotals])

  // ---------- PDF ----------
  const handleDownloadPdf = async () => {
    const html =
      mode === "general"
        ? buildGeneralHTML(generalTotals, user?.name ?? "Usuario")
        : clientTotals
        ? buildClientHTML(clientTotals, user?.name ?? "Usuario")
        : ""

    if (!html) return

    const { iframe, doc } = createIsolatedIframe(html)
    try {
      // Esperar layout
      await new Promise((r) => requestAnimationFrame(() => r(null)))

      // 👇 AQUI el cambio: tomamos .wrap (no el <style>)
      let target =
        (doc.body.querySelector(".wrap") as HTMLElement) ||
        (doc.body.lastElementChild as HTMLElement) ||
        (doc.body.children[doc.body.children.length - 1] as HTMLElement)

      if (!target) target = doc.body as unknown as HTMLElement

      // Garantizar tamaños visibles en el iframe
      if (!target.style.maxWidth) target.style.maxWidth = "900px"
      if (!target.style.width) target.style.width = "900px"
      if (!target.style.background) target.style.background = "#fff"
      target.style.minHeight = target.scrollHeight ? `${target.scrollHeight}px` : "1px"

      // Render
      const canvas = await html2canvas(target, {
        scale: 2,
        backgroundColor: "#ffffff",
        windowWidth: Math.max(900, target.scrollWidth || target.clientWidth || 900),
        windowHeight: Math.max(1, target.scrollHeight || target.clientHeight || 1200),
      })

      const imgData = canvas.toDataURL("image/jpeg", 0.98)

      const pdf = new jsPDF("p", "mm", "a4")
      const pdfW = pdf.internal.pageSize.getWidth()
      const pdfH = pdf.internal.pageSize.getHeight()

      const imgWpx = Math.max(1, canvas.width)
      const imgHpx = Math.max(1, canvas.height)
      const renderH = Math.max(1, (imgHpx * pdfW) / imgWpx)

      let position = 0
      let heightLeft = renderH

      pdf.addImage(imgData, "JPEG", 0, position, pdfW, renderH)
      heightLeft -= pdfH

      while (heightLeft > 0) {
        position = -(renderH - heightLeft)
        pdf.addPage()
        pdf.addImage(imgData, "JPEG", 0, position, pdfW, renderH)
        heightLeft -= pdfH
      }

      const fname =
        mode === "general"
          ? `reporte-general-${format(new Date(), "yyyy-MM-dd")}.pdf`
          : `reporte-${clientTotals?.client.name ?? "cliente"}-${format(new Date(), "yyyy-MM-dd")}.pdf`
      pdf.save(fname)
    } finally {
      destroyIsolatedIframe(iframe)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute requiredRole="admin">
        <DashboardLayout breadcrumbs={[{ label: "Reportes" }]}>
          <div className="h-64 flex items-center justify-center text-muted-foreground">Cargando reportes…</div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <DashboardLayout breadcrumbs={[{ label: "Reportes" }]}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Reportes</h1>
              <p className="text-muted-foreground">Genera reportes generales o por cliente, crea plantillas y descarga PDF.</p>
            </div>
            <Button onClick={handleDownloadPdf} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Descargar PDF
            </Button>
          </div>

          <Tabs defaultValue="generate" className="space-y-6">
            <TabsList>
              <TabsTrigger value="generate">Generar Reporte</TabsTrigger>
              <TabsTrigger value="templates">Gestionar Plantillas</TabsTrigger>
            </TabsList>

            <TabsContent value="generate" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Configuración del Reporte
                  </CardTitle>
                  <CardDescription>Elige el modo y, si quieres, una plantilla para renderizar el reporte.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Modo</Label>
                      <Tabs value={mode} onValueChange={(v) => setMode(v as ReportMode)}>
                        <TabsList className="w-full">
                          <TabsTrigger value="general" className="flex-1 flex items-center gap-2">
                            <Users className="h-4 w-4" /> General
                          </TabsTrigger>
                          <TabsTrigger value="client" className="flex-1 flex items-center gap-2">
                            <User className="h-4 w-4" /> Por cliente
                          </TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>

                    <div className="space-y-2">
                      <Label>Plantilla (opcional)</Label>
                      <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Usar vista por defecto" />
                        </SelectTrigger>
                        <SelectContent>
                          {templates.map((t) => (
                            <SelectItem key={t.id} value={t.id} className={SELECT_ITEM_CLS}>
                              {t.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {mode === "client" && (
                      <div className="space-y-2">
                        <Label>Cliente</Label>
                        <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un cliente" />
                          </SelectTrigger>
                          <SelectContent>
                            {clients.map((c) => (
                              <SelectItem value={c.id} key={c.id} className={SELECT_ITEM_CLS}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={renderTemplate} disabled={!selectedTemplateId}>
                      <Eye className="h-4 w-4 mr-2" />
                      Vista Previa con Plantilla
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Vista Previa</CardTitle>
                  <CardDescription>Esto es lo que se descargará en el PDF.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    ref={previewRef}
                    className="bg-white text-black p-6 rounded-lg border mx-auto"
                    style={{ maxWidth: 920 }}
                  >
                    {selectedTemplateId && htmlPreviewOverride ? (
                      <div dangerouslySetInnerHTML={{ __html: htmlPreviewOverride }} />
                    ) : mode === "general" ? (
                      <>
                        <div className="border-b pb-4 mb-6 text-center">
                          <h2 className="text-2xl font-semibold">Reporte de Deudas y Pagos</h2>
                          <p className="text-sm text-zinc-600">
                            Fecha: {format(new Date(), "dd/MM/yyyy", { locale: es })} • Generado por:{" "}
                            {user?.name ?? "Usuario"}
                          </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-4 mb-6">
                          <div className="rounded-lg border p-4 text-center">
                            <p className="text-sm text-muted-foreground">Total Clientes</p>
                            <p className="text-2xl font-bold">{generalTotals.totalClients}</p>
                          </div>
                          <div className="rounded-lg border p-4 text-center">
                            <p className="text-sm text-muted-foreground">Deuda Total</p>
                            <p className="text-2xl font-bold text-red-600">${fmt(generalTotals.totalDebt)}</p>
                          </div>
                          <div className="rounded-lg border p-4 text-center">
                            <p className="text-sm text-muted-foreground">Total Pagado</p>
                            <p className="text-2xl font-bold text-green-600">${fmt(generalTotals.totalPaid)}</p>
                          </div>
                        </div>

                        <h3 className="font-semibold mb-2">Resumen por Cliente</h3>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Cliente</TableHead>
                              <TableHead className="text-right">Deuda</TableHead>
                              <TableHead className="text-right">Pagado</TableHead>
                              <TableHead className="text-right">Saldo</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {generalTotals.byClient.map((r) => (
                              <TableRow key={r.client.id}>
                                <TableCell className="font-medium">{r.client.name}</TableCell>
                                <TableCell className="text-right">${fmt(r.debt)}</TableCell>
                                <TableCell className="text-right">${fmt(r.paid)}</TableCell>
                                <TableCell className="text-right">
                                  <Badge variant={r.balance > 0 ? "destructive" : "secondary"}>
                                    ${fmt(r.balance)}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </>
                    ) : clientTotals && selectedClientId ? (
                      <>
                        <div className="border-b pb-4 mb-6 text-center">
                          <h2 className="text-2xl font-semibold">Reporte de Cliente</h2>
                          <p className="text-sm text-zinc-600">
                            Fecha: {format(new Date(), "dd/MM/yyyy", { locale: es })} • Generado por:{" "}
                            {user?.name ?? "Usuario"}
                          </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-4 mb-6">
                          <div className="rounded-lg border p-4 text-center">
                            <p className="text-sm text-muted-foreground">Cliente</p>
                            <p className="text-xl font-semibold">{clientTotals.client.name}</p>
                          </div>
                          <div className="rounded-lg border p-4 text-center">
                            <p className="text-sm text-muted-foreground">Deuda Total</p>
                            <p className="text-2xl font-bold text-red-600">${fmt(clientTotals.debt)}</p>
                          </div>
                          <div className="rounded-lg border p-4 text-center">
                            <p className="text-sm text-muted-foreground">Total Pagado</p>
                            <p className="text-2xl font-bold text-green-600">${fmt(clientTotals.paid)}</p>
                          </div>
                          <div className="md:col-span-3 rounded-lg border p-4 text-center">
                            <p className="text-sm text-muted-foreground">Saldo</p>
                            <p
                              className={`text-2xl font-bold ${
                                clientTotals.balance > 0 ? "text-red-600" : "text-green-600"
                              }`}
                            >
                              ${fmt(clientTotals.balance)}
                            </p>
                          </div>
                        </div>

                        <h3 className="font-semibold mb-2">Deudas</h3>
                        <Table className="mb-6">
                          <TableHeader>
                            <TableRow>
                              <TableHead>Título</TableHead>
                              <TableHead className="text-right">Monto</TableHead>
                              <TableHead>Fecha</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {clientTotals.debtsSorted.map((d) => (
                              <TableRow key={d.id}>
                                <TableCell>{d.title || "Deuda"}</TableCell>
                                <TableCell className="text-right">${fmt(Number(d.amount))}</TableCell>
                                <TableCell>
                                  {format(new Date(d.createdAt), "dd/MM/yyyy hh:mm a", { locale: es })}
                                </TableCell>
                              </TableRow>
                            ))}
                            {clientTotals.debtsSorted.length === 0 && (
                              <TableRow>
                                <TableCell colSpan={3} className="text-center text-muted-foreground">
                                  Sin deudas registradas
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>

                        <h3 className="font-semibold mb-2">Pagos</h3>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Notas</TableHead>
                              <TableHead className="text-right">Monto</TableHead>
                              <TableHead>Fecha</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {clientTotals.clientPayments.map((p) => (
                              <TableRow key={p.id}>
                                <TableCell>{p.description || "-"}</TableCell>
                                <TableCell className="text-right">${fmt(Number(p.amount))}</TableCell>
                                <TableCell>
                                  {format(new Date(p.createdAt), "dd/MM/yyyy hh:mm a", { locale: es })}
                                </TableCell>
                              </TableRow>
                            ))}
                            {clientTotals.clientPayments.length === 0 && (
                              <TableRow>
                                <TableCell colSpan={3} className="text-center text-muted-foreground">
                                  Sin pagos registrados
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </>
                    ) : (
                      <div className="text-center text-muted-foreground py-10">Selecciona un cliente…</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="templates" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Crear Nueva Plantilla
                    </CardTitle>
                    <CardDescription>Usa las variables para personalizar el HTML.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Nombre</Label>
                      <Input value={templateName} onChange={(e) => setTemplateName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Contenido HTML</Label>
                      <Textarea
                        value={templateContent}
                        onChange={(e) => setTemplateContent(e.target.value)}
                        className="min-h-64 font-mono text-sm"
                        placeholder="Pega aquí tu HTML. Variables: {{TOTAL_CLIENTS}}, {{CLIENT_ROWS}}, {{#IF_GENERAL}}...{{/IF_GENERAL}}"
                      />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium mb-1">Variables disponibles:</p>
                      <div className="grid grid-cols-2 gap-1 text-xs">
                        <code>{"{{COMPANY_NAME}}"}</code>
                        <code>{"{{REPORT_DATE}}"}</code>
                        <code>{"{{USER_NAME}}"}</code>
                        <code>{"{{GENERATION_DATE}}"}</code>
                        <code>{"{{TOTAL_CLIENTS}}"}</code>
                        <code>{"{{TOTAL_DEBT}}"}</code>
                        <code>{"{{TOTAL_PAID}}"}</code>
                        <code>{"{{CLIENT_ROWS}}"}</code>
                        <code>{"{{#IF_GENERAL}} ... {{/IF_GENERAL}}"}</code>
                        <code>{"{{CLIENT_NAME}}"}</code>
                        <code>{"{{CLIENT_DEBT_TOTAL}}"}</code>
                        <code>{"{{CLIENT_PAID_TOTAL}}"}</code>
                        <code>{"{{CLIENT_BALANCE}}"}</code>
                        <code>{"{{CLIENT_DEBTS_ROWS}}"}</code>
                        <code>{"{{CLIENT_PAYMENTS_ROWS}}"}</code>
                        <code>{"{{#IF_CLIENT}} ... {{/IF_CLIENT}}"}</code>
                      </div>
                    </div>
                    <Button onClick={saveTemplate} disabled={!templateName || !templateContent}>
                      Guardar Plantilla
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Plantillas Guardadas</CardTitle>
                    <CardDescription>Selecciona una para usarla en “Generar Reporte”.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {templates.map((t) => (
                        <div key={t.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{t.name}</p>
                            <p className="text-xs text-muted-foreground">{t.variables.length} variables</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant={selectedTemplateId === t.id ? "default" : "outline"}
                              onClick={() => setSelectedTemplateId(t.id)}
                            >
                              Usar
                            </Button>
                          </div>
                        </div>
                      ))}
                      {templates.length === 0 && (
                        <div className="text-center text-muted-foreground py-6">No hay plantillas</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
