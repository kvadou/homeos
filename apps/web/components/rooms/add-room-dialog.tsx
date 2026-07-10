"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toaster";
import { ROOM_TYPES } from "@homeos/shared";

interface Props {
  homeId: string;
}

export function AddRoomDialog({ homeId }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const body = {
      homeId,
      name: formData.get("name"),
      roomType: formData.get("roomType"),
      floor: formData.get("floor") ? Number(formData.get("floor")) : 1,
      description: formData.get("description") || undefined,
    };

    try {
      const res = await fetch(`/api/homes/${homeId}/rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        toast({
          title: "Error",
          description: data.error || "Failed to create room",
          variant: "destructive",
        });
        return;
      }

      toast({ title: "Room added", description: `${body.name} has been added.` });
      setOpen(false);
      router.refresh();
    } catch {
      toast({
        title: "Error",
        description: "Failed to create room",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" />
          Add Room
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Room</DialogTitle>
            <DialogDescription>
              Add a new room to organize your items.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="room-name">Room Name *</Label>
              <Input
                id="room-name"
                name="name"
                placeholder="e.g., Master Bedroom"
                required
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="room-type">Room Type *</Label>
              <Select name="roomType" required>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select room type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROOM_TYPES).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="room-floor">Floor</Label>
              <Input
                id="room-floor"
                name="floor"
                type="number"
                placeholder="1"
                defaultValue={1}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="room-description">Description</Label>
              <Textarea
                id="room-description"
                name="description"
                placeholder="Optional description..."
                className="mt-1.5"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Room"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
