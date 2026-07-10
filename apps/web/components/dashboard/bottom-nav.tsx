"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ScanLine,
  Package,
  MessageSquare,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/scan", label: "Scan", icon: ScanLine, exact: false },
  { href: "/items", label: "Items", icon: Package, exact: false },
  { href: "/dashboard/chat", label: "Chat", icon: MessageSquare, exact: false },
] as const;

interface BottomNavProps {
  onMenuClick: () => void;
}

export function BottomNav({ onMenuClick }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-35 flex h-14 items-center border-t border-border bg-background/95 backdrop-blur-xl safe-bottom lg:hidden">
      {tabs.map((tab) => {
        const isActive = tab.exact
          ? pathname === tab.href
          : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] transition-colors",
              isActive
                ? "font-semibold text-primary"
                : "text-muted-foreground"
            )}
          >
            <tab.icon className="h-5 w-5" />
            {tab.label}
          </Link>
        );
      })}
      <button
        onClick={onMenuClick}
        className="flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] text-muted-foreground transition-colors"
      >
        <Menu className="h-5 w-5" />
        More
      </button>
    </nav>
  );
}
