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
import { ITEM_CATEGORIES, ITEM_CONDITIONS } from "@homeos/shared";

interface RoomOption {
  id: string;
  name: string;
}

interface HomeOption {
  id: string;
  name: string;
}

interface ScanData {
  name?: string;
  category?: string;
  brand?: string;
  model?: string;
  condition?: string;
  description?: string;
}

interface ItemFormProps {
  homes: HomeOption[];
  defaultHomeId?: string;
  defaultRoomId?: string;
  scanData?: ScanData;
  initialData?: {
    id: string;
    homeId: string;
    roomId?: string | null;
    name: string;
    category: string;
    brand?: string | null;
    model?: string | null;
    serialNumber?: string | null;
    modelNumber?: string | null;
    purchaseDate?: string | null;
    purchasePrice?: number | null;
    warrantyExpiry?: string | null;
    condition?: string | null;
    description?: string | null;
    notes?: string | null;
  };
}

export function ItemForm({ homes, defaultHomeId, defaultRoomId, scanData, initialData }: ItemFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [selectedHomeId, setSelectedHomeId] = React.useState(
    initialData?.homeId ?? defaultHomeId ?? homes[0]?.id ?? ""
  );
  const [rooms, setRooms] = React.useState<RoomOption[]>([]);
  const isEditing = !!initialData?.id;

  React.useEffect(() => {
    if (!selectedHomeId) return;
    fetch(`/api/homes/${selectedHomeId}/rooms`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setRooms(data.data);
      })
      .catch(() => {});
  }, [selectedHomeId]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const body: Record<string, unknown> = {
      homeId: selectedHomeId,
      roomId: formData.get("roomId") || undefined,
      name: formData.get("name"),
      category: formData.get("category"),
      brand: formData.get("brand") || undefined,
      model: formData.get("model") || undefined,
      serialNumber: formData.get("serialNumber") || undefined,
      modelNumber: formData.get("modelNumber") || undefined,
      purchaseDate: formData.get("purchaseDate") || undefined,
      purchasePrice: formData.get("purchasePrice")
        ? Number(formData.get("purchasePrice"))
        : undefined,
      warrantyExpiry: formData.get("warrantyExpiry") || undefined,
      condition: formData.get("condition") || "good",
      description: formData.get("description") || undefined,
      notes: formData.get("notes") || undefined,
    };

    try {
      const url = isEditing ? `/api/items/${initialData.id}` : "/api/items";
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
        title: isEditing ? "Item updated" : "Item created",
        description: `${body.name} has been ${isEditing ? "updated" : "created"} successfully.`,
      });

      router.push(`/items/${data.data.id}`);
      router.refresh();
    } catch {
      toast({
        title: "Error",
        description: "Failed to save item",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  function formatDate(d: string | null | undefined) {
    if (!d) return "";
    return new Date(d).toISOString().split("T")[0];
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Home selector */}
        <div>
          <Label>Home *</Label>
          <Select
            name="homeId"
            value={selectedHomeId}
            onValueChange={setSelectedHomeId}
          >
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="Select home" />
            </SelectTrigger>
            <SelectContent>
              {homes.map((h) => (
                <SelectItem key={h.id} value={h.id}>
                  {h.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Room selector */}
        <div>
          <Label>Room</Label>
          <Select
            name="roomId"
            defaultValue={initialData?.roomId ?? defaultRoomId ?? ""}
          >
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="Select room (optional)" />
            </SelectTrigger>
            <SelectContent>
              {rooms.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="name">Item Name *</Label>
          <Input
            id="name"
            name="name"
            placeholder="e.g., Samsung Refrigerator"
            defaultValue={initialData?.name ?? scanData?.name ?? ""}
            required
            className="mt-1.5"
          />
        </div>

        <div>
          <Label>Category *</Label>
          <Select name="category" defaultValue={initialData?.category ?? scanData?.category ?? ""} required>
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ITEM_CATEGORIES).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Condition</Label>
          <Select name="condition" defaultValue={initialData?.condition ?? scanData?.condition ?? "good"}>
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="Select condition" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ITEM_CONDITIONS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="brand">Brand</Label>
          <Input
            id="brand"
            name="brand"
            placeholder="e.g., Samsung"
            defaultValue={initialData?.brand ?? scanData?.brand ?? ""}
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="model">Model</Label>
          <Input
            id="model"
            name="model"
            placeholder="e.g., RF28R7351SR"
            defaultValue={initialData?.model ?? scanData?.model ?? ""}
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="modelNumber">Model Number</Label>
          <Input
            id="modelNumber"
            name="modelNumber"
            placeholder="Full model number"
            defaultValue={initialData?.modelNumber ?? ""}
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="serialNumber">Serial Number</Label>
          <Input
            id="serialNumber"
            name="serialNumber"
            placeholder="Serial number"
            defaultValue={initialData?.serialNumber ?? ""}
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="purchaseDate">Purchase Date</Label>
          <Input
            id="purchaseDate"
            name="purchaseDate"
            type="date"
            defaultValue={formatDate(initialData?.purchaseDate)}
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="purchasePrice">Purchase Price ($)</Label>
          <Input
            id="purchasePrice"
            name="purchasePrice"
            type="number"
            step="0.01"
            placeholder="0.00"
            defaultValue={initialData?.purchasePrice ?? ""}
            className="mt-1.5"
          />
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="warrantyExpiry">Warranty Expiry</Label>
          <Input
            id="warrantyExpiry"
            name="warrantyExpiry"
            type="date"
            defaultValue={formatDate(initialData?.warrantyExpiry)}
            className="mt-1.5"
          />
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            placeholder="Item description..."
            defaultValue={initialData?.description ?? scanData?.description ?? ""}
            className="mt-1.5"
            rows={3}
          />
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            name="notes"
            placeholder="Additional notes..."
            defaultValue={initialData?.notes ?? ""}
            className="mt-1.5"
            rows={2}
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : isEditing ? "Update Item" : "Create Item"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
