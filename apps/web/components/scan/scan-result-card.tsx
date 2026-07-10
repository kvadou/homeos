"use client";

import { useRouter } from "next/navigation";
import {
  Tag,
  Building2,
  Hash,
  FileText,
  ThermometerSun,
  Clock,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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

interface ScanResultCardProps {
  result: ScannedItem;
  imagePreview: string | null;
  onScanAgain: () => void;
}

export function ScanResultCard({
  result,
  imagePreview,
  onScanAgain,
}: ScanResultCardProps) {
  const router = useRouter();

  const categoryLabel =
    ITEM_CATEGORIES[result.category as keyof typeof ITEM_CATEGORIES] ??
    result.category;
  const conditionLabel =
    ITEM_CONDITIONS[result.condition as keyof typeof ITEM_CONDITIONS] ??
    result.condition;

  function handleAddToInventory() {
    const params = new URLSearchParams();
    params.set("name", result.name);
    params.set("category", result.category);
    if (result.brand) params.set("brand", result.brand);
    if (result.model) params.set("model", result.model);
    if (result.condition) params.set("condition", result.condition);
    if (result.description) params.set("description", result.description);

    router.push(`/items/new?${params.toString()}`);
  }

  const details = [
    { icon: Tag, label: "Category", value: categoryLabel },
    { icon: Building2, label: "Brand", value: result.brand },
    { icon: Hash, label: "Model", value: result.model },
    { icon: ThermometerSun, label: "Condition", value: conditionLabel },
    { icon: Clock, label: "Estimated Age", value: result.estimatedAge },
  ].filter((d) => d.value);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <Badge variant="outline" className="mb-2 text-teal-600 border-teal-200 bg-teal-50 dark:text-teal-400 dark:border-teal-800 dark:bg-teal-900/30">
              AI Identified
            </Badge>
            <CardTitle className="text-xl">{result.name}</CardTitle>
          </div>
          {imagePreview && (
            <div className="ml-4 h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-[hsl(var(--border))]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePreview}
                alt="Scanned item"
                className="h-full w-full object-cover"
              />
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {result.description && (
          <div className="flex gap-2">
            <FileText className="mt-0.5 h-4 w-4 flex-shrink-0 text-[hsl(var(--muted-foreground))]" />
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              {result.description}
            </p>
          </div>
        )}

        <Separator />

        <div className="grid gap-3 sm:grid-cols-2">
          {details.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
              <div>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">{label}</p>
                <p className="text-sm font-medium">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>

      <CardFooter className="gap-3">
        <Button onClick={handleAddToInventory} className="gap-2">
          Add to Inventory
          <ArrowRight className="h-4 w-4" />
        </Button>
        <Button variant="outline" onClick={onScanAgain} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Scan Again
        </Button>
      </CardFooter>
    </Card>
  );
}
