import { SYSTEM_COSTS, costRefFor, type CostRef } from '@/lib/cost-ref'
import type { Database } from '@/lib/supabase/database.types'

type Item = Database['public']['Tables']['items']['Row']
type Project = Database['public']['Tables']['projects']['Row']

const STOP = new Set(['gas', 'per', 'the', 'and', 'with', 'for'])

export function matchCost(itemName: string): CostRef | null {
  const name = ` ${itemName.toLowerCase()} `
  let best: { row: CostRef; score: number } | null = null
  for (const row of SYSTEM_COSTS) {
    const tokens = `${row.key} ${row.label}`.toLowerCase().replace(/[^a-z0-9]+/g, ' ').split(' ').filter((t) => t.length > 2 && !STOP.has(t))
    const score = tokens.filter((token) => name.includes(token)).length
    if (score && (!best || score > best.score)) best = { row, score }
  }
  return best?.row ?? null
}

export type ForecastEntry = { id: string; title: string; window: string; low: number; high: number; basis: string; href: string; kind: 'replacement' | 'project' }
export type Forecast = { entries: ForecastEntry[]; totals: Record<'one' | 'five' | 'ten', { low: number; high: number }>; monthlyReserve: number; missingCount: number }

export function buildForecast(home: { state?: string | null }, items: Item[], projects: Project[], now = new Date().getFullYear()): Forecast {
  const adjusted = costRefFor(home).systems
  const entries: ForecastEntry[] = []
  let missingCount = 0
  for (const item of items) {
    const installed = item.installed_on ? new Date(`${item.installed_on}T00:00:00Z`).getUTCFullYear() : null
    const ref = matchCost(item.name)
    const lifespan: [number, number] | null = item.lifespan_years ? [item.lifespan_years, item.lifespan_years] : ref?.lifespanYears ?? null
    if (!installed || !lifespan) { missingCount++; continue }
    const cost = ref ? adjusted.find((x) => x.key === ref.key) : null
    const lowYear = installed + lifespan[0]
    const highYear = installed + lifespan[1]
    entries.push({ id: item.id, title: `Replace ${item.name}`, window: lowYear === highYear ? String(lowYear) : `${lowYear}–${highYear}`, low: cost?.replaceLow ?? 0, high: cost?.replaceHigh ?? 0, basis: `${installed} installation · ${lifespan[0]}${lifespan[1] === lifespan[0] ? '' : `–${lifespan[1]}`} year ${item.lifespan_years ? 'recorded' : 'typical'} life`, href: `/library/item/${item.id}`, kind: 'replacement' })
  }
  for (const project of projects.filter((p) => p.kind === 'active' && (p.budget ?? 0) > (p.spent ?? 0))) {
    const remaining = Math.max(0, (project.budget ?? 0) - (project.spent ?? 0))
    const year = project.target_end ? new Date(`${project.target_end}T00:00:00Z`).getUTCFullYear() : now + 1
    entries.push({ id: project.id, title: project.name, window: String(year), low: remaining, high: remaining, basis: 'Remaining recorded project budget', href: '/projects', kind: 'project' })
  }
  entries.sort((a, b) => Number(a.window.slice(0, 4)) - Number(b.window.slice(0, 4)))
  const total = (years: number) => entries.filter((e) => Number(e.window.slice(0, 4)) <= now + years).reduce((sum, e) => ({ low: sum.low + e.low, high: sum.high + e.high }), { low: 0, high: 0 })
  const totals = { one: total(1), five: total(5), ten: total(10) }
  return { entries, totals, monthlyReserve: Math.round(totals.five.high / 60 / 10) * 10, missingCount }
}

