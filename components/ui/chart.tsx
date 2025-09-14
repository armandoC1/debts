'use client'

import * as React from 'react'
import * as Recharts from 'recharts'
import { cn } from '@/lib/utils'

// Temas para variables CSS que pintan las series
const THEMES = { light: '', dark: '.dark' } as const

export type ChartConfig = {
  [k: string]:
    | {
        label?: React.ReactNode
        icon?: React.ComponentType
        color?: string
        theme?: never
      }
    | {
        label?: React.ReactNode
        icon?: React.ComponentType
        color?: never
        theme: Record<keyof typeof THEMES, string>
      }
}

type ChartContextProps = { config: ChartConfig }
const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const ctx = React.useContext(ChartContext)
  if (!ctx) throw new Error('useChart must be used within a <ChartContainer />')
  return ctx
}

/* ================== ChartContainer ================== */

function ChartContainer({
  id,
  className,
  children,
  config,
  ...props
}: React.ComponentProps<'div'> & {
  config: ChartConfig
  children: React.ComponentProps<typeof Recharts.ResponsiveContainer>['children']
}) {
  const uniqueId = React.useId()
  const chartId = `chart-${(id || uniqueId).replace(/:/g, '')}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart"
        data-chart={chartId}
        className={cn(
          "[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted flex aspect-video justify-center text-xs [&_.recharts-layer]:outline-hidden [&_.recharts-surface]:outline-hidden",
          className,
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <Recharts.ResponsiveContainer>{children}</Recharts.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
}

/* ================== ChartStyle ================== */

function ChartStyle({ id, config }: { id: string; config: ChartConfig }) {
  const colorConfig = Object.entries(config).filter(([, c]) => c.theme || c.color)
  if (!colorConfig.length) return null

  const css = Object.entries(THEMES)
    .map(([theme, prefix]) => {
      const rows = colorConfig
        .map(([key, item]) => {
          const color = (item as any).theme?.[theme] ?? (item as any).color
          return color ? `  --color-${key}: ${color};` : null
        })
        .filter(Boolean)
        .join('\n')
      return `${prefix} [data-chart=${id}] {\n${rows}\n}`
    })
    .join('\n')

  return <style dangerouslySetInnerHTML={{ __html: css }} />
}

/* ================== Tooltip ================== */

const ChartTooltip = Recharts.Tooltip

type TooltipItem = {
  name?: string
  value?: number
  color?: string
  payload?: any
  dataKey?: string
}

function ChartTooltipContent({
  active,
  payload,
  className,
  indicator = 'dot',
  hideLabel = false,
  hideIndicator = false,
  label,
  labelFormatter,
  labelClassName,
  formatter,
  color,
  nameKey,
  labelKey,
}: {
  active?: boolean
  payload?: TooltipItem[]
  className?: string
  indicator?: 'line' | 'dot' | 'dashed'
  hideLabel?: boolean
  hideIndicator?: boolean
  label?: any
  labelFormatter?: (value: any, items?: TooltipItem[]) => React.ReactNode
  labelClassName?: string
  formatter?: (
    value: any,
    name: string | undefined,
    item: TooltipItem,
    index: number,
    raw?: any,
  ) => React.ReactNode
  color?: string
  nameKey?: string
  labelKey?: string
}) {
  const { config } = useChart()

  const tooltipLabel = React.useMemo(() => {
    if (hideLabel || !payload || payload.length === 0) return null
    const first = payload[0]
    const key = `${labelKey || first?.dataKey || first?.name || 'value'}`
    const itemCfg = getPayloadConfig(config, first, key)

    const final =
      !labelKey && typeof label === 'string'
        ? (config[label as keyof typeof config]?.label ?? label)
        : itemCfg?.label

    if (labelFormatter) {
      return <div className={cn('font-medium', labelClassName)}>{labelFormatter(final, payload)}</div>
    }
    return final ? <div className={cn('font-medium', labelClassName)}>{final}</div> : null
  }, [hideLabel, payload, labelKey, label, labelFormatter, labelClassName, config])

  if (!active || !payload || payload.length === 0) return null

  const nestLabel = payload.length === 1 && indicator !== 'dot'

  return (
    <div
      className={cn(
        'border-border/50 bg-background grid min-w-[8rem] items-start gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs shadow-xl',
        className,
      )}
    >
      {!nestLabel ? tooltipLabel : null}
      <div className="grid gap-1.5">
        {payload.map((item, index) => {
          const key = `${nameKey || item.name || item.dataKey || 'value'}`
          const itemCfg = getPayloadConfig(config, item, key)
          const indicatorColor = color || item.payload?.fill || item.color

          return (
            <div
              key={`${item.dataKey ?? item.name ?? index}`}
              className={cn(
                '[&>svg]:text-muted-foreground flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5',
                indicator === 'dot' && 'items-center',
              )}
            >
              {formatter && item.value !== undefined ? (
                formatter(item.value, item.name, item, index, item.payload)
              ) : (
                <>
                  {!hideIndicator && (
                    <div
                      className={cn('shrink-0 rounded-[2px] border-(--color-border) bg-(--color-bg)', {
                        'h-2.5 w-2.5': indicator === 'dot',
                        'w-1': indicator === 'line',
                        'w-0 border-[1.5px] border-dashed bg-transparent': indicator === 'dashed',
                        'my-0.5': nestLabel && indicator === 'dashed',
                      })}
                      style={
                        {
                          '--color-bg': indicatorColor,
                          '--color-border': indicatorColor,
                        } as React.CSSProperties
                      }
                    />
                  )}
                  <div
                    className={cn(
                      'flex flex-1 justify-between leading-none',
                      nestLabel ? 'items-end' : 'items-center',
                    )}
                  >
                    <div className="grid gap-1.5">
                      {nestLabel ? tooltipLabel : null}
                      <span className="text-muted-foreground">{itemCfg?.label || item.name}</span>
                    </div>
                    {item.value !== undefined && (
                      <span className="text-foreground font-mono font-medium tabular-nums">
                        {Number(item.value).toLocaleString()}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ================== Legend ================== */

const ChartLegend = Recharts.Legend

function ChartLegendContent({
  className,
  hideIcon = false,
  payload,
  verticalAlign = 'bottom',
  nameKey,
}: {
  className?: string
  hideIcon?: boolean
  payload?: Array<any>
  verticalAlign?: 'top' | 'bottom' | 'middle'
  nameKey?: string
}) {
  const { config } = useChart()
  if (!payload || payload.length === 0) return null

  return (
    <div
      className={cn(
        'flex items-center justify-center gap-4',
        verticalAlign === 'top' ? 'pb-3' : 'pt-3',
        className,
      )}
    >
      {payload.map((it, idx) => {
        const key = `${nameKey || it.dataKey || 'value'}`
        const itemCfg = getPayloadConfig(config, it, key)
        return (
          <div
            key={`${it.value ?? it.dataKey ?? idx}`}
            className="[&>svg]:text-muted-foreground flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3"
          >
            {!hideIcon ? (
              itemCfg?.icon ? (
                <itemCfg.icon />
              ) : (
                <div className="h-2 w-2 shrink-0 rounded-[2px]" style={{ backgroundColor: it.color }} />
              )
            ) : null}
            {itemCfg?.label ?? it.value}
          </div>
        )
      })}
    </div>
  )
}

/* ================== Helpers ================== */

function getPayloadConfig(config: ChartConfig, payload: any, key: string) {
  const raw = payload?.payload
  let cfgKey = key

  if (payload && typeof payload[key] === 'string') {
    cfgKey = payload[key]
  } else if (raw && typeof raw[key] === 'string') {
    cfgKey = raw[key]
  }

  return (config as any)[cfgKey] ?? (config as any)[key]
}

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
}
