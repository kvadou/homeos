"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { Search, Plus, Package, ScanLine, Wrench, Sun, Moon } from "lucide-react";
import { SidebarToggle } from "./sidebar";
import { HomeSelector } from "./home-selector";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/components/theme-provider";
import { NotificationBell } from "@/components/notifications/notification-bell";

interface TopbarProps {
  onMenuClick: () => void;
}

const quickAdd = [
  { href: "/items/new", label: "New item", icon: Package },
  { href: "/dashboard/scan", label: "Scan", icon: ScanLine },
  { href: "/dashboard/maintenance", label: "New task", icon: Wrench },
];

export function Topbar({ onMenuClick }: TopbarProps) {
  const { resolvedTheme, setTheme } = useTheme();

  function toggleTheme() {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }

  return (
    <header className="safe-top sticky top-0 z-30 flex h-16 items-center gap-2.5 border-b border-border bg-background/80 px-4 backdrop-blur-xl sm:px-6">
      <SidebarToggle onClick={onMenuClick} />
      <HomeSelector />

      {/* Search. routes to Ask for now (no search backend yet) */}
      <div className="flex flex-1 justify-center">
        <Link
          href="/dashboard/chat"
          className="hidden h-11 w-full max-w-md items-center gap-2.5 rounded-2xl border border-border bg-card px-3.5 text-sm text-muted-foreground shadow-sm transition-colors hover:border-primary/40 hover:text-foreground sm:flex"
        >
          <Search className="size-4 shrink-0" strokeWidth={2} />
          <span className="truncate">Search or ask about your home</span>
        </Link>
      </div>

      {/* Quick add */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Quick add"
            className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
          >
            <Plus className="size-5" strokeWidth={2.5} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 rounded-2xl">
          <DropdownMenuLabel>Add to your home</DropdownMenuLabel>
          {quickAdd.map(({ href, label, icon: Icon }) => (
            <DropdownMenuItem key={href} asChild className="rounded-xl">
              <Link href={href}>
                <Icon className="text-muted-foreground" strokeWidth={2} />
                {label}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <NotificationBell />

      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className="hidden h-9 w-9 sm:inline-flex"
        aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
      >
        {resolvedTheme === "dark" ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )}
      </Button>

      <UserButton
        appearance={{
          elements: {
            avatarBox: "h-8 w-8",
          },
        }}
      />
    </header>
  );
}
