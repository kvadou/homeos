"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ScanLine,
  Package,
  MessageSquare,
  Wrench,
  Shield,
  ShieldAlert,
  Clock,
  BarChart3,
  Users,
  Settings,
  FileText,
  CreditCard,
  FileCheck,
  X,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SidebarPlanIndicator } from "./sidebar-plan-indicator";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/scan", label: "Scan", icon: ScanLine },
  { href: "/items", label: "Items", icon: Package },
  { href: "/dashboard/chat", label: "Chat", icon: MessageSquare },
  { href: "/dashboard/maintenance", label: "Maintenance", icon: Wrench },
  { href: "/dashboard/warranties", label: "Warranties", icon: Shield },
  { href: "/dashboard/claims", label: "Claims", icon: FileCheck },
  { href: "/dashboard/safety", label: "Safety", icon: ShieldAlert },
  { href: "/dashboard/timeline", label: "Timeline", icon: Clock },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/passport", label: "Passport", icon: FileText },
  { href: "/dashboard/providers", label: "Providers", icon: Users },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

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
          "safe-left fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-background))] transition-transform duration-300 lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="safe-top flex h-[4.5rem] items-center justify-between border-b border-[hsl(var(--sidebar-border))] px-4">
          <Link href="/dashboard" className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="HomeOS"
              width={40}
              height={40}
              className="rounded-lg shadow-sm"
            />
            <div className="flex flex-col">
              <span className="font-heading text-lg font-bold leading-tight">
                HomeOS <span className="text-teal-500">AI</span>
              </span>
              <span className="text-[10px] font-medium tracking-wide text-[hsl(var(--muted-foreground))]">
                Home Management
              </span>
            </div>
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
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-primary))]"
                    : "text-[hsl(var(--sidebar-foreground))]/70 hover:bg-[hsl(var(--sidebar-accent))]/50 hover:text-[hsl(var(--sidebar-foreground))]"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[#00B4A0]" />
                )}
                <item.icon
                  className={cn(
                    "h-[18px] w-[18px] shrink-0",
                    isActive ? "text-[#00B4A0]" : ""
                  )}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="safe-bottom border-t border-[hsl(var(--sidebar-border))] p-4">
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
