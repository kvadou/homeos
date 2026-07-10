"use client";

import * as React from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { BottomNav } from "@/components/dashboard/bottom-nav";
import { ErrorBoundary } from "@/components/error-boundary";
import { SupportWidget } from "@/components/support-widget";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div className="flex h-[100dvh] overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="mx-auto w-full max-w-5xl px-4 pb-18 pt-6 sm:px-6 sm:pt-8 lg:px-8 lg:pb-10">
            <ErrorBoundary>{children}</ErrorBoundary>
          </div>
        </main>
      </div>
      <BottomNav onMenuClick={() => setSidebarOpen(true)} />
      <SupportWidget />
    </div>
  );
}
