"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { MAINTENANCE_PRIORITIES } from "@homeos/shared";

interface Home {
  id: string;
  name: string;
}

interface Provider {
  id: string;
  name: string;
}

interface CreateRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  homes: Home[];
  providers: Provider[];
  onCreated: () => void;
}

export function CreateRequestDialog({
  open,
  onOpenChange,
  homes,
  providers,
  onCreated,
}: CreateRequestDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [homeId, setHomeId] = React.useState("");
  const [providerId, setProviderId] = React.useState("");
  const [priority, setPriority] = React.useState("medium");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const body = {
      homeId,
      providerId: providerId && providerId !== "none" ? providerId : undefined,
      title: formData.get("title"),
      description: formData.get("description") || undefined,
      priority,
      scheduledAt: formData.get("scheduledAt") || undefined,
    };

    try {
      const res = await fetch("/api/service-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        toast({
          title: "Error",
          description: data.error || "Failed to create service request",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Request created",
        description: "Service request has been created.",
      });

      onOpenChange(false);
      onCreated();
      setHomeId("");
      setProviderId("");
      setPriority("medium");
    } catch {
      toast({
        title: "Error",
        description: "Failed to create service request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Service Request</DialogTitle>
          <DialogDescription>
            Create a service request for one of your homes.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Home *</Label>
            <Select value={homeId} onValueChange={setHomeId} required>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Select a home" />
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

          <div>
            <Label htmlFor="request-title">Title *</Label>
            <Input
              id="request-title"
              name="title"
              placeholder="e.g., Fix leaking faucet"
              required
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="request-description">Description</Label>
            <Textarea
              id="request-description"
              name="description"
              placeholder="Describe the issue or service needed..."
              className="mt-1.5"
              rows={3}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(MAINTENANCE_PRIORITIES).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="request-scheduled">Scheduled Date</Label>
              <Input
                id="request-scheduled"
                name="scheduledAt"
                type="date"
                className="mt-1.5"
              />
            </div>
          </div>

          <div>
            <Label>Provider</Label>
            <Select value={providerId} onValueChange={setProviderId}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Select provider (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No provider</SelectItem>
                {providers.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !homeId}>
              {loading ? "Creating..." : "Create Request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
