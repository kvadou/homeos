"use client";

import * as React from "react";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Tag,
  Building2,
  Hash,
  ThermometerSun,
  Sparkles,
} from "lucide-react";
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
import { ITEM_CATEGORIES, ITEM_CONDITIONS } from "@homeos/shared";

interface ScannedItem {
  name: string;
  brand: string | null;
  model: string | null;
  category: string;
  description: string;
  condition: string;
  estimatedAge: string | null;
}

interface StepReviewItemProps {
  homeId: string;
  scanResult: ScannedItem;
  imagePreview: string | null;
  onNext: (itemId: string, itemName: string) => void;
  onBack: () => void;
  onSkip: () => void;
}

export function StepReviewItem({
  homeId,
  scanResult,
  imagePreview,
  onNext,
  onBack,
  onSkip,
}: StepReviewItemProps) {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [name, setName] = React.useState(scanResult.name);
  const [brand, setBrand] = React.useState(scanResult.brand ?? "");
  const [model, setModel] = React.useState(scanResult.model ?? "");
  const [category, setCategory] = React.useState(scanResult.category);
  const [condition, setCondition] = React.useState(scanResult.condition || "good");

  async function handleSave() {
    if (!name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for this item.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          homeId,
          name: name.trim(),
          brand: brand || undefined,
          model: model || undefined,
          category,
          condition,
          description: scanResult.description || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast({
          title: "Error",
          description: data.error || "Could not save item. Please try again.",
          variant: "destructive",
        });
        return;
      }

      onNext(data.data.id, name.trim());
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
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 inline-flex items-center gap-2 rounded-full border border-[#00B4A0]/20 bg-[#00B4A0]/5 px-3 py-1">
            <Sparkles className="h-3.5 w-3.5 text-[#00B4A0]" />
            <span className="text-xs font-semibold text-[#00B4A0]">
              AI Identified
            </span>
          </div>
          <h2 className="font-heading text-2xl font-bold text-[#0A2E4D] dark:text-white">
            Review your item
          </h2>
          <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
            Confirm the details or make any corrections.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900/50">
          {/* Image + Name */}
          <div className="mb-5 flex items-start gap-4">
            {imagePreview && (
              <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border border-gray-100 dark:border-gray-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Scanned item"
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            <div className="flex-1">
              <Label htmlFor="itemName" className="text-sm font-medium">
                Item Name
              </Label>
              <Input
                id="itemName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="flex items-center gap-1.5 text-sm font-medium">
                <Building2 className="h-3.5 w-3.5 text-gray-400" />
                Brand
              </Label>
              <Input
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Unknown"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="flex items-center gap-1.5 text-sm font-medium">
                <Hash className="h-3.5 w-3.5 text-gray-400" />
                Model
              </Label>
              <Input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Unknown"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="flex items-center gap-1.5 text-sm font-medium">
                <Tag className="h-3.5 w-3.5 text-gray-400" />
                Category
              </Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
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
              <Label className="flex items-center gap-1.5 text-sm font-medium">
                <ThermometerSun className="h-3.5 w-3.5 text-gray-400" />
                Condition
              </Label>
              <Select value={condition} onValueChange={setCondition}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
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
          </div>

          {/* Description */}
          {scanResult.description && (
            <div className="mt-4 rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
              <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-400">
                {scanResult.description}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={onBack}
            className="gap-1.5 text-gray-500"
          >
            <ArrowLeft className="h-4 w-4" />
            Rescan
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="gap-2 bg-[#00B4A0] px-6 font-semibold text-white shadow-sm shadow-[#00B4A0]/20 hover:bg-[#009e8e]"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Save & Generate Plan
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>

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
