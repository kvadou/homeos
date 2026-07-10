"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House,
  HeartHandshake,
  BookOpen,
  Sparkles,
  ScanLine,
  Package,
  Shield,
  FileCheck,
  ShieldAlert,
  Clock,
  BarChart3,
  FileText,
  Users,
  CreditCard,
  Settings,
  X,
  Menu,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SidebarPlanIndicator } from "./sidebar-plan-indicator";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const primaryNav: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: House },
  { href: "/dashboard/maintenance", label: "Care", icon: HeartHandshake },
  { href: "/library", label: "Library", icon: BookOpen },
  { href: "/dashboard/chat", label: "Ask", icon: Sparkles },
];

const secondaryNav: NavItem[] = [
  { href: "/dashboard/scan", label: "Scan", icon: ScanLine },
  { href: "/items", label: "Items", icon: Package },
  { href: "/dashboard/warranties", label: "Warranties", icon: Shield },
  { href: "/dashboard/claims", label: "Claims", icon: FileCheck },
  { href: "/dashboard/safety", label: "Safety", icon: ShieldAlert },
  { href: "/dashboard/timeline", label: "Timeline", icon: Clock },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/passport", label: "Passport", icon: FileText },
  { href: "/dashboard/providers", label: "Providers", icon: Users },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
];

const settingsNav: NavItem = {
  href: "/dashboard/settings",
  label: "Settings",
  icon: Settings,
};

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  // Preserve the original active logic: exact match, or prefix match for
  // everything except the root dashboard route.
  const isActive = (href: string) =>
    pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  const NavRow = ({ href, label, icon: Icon }: NavItem) => {
    const active = isActive(href);
    return (
      <Link
        key={href}
        href={href}
        onClick={onClose}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors",
          active
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
        )}
      >
        <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
        {label}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "safe-left fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-sidebar transition-transform duration-300 lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Wordmark */}
        <div className="safe-top flex h-[4.5rem] items-center justify-between px-5">
          <Link
            href="/dashboard"
            onClick={onClose}
            className="flex items-center gap-2.5"
          >
            <div className="flex size-9 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <House className="size-[18px]" strokeWidth={2.25} />
            </div>
            <span className="font-serif text-2xl leading-none tracking-tight">
              HomeOS
            </span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
          {primaryNav.map((item) => (
            <NavRow key={item.href} {...item} />
          ))}

          <p className="px-3 pb-1 pt-5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Manage
          </p>
          {secondaryNav.map((item) => (
            <NavRow key={item.href} {...item} />
          ))}
        </nav>

        {/* Bottom */}
        <div className="safe-bottom space-y-3 border-t border-border px-3 pb-4 pt-3">
          <NavRow {...settingsNav} />
          <SidebarPlanIndicator />
        </div>
      </aside>
    </>
  );
}

export function SidebarToggle({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="ghost" size="icon" className="lg:hidden" onClick={onClick}>
      <Menu className="h-5 w-5" />
    </Button>
  );
}
