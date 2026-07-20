import {
  House,
  HeartHandshake,
  Hammer,
  BookOpen,
  Sparkles,
  Lightbulb,
  ShieldAlert,
  type LucideIcon,
} from 'lucide-react'

export type NavItem = { icon: LucideIcon; label: string; hint: string; href: string }

// Single source of truth for primary navigation — shared by the desktop
// sidebar and the mobile drawer so they never drift.
export const navItems: NavItem[] = [
  { icon: House, label: 'Home', hint: 'Your dashboard', href: '/' },
  { icon: HeartHandshake, label: 'Care', hint: 'Maintenance & health', href: '/care' },
  { icon: Hammer, label: 'Projects', hint: 'Plans & upgrades', href: '/projects' },
  { icon: BookOpen, label: 'Library', hint: 'The memory of your home', href: '/library' },
  { icon: Lightbulb, label: 'Intelligence', hint: 'Evidence-backed home insights', href: '/worth-knowing' },
  { icon: Sparkles, label: 'Ask', hint: 'Ask about your records', href: '/ask' },
  { icon: ShieldAlert, label: 'Emergency', hint: 'Critical home information', href: '/emergency' },
]

export function isNavActive(href: string, pathname: string): boolean {
  return href === '/' ? pathname === '/' : pathname.startsWith(href)
}
