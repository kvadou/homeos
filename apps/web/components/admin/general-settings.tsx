"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Mail, Server, Database, AlertTriangle } from "lucide-react";

export function GeneralSettings() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mail className="h-5 w-5 text-teal-500" />
            Support Contact
          </CardTitle>
          <CardDescription>Primary support email for the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm">support@homeos.app</span>
            <Badge variant="success">Active</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Maintenance Mode
          </CardTitle>
          <CardDescription>
            When enabled, users will see a maintenance page instead of the app
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Switch
              checked={maintenanceMode}
              onCheckedChange={setMaintenanceMode}
            />
            <Label className="text-sm">
              {maintenanceMode ? "Maintenance mode is ON" : "Maintenance mode is OFF"}
            </Label>
            {maintenanceMode && (
              <Badge variant="warning">Display Only</Badge>
            )}
          </div>
          <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">
            This toggle is a UI placeholder and does not affect the live application.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Server className="h-5 w-5 text-blue-500" />
            System Information
          </CardTitle>
          <CardDescription>Current platform runtime details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <InfoRow label="Node.js Version" value={typeof process !== "undefined" ? process.version || "N/A" : "N/A"} />
            <InfoRow label="Next.js Version" value="15.x" />
            <InfoRow label="Prisma Version" value="6.x" />
            <InfoRow label="Database" value="PostgreSQL 16" />
            <InfoRow label="Database Status" value="Connected" status="success" />
            <InfoRow label="Platform" value="Vercel" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({
  label,
  value,
  status,
}: {
  label: string;
  value: string;
  status?: "success" | "warning" | "error";
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-[hsl(var(--border))] px-4 py-3">
      <span className="text-sm text-[hsl(var(--muted-foreground))]">{label}</span>
      <div className="flex items-center gap-2">
        {status === "success" && (
          <Database className="h-4 w-4 text-emerald-500" />
        )}
        <span className="text-sm font-medium">{value}</span>
      </div>
    </div>
  );
}
