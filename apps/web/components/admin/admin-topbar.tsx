"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { Sun, Moon, ArrowLeft, Menu, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { adminSections, getActiveSection } from "./admin-nav-config";
import { cn } from "@/lib/utils";

interface AdminTopbarProps {
  onMenuClick: () => void;
}

export function AdminTopbar({ onMenuClick }: AdminTopbarProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const pathname = usePathname();
  const activeSection = getActiveSection(pathname);

  function toggleTheme() {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }

  return (
    <header className="safe-top sticky top-0 z-30 flex-shrink-0">
      {/* Primary bar — navy */}
      <div className="flex h-14 items-center justify-between bg-[#0A2E4D] px-4 sm:px-6">
        {/* Left: logo + brand */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-white/70 hover:bg-white/10 hover:text-white lg:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Link href="/admin" className="flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="HomeOS"
              width={32}
              height={32}
              className="rounded-md"
            />
            <span className="hidden font-heading text-[15px] font-semibold text-white sm:inline">
              HomeOS
            </span>
            <span className="hidden rounded bg-white/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/80 sm:inline">
              Admin
            </span>
          </Link>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1.5">
          <Link
            href="/dashboard"
            className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-white/60 transition-colors hover:bg-white/10 hover:text-white/90"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Back to App</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-8 w-8 text-white/60 hover:bg-white/10 hover:text-white"
            aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
          >
            {resolvedTheme === "dark" ? (
              <Sun className="h-3.5 w-3.5" />
            ) : (
              <Moon className="h-3.5 w-3.5" />
            )}
          </Button>
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: "h-7 w-7",
              },
            }}
          />
        </div>
      </div>

      {/* Section tabs — slightly lighter bar */}
      <div className="flex border-b border-[hsl(var(--border))] bg-[#0f3a5e] dark:bg-[#0A2E4D]/80">
        <nav className="flex w-full items-center gap-0.5 overflow-x-auto px-4 sm:px-6 scrollbar-hide">
          {adminSections.map((section) => {
            const isActive = activeSection?.id === section.id;
            const Icon = section.icon;

            return (
              <Link
                key={section.id}
                href={section.href}
                className={cn(
                  "relative flex shrink-0 items-center gap-1.5 px-3 py-2.5 text-[13px] font-medium transition-colors",
                  isActive
                    ? "text-white"
                    : "text-white/50 hover:text-white/80"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {section.label}
                {section.children && (
                  <ChevronDown className="h-3 w-3 opacity-50" />
                )}
                {/* Active indicator */}
                {isActive && (
                  <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[#00B4A0]" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
