"use client";

import Link from "next/link";
import Image from "next/image";
import { UserButton } from "@clerk/nextjs";
import { Sun, Moon } from "lucide-react";
import { SidebarToggle } from "./sidebar";
import { HomeSelector } from "./home-selector";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { NotificationBell } from "@/components/notifications/notification-bell";

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { resolvedTheme, setTheme, theme } = useTheme();

  function toggleTheme() {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }

  return (
    <header className="safe-top sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/80 px-4 backdrop-blur-xl sm:px-6">
      <div className="flex items-center gap-3">
        <SidebarToggle onClick={onMenuClick} />
        <Link href="/dashboard" className="lg:hidden">
          <Image
            src="/logo.png"
            alt="HomeOS"
            width={28}
            height={28}
            className="rounded-md shadow-sm"
          />
        </Link>
        <HomeSelector />
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="h-9 w-9"
          aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
        >
          {resolvedTheme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>
        <NotificationBell />
        <UserButton
          afterSignOutUrl="/"
          appearance={{
            elements: {
              avatarBox: "h-8 w-8",
            },
          }}
        />
      </div>
    </header>
  );
}
