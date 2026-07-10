"use client";

import { useState, useEffect } from "react";
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
import { MAINTENANCE_PRIORITIES } from "@homeos/shared";
import { useToast } from "@/components/ui/toaster";
import { Loader2 } from "lucide-react";

interface ItemOption {
  id: string;
  name: string;
  home: { id: string; name: string };
  room?: { id: string; name: string } | null;
}

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function CreateTaskDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateTaskDialogProps) {
  const { toast } = useToast();
  const [items, setItems] = useState<ItemOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [itemId, setItemId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState("");
  const [nextDueDate, setNextDueDate] = useState("");
  const [priority, setPriority] = useState("medium");

  useEffect(() => {
    if (open) {
      setLoading(true);
      fetch("/api/items")
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setItems(data.data);
        })
        .finally(() => setLoading(false));
    }
  }, [open]);

  function resetForm() {
    setItemId("");
    setTitle("");
    setDescription("");
    setFrequency("");
    setNextDueDate("");
    setPriority("medium");
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!itemId || !title) {
      setError("Please select an item and enter a title.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId,
          title,
          description: description || undefined,
          frequency: frequency || undefined,
          nextDueDate: nextDueDate || undefined,
          priority,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error ?? "Failed to create task");
        return;
      }

      toast({ title: "Task created", description: `"${title}" has been added.`, variant: "success" });
      resetForm();
      onOpenChange(false);
      onCreated();
    } catch {
      setError("Failed to create task");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) resetForm();
        onOpenChange(val);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Maintenance Task</DialogTitle>
          <DialogDescription>
            Schedule a recurring or one-time maintenance task for an item.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="item">Item</Label>
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading items...
              </div>
            ) : (
              <Select value={itemId} onValueChange={setItemId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an item" />
                </SelectTrigger>
                <SelectContent>
                  {items.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} ({item.home.name}
                      {item.room ? ` - ${item.room.name}` : ""})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Replace HVAC filter"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details about this task..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(MAINTENANCE_PRIORITIES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger>
                  <SelectValue placeholder="One-time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="semi-annually">Semi-Annually</SelectItem>
                  <SelectItem value="annually">Annually</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nextDueDate">Next Due Date</Label>
            <Input
              id="nextDueDate"
              type="date"
              value={nextDueDate}
              onChange={(e) => setNextDueDate(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
