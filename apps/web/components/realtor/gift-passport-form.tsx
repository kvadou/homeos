"use client";

import * as React from "react";
import { Gift, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toaster";

interface GiftResult {
  buyerEmail: string;
  invitationId: string;
}

export function GiftPassportForm() {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState<GiftResult | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setSuccess(null);

    const formData = new FormData(e.currentTarget);
    const body = {
      buyerEmail: formData.get("buyerEmail"),
      buyerName: formData.get("buyerName"),
      homeAddress: formData.get("homeAddress"),
      city: formData.get("city"),
      state: formData.get("state"),
      zipCode: formData.get("zipCode"),
      personalMessage: formData.get("personalMessage") || undefined,
    };

    try {
      const res = await fetch("/api/realtor/gift-passport", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await res.json();

      if (!res.ok) {
        toast({
          title: "Error",
          description: result.error || "Failed to gift passport",
          variant: "destructive",
        });
        return;
      }

      setSuccess({
        buyerEmail: result.data.buyerEmail,
        invitationId: result.data.invitationId,
      });
      toast({
        title: "Passport gifted",
        description: `An invitation has been created for ${body.buyerEmail}.`,
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to gift passport",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center py-12">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-500/10">
            <CheckCircle2 className="h-8 w-8 text-teal-500" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">Passport Gifted Successfully</h3>
          <p className="mt-2 text-center text-sm text-[hsl(var(--muted-foreground))]">
            An invitation has been sent to{" "}
            <span className="font-medium text-[hsl(var(--foreground))]">
              {success.buyerEmail}
            </span>
            . They will receive access to their HomeOS Passport when they sign up.
          </p>
          <Button
            className="mt-6"
            onClick={() => setSuccess(null)}
          >
            <Gift className="h-4 w-4" />
            Gift Another Passport
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-teal-500" />
          Gift a Home Passport
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="buyerName">Buyer Name *</Label>
              <Input
                id="buyerName"
                name="buyerName"
                placeholder="John Smith"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="buyerEmail">Buyer Email *</Label>
              <Input
                id="buyerEmail"
                name="buyerEmail"
                type="email"
                placeholder="buyer@email.com"
                required
                className="mt-1"
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="homeAddress">Home Address *</Label>
              <Input
                id="homeAddress"
                name="homeAddress"
                placeholder="123 Main Street"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                name="city"
                placeholder="Springfield"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="state">State *</Label>
              <Input
                id="state"
                name="state"
                placeholder="MO"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="zipCode">ZIP Code *</Label>
              <Input
                id="zipCode"
                name="zipCode"
                placeholder="65801"
                required
                className="mt-1"
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="personalMessage">Personal Message</Label>
              <Textarea
                id="personalMessage"
                name="personalMessage"
                placeholder="Congratulations on your new home! Here's a HomeOS Passport to help you keep track of everything..."
                className="mt-1"
                rows={3}
              />
            </div>
          </div>
          <Button type="submit" disabled={loading} className="gap-2">
            <Gift className="h-4 w-4" />
            {loading ? "Sending..." : "Gift Passport"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
