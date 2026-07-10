"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@clerk/nextjs";
import { Menu, X, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const { isSignedIn, isLoaded } = useAuth();

  return (
    <nav className="safe-top fixed top-0 z-50 w-full border-b border-white/10 bg-navy-900/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo.png" alt="HomeOS" width={40} height={40} className="rounded-lg" />
          <span className="font-heading text-xl font-bold text-white">
            HomeOS <span className="text-teal-400">AI</span>
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-gray-300 transition-colors hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {isLoaded && isSignedIn ? (
            <Button
              size="sm"
              className="bg-teal-500 hover:bg-teal-600 text-white shadow-lg shadow-teal-500/25 hidden sm:inline-flex gap-2"
              asChild
            >
              <Link href="/dashboard">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-300 hover:text-white hover:bg-white/10 hidden sm:inline-flex"
                asChild
              >
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button
                size="sm"
                className="bg-teal-500 hover:bg-teal-600 text-white shadow-lg shadow-teal-500/25 hidden sm:inline-flex"
                asChild
              >
                <Link href="/sign-up">Start Free Trial</Link>
              </Button>
            </>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="touch-target flex items-center justify-center rounded-md text-gray-300 hover:text-white md:hidden"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile slide-down panel */}
      <div
        className={cn(
          "overflow-hidden border-t border-white/10 bg-navy-900/95 backdrop-blur-xl transition-all duration-300 md:hidden",
          mobileOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="space-y-1 px-4 py-4">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block rounded-lg px-3 py-3 text-sm font-medium text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
            >
              {link.label}
            </a>
          ))}
          <div className="border-t border-white/10 pt-3 mt-2 flex flex-col gap-2">
            {isLoaded && isSignedIn ? (
              <Button
                size="sm"
                className="w-full justify-center bg-teal-500 hover:bg-teal-600 text-white gap-2"
                asChild
              >
                <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-center text-gray-300 hover:text-white hover:bg-white/10"
                  asChild
                >
                  <Link href="/sign-in" onClick={() => setMobileOpen(false)}>Sign In</Link>
                </Button>
                <Button
                  size="sm"
                  className="w-full justify-center bg-teal-500 hover:bg-teal-600 text-white"
                  asChild
                >
                  <Link href="/sign-up" onClick={() => setMobileOpen(false)}>Start Free Trial</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
