"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/toaster";
import { Loader2, Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

type Theme = "light" | "dark" | "system";

interface Preferences {
  defaultHomeId: string;
  emailNotifications: boolean;
  maintenanceReminders: boolean;
  weeklyDigest: boolean;
}

const DEFAULT_PREFS: Preferences = {
  defaultHomeId: "",
  emailNotifications: true,
  maintenanceReminders: true,
  weeklyDigest: false,
};

interface HomeOption {
  id: string;
  name: string;
}

export function PreferencesSettings() {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFS);
  const [homes, setHomes] = useState<HomeOption[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPrefs = useCallback(() => {
    try {
      const stored = localStorage.getItem("homeos-preferences");
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<Preferences>;
        setPrefs({ ...DEFAULT_PREFS, ...parsed });
      }
    } catch {
      // use defaults
    }
  }, []);

  useEffect(() => {
    loadPrefs();
    fetch("/api/homes")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setHomes(data.data.map((h: { id: string; name: string }) => ({ id: h.id, name: h.name })));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [loadPrefs]);

  function savePrefs(updated: Preferences) {
    setPrefs(updated);
    localStorage.setItem("homeos-preferences", JSON.stringify(updated));
    toast({ title: "Preferences saved" });
  }

  function handleThemeChange(newTheme: Theme) {
    setTheme(newTheme);
    toast({ title: "Theme updated" });
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
          <CardTitle className="text-lg">Appearance</CardTitle>
          <CardDescription>Customize how HomeOS looks on your device.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label>Theme</Label>
            <div className="grid grid-cols-3 gap-3">
              {(["light", "dark", "system"] as Theme[]).map((t) => {
                const icons = { light: Sun, dark: Moon, system: Monitor };
                const Icon = icons[t];
                const isActive = theme === t;
                return (
                  <button
                    key={t}
                    onClick={() => handleThemeChange(t)}
                    className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors ${
                      isActive
                        ? "border-teal-500 bg-teal-500/5"
                        : "border-[hsl(var(--border))] hover:border-[hsl(var(--muted-foreground))]"
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${isActive ? "text-teal-500" : "text-[hsl(var(--muted-foreground))]"}`} />
                    <span className={`text-sm capitalize ${isActive ? "font-medium text-teal-500" : "text-[hsl(var(--muted-foreground))]"}`}>
                      {t}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Default Home</CardTitle>
          <CardDescription>Choose which home loads by default when you open the dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={prefs.defaultHomeId || "none"}
            onValueChange={(value) =>
              savePrefs({ ...prefs, defaultHomeId: value === "none" ? "" : value })
            }
          >
            <SelectTrigger className="w-full sm:w-[300px]">
              <SelectValue placeholder="Select a default home" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No default</SelectItem>
              {homes.map((home) => (
                <SelectItem key={home.id} value={home.id}>
                  {home.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Notifications</CardTitle>
          <CardDescription>Configure how you receive updates from HomeOS.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email-notifications" className="text-sm font-medium">
                Email notifications
              </Label>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Receive email updates about your homes.
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={prefs.emailNotifications}
              onCheckedChange={(checked) =>
                savePrefs({ ...prefs, emailNotifications: checked })
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="maintenance-reminders" className="text-sm font-medium">
                Maintenance reminders
              </Label>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Get reminded about upcoming maintenance tasks.
              </p>
            </div>
            <Switch
              id="maintenance-reminders"
              checked={prefs.maintenanceReminders}
              onCheckedChange={(checked) =>
                savePrefs({ ...prefs, maintenanceReminders: checked })
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="weekly-digest" className="text-sm font-medium">
                Weekly digest
              </Label>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Receive a weekly summary of activity across your homes.
              </p>
            </div>
            <Switch
              id="weekly-digest"
              checked={prefs.weeklyDigest}
              onCheckedChange={(checked) =>
                savePrefs({ ...prefs, weeklyDigest: checked })
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
