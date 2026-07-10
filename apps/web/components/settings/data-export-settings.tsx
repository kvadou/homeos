"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toaster";
import { Download, Archive, Loader2 } from "lucide-react";

interface HomeData {
  id: string;
  name: string;
  _count?: { rooms: number; items: number };
}

export function DataExportSettings() {
  const { toast } = useToast();
  const [homes, setHomes] = useState<HomeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportingHomeId, setExportingHomeId] = useState<string | null>(null);
  const [exportingAll, setExportingAll] = useState(false);

  useEffect(() => {
    async function fetchHomes() {
      try {
        const res = await fetch("/api/homes");
        const json = await res.json();
        if (json.success) {
          setHomes(json.data);
        }
      } catch {
        toast({
          title: "Error",
          description: "Failed to load homes.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
    fetchHomes();
  }, [toast]);

  async function handleExportHome(homeId: string, homeName: string) {
    setExportingHomeId(homeId);
    try {
      const res = await fetch(`/api/homes/${homeId}/export/full`);
      if (!res.ok) {
        throw new Error("Export failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${homeName}-export.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: "Export complete",
        description: `${homeName} data has been downloaded.`,
      });
    } catch {
      toast({
        title: "Export failed",
        description: `Could not export data for ${homeName}.`,
        variant: "destructive",
      });
    } finally {
      setExportingHomeId(null);
    }
  }

  async function handleExportAll() {
    setExportingAll(true);
    try {
      const res = await fetch("/api/export/all");
      if (!res.ok) {
        throw new Error("Export failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "homeos-export-all.zip";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: "Export complete",
        description: "All home data has been downloaded.",
      });
    } catch {
      toast({
        title: "Export failed",
        description: "Could not export all data.",
        variant: "destructive",
      });
    } finally {
      setExportingAll(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Export Home Data</CardTitle>
          <CardDescription>
            Download your home data as a ZIP file containing JSON files for
            rooms, items, maintenance tasks, and manuals.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {homes.length === 0 ? (
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              No homes found. Add a home first to export data.
            </p>
          ) : (
            <div className="space-y-3">
              {homes.map((home) => (
                <div
                  key={home.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <p className="font-medium text-[hsl(var(--foreground))]">
                      {home.name}
                    </p>
                    {home._count && (
                      <p className="text-sm text-[hsl(var(--muted-foreground))]">
                        {home._count.rooms} room{home._count.rooms !== 1 ? "s" : ""},{" "}
                        {home._count.items} item{home._count.items !== 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => handleExportHome(home.id, home.name)}
                    disabled={exportingHomeId === home.id || exportingAll}
                  >
                    {exportingHomeId === home.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    Export
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {homes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Export All Data</CardTitle>
            <CardDescription>
              Download all your home data in a single ZIP file, organized by home.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="gap-2"
              onClick={handleExportAll}
              disabled={exportingAll || exportingHomeId !== null}
            >
              {exportingAll ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Archive className="h-4 w-4" />
              )}
              Export All Data
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
