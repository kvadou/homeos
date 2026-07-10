"use client";

import * as React from "react";
import { Building2, BadgeCheck, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toaster";
import { GiftPassportForm } from "@/components/realtor/gift-passport-form";

interface RealtorAccount {
  id: string;
  company: string | null;
  licenseNumber: string | null;
  territory: string | null;
  createdAt: string;
}

export default function RealtorPage() {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(true);
  const [signing, setSigning] = React.useState(false);
  const [account, setAccount] = React.useState<RealtorAccount | null>(null);

  React.useEffect(() => {
    fetch("/api/realtor")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data) {
          setAccount(data.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSigning(true);

    const formData = new FormData(e.currentTarget);
    const body = {
      company: formData.get("company") || undefined,
      licenseNumber: formData.get("licenseNumber") || undefined,
      territory: formData.get("territory") || undefined,
    };

    try {
      const res = await fetch("/api/realtor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await res.json();

      if (!res.ok) {
        toast({
          title: "Error",
          description: result.error || "Failed to create account",
          variant: "destructive",
        });
        return;
      }

      setAccount(result.data);
      toast({
        title: "Welcome aboard!",
        description: "Your realtor account has been created.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to create account",
        variant: "destructive",
      });
    } finally {
      setSigning(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0A2E4D]/5 dark:bg-[#0A2E4D]/20">
            <Building2 className="h-5 w-5 text-[#0A2E4D] dark:text-teal-400" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold text-[hsl(var(--foreground))]">Realtor Portal</h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Loading your account...</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0A2E4D] dark:border-teal-400 border-t-transparent" />
        </div>
      </div>
    );
  }

  // If no account, show sign-up form
  if (!account) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0A2E4D]/5 dark:bg-[#0A2E4D]/20">
            <Building2 className="h-5 w-5 text-[#0A2E4D] dark:text-teal-400" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold text-[hsl(var(--foreground))]">Realtor Portal</h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Gift HomeOS Passports to your home buyers and build lasting relationships.
            </p>
          </div>
        </div>

        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[#0A2E4D] dark:text-teal-400" />
              Create Your Realtor Account
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <Label htmlFor="company">Company / Brokerage</Label>
                <Input
                  id="company"
                  name="company"
                  placeholder="e.g., Keller Williams Realty"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="licenseNumber">License Number</Label>
                <Input
                  id="licenseNumber"
                  name="licenseNumber"
                  placeholder="e.g., SA-12345678"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="territory">Territory / Market Area</Label>
                <Input
                  id="territory"
                  name="territory"
                  placeholder="e.g., Dallas-Fort Worth Metro"
                  className="mt-1"
                />
              </div>
              <Button type="submit" disabled={signing} className="w-full">
                {signing ? "Creating Account..." : "Create Realtor Account"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show realtor dashboard
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0A2E4D]/5 dark:bg-[#0A2E4D]/20">
          <Building2 className="h-5 w-5 text-[#0A2E4D] dark:text-teal-400" />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold text-[hsl(var(--foreground))]">Realtor Portal</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Manage your account and gift HomeOS Passports to buyers.
          </p>
        </div>
      </div>

      {/* Account Info */}
      <Card>
        <CardContent className="flex items-start gap-4 p-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#0A2E4D]/5 dark:bg-[#0A2E4D]/20">
            <Building2 className="h-6 w-6 text-[#0A2E4D] dark:text-teal-400" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">
                {account.company ?? "Realtor Account"}
              </h3>
              <Badge variant="success" className="gap-1 text-[10px]">
                <BadgeCheck className="h-3 w-3" />
                Active
              </Badge>
            </div>
            <div className="mt-1 flex flex-wrap gap-3 text-sm text-[hsl(var(--muted-foreground))]">
              {account.licenseNumber && (
                <span>License: {account.licenseNumber}</span>
              )}
              {account.territory && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {account.territory}
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
              Member since{" "}
              {new Date(account.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
              })}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Gift Passport Form */}
      <GiftPassportForm />
    </div>
  );
}
