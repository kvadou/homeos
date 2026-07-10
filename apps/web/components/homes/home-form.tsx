"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/toaster";
import { HOME_TYPES } from "@homeos/shared";

interface HomeFormProps {
  initialData?: {
    id: string;
    name: string;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    zipCode?: string | null;
    homeType?: string | null;
    yearBuilt?: number | null;
    squareFeet?: number | null;
    description?: string | null;
  };
}

export function HomeForm({ initialData }: HomeFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const isEditing = !!initialData?.id;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const body: Record<string, unknown> = {
      name: formData.get("name"),
      address: formData.get("address") || undefined,
      city: formData.get("city") || undefined,
      state: formData.get("state") || undefined,
      zipCode: formData.get("zipCode") || undefined,
      homeType: formData.get("homeType") || undefined,
      yearBuilt: formData.get("yearBuilt")
        ? Number(formData.get("yearBuilt"))
        : undefined,
      squareFeet: formData.get("squareFeet")
        ? Number(formData.get("squareFeet"))
        : undefined,
      description: formData.get("description") || undefined,
    };

    try {
      const url = isEditing ? `/api/homes/${initialData.id}` : "/api/homes";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        toast({
          title: "Error",
          description: data.error || "Something went wrong",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: isEditing ? "Home updated" : "Home created",
        description: `${body.name} has been ${isEditing ? "updated" : "created"} successfully.`,
      });

      router.push(`/home/${data.data.id}`);
      router.refresh();
    } catch {
      toast({
        title: "Error",
        description: "Failed to save home. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="name">Home Name *</Label>
          <Input
            id="name"
            name="name"
            placeholder="e.g., 123 Main Street"
            defaultValue={initialData?.name ?? ""}
            required
            className="mt-1.5"
          />
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            name="address"
            placeholder="Street address"
            defaultValue={initialData?.address ?? ""}
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            name="city"
            placeholder="City"
            defaultValue={initialData?.city ?? ""}
            className="mt-1.5"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              name="state"
              placeholder="State"
              defaultValue={initialData?.state ?? ""}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="zipCode">ZIP Code</Label>
            <Input
              id="zipCode"
              name="zipCode"
              placeholder="ZIP"
              defaultValue={initialData?.zipCode ?? ""}
              className="mt-1.5"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="homeType">Home Type</Label>
          <Select name="homeType" defaultValue={initialData?.homeType ?? ""}>
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="yearBuilt">Year Built</Label>
            <Input
              id="yearBuilt"
              name="yearBuilt"
              type="number"
              placeholder="2005"
              defaultValue={initialData?.yearBuilt ?? ""}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="squareFeet">Square Feet</Label>
            <Input
              id="squareFeet"
              name="squareFeet"
              type="number"
              placeholder="2200"
              defaultValue={initialData?.squareFeet ?? ""}
              className="mt-1.5"
            />
          </div>
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            placeholder="Tell us about your home..."
            defaultValue={initialData?.description ?? ""}
            className="mt-1.5"
            rows={3}
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : isEditing ? "Update Home" : "Create Home"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
