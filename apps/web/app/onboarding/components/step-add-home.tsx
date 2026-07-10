"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight, Home, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/toaster";
import { HOME_TYPES } from "@homeos/shared";

interface StepAddHomeProps {
  onNext: (homeId: string, homeName: string) => void;
  onBack: () => void;
  onSkip: () => void;
}

export function StepAddHome({ onNext, onBack, onSkip }: StepAddHomeProps) {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [homeType, setHomeType] = React.useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;

    const body: Record<string, unknown> = {
      name,
      address: formData.get("address") || undefined,
      city: formData.get("city") || undefined,
      state: formData.get("state") || undefined,
      zipCode: formData.get("zipCode") || undefined,
      homeType: homeType || undefined,
    };

    try {
      const res = await fetch("/api/homes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast({
          title: "Error",
          description: data.error || "Could not create home. Please try again.",
          variant: "destructive",
        });
        return;
      }

      onNext(data.data.id, name);
    } catch {
      toast({
        title: "Connection error",
        description: "Could not reach the server. Please check your connection.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4">
      <div className="w-full max-w-lg animate-in fade-in slide-in-from-right-4 duration-400">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#0A2E4D]/5 dark:bg-[#0A2E4D]/20">
            <Home className="h-6 w-6 text-[#0A2E4D] dark:text-teal-400" />
          </div>
          <h2 className="font-heading text-2xl font-bold text-[#0A2E4D] dark:text-white">
            Add your first home
          </h2>
          <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
            Just the basics — you can add more details later.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900/50">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-sm font-medium">
                  Home Name <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g., Our House, Lake Cabin"
                  required
                  autoFocus
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="address" className="text-sm font-medium">
                  Street Address
                </Label>
                <Input
                  id="address"
                  name="address"
                  placeholder="123 Main Street"
                  className="mt-1.5"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <Label htmlFor="city" className="text-sm font-medium">
                    City
                  </Label>
                  <Input
                    id="city"
                    name="city"
                    placeholder="City"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="state" className="text-sm font-medium">
                    State
                  </Label>
                  <Input
                    id="state"
                    name="state"
                    placeholder="State"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="zipCode" className="text-sm font-medium">
                    ZIP
                  </Label>
                  <Input
                    id="zipCode"
                    name="zipCode"
                    placeholder="ZIP"
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Home Type</Label>
                <Select value={homeType} onValueChange={setHomeType}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(HOME_TYPES).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onBack}
              className="gap-1.5 text-gray-500"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="gap-2 bg-[#00B4A0] px-6 font-semibold text-white shadow-sm shadow-[#00B4A0]/20 hover:bg-[#009e8e]"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  Next: Scan Item
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Skip */}
        <div className="mt-4 text-center">
          <button
            onClick={onSkip}
            className="text-sm text-gray-400 transition-colors hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
