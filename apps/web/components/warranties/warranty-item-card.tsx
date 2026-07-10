"use client";

import { format, formatDistanceToNow, isPast, isBefore, addDays } from "date-fns";
import { Shield, Calendar, MapPin, Pencil } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WARRANTY_TYPES } from "@homeos/shared";

interface WarrantyItem {
  id: string;
  name: string;
  brand: string | null;
  model: string | null;
  category: string;
  warrantyExpiry: string | null;
  warrantyProvider: string | null;
  warrantyType: string | null;
  warrantyNotes: string | null;
  room: { id: string; name: string } | null;
  home: { id: string; name: string };
}

interface WarrantyItemCardProps {
  item: WarrantyItem;
  onEdit: (item: WarrantyItem) => void;
}

export function WarrantyItemCard({ item, onEdit }: WarrantyItemCardProps) {
  const expiryDate = item.warrantyExpiry ? new Date(item.warrantyExpiry) : null;
  const now = new Date();
  const isExpired = expiryDate ? isPast(expiryDate) : false;
  const isExpiringSoon = expiryDate
    ? !isExpired && isBefore(expiryDate, addDays(now, 30))
    : false;

  const statusColor = isExpired
    ? "border-red-300 dark:border-red-900/50"
    : isExpiringSoon
    ? "border-amber-300 dark:border-amber-900/50"
    : "border-green-300 dark:border-green-900/50";

  const statusBg = isExpired
    ? "bg-red-50/50 dark:bg-red-950/20"
    : isExpiringSoon
    ? "bg-amber-50/50 dark:bg-amber-950/20"
    : "";

  return (
    <Card className={`${statusColor} ${statusBg} transition-colors`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold truncate text-[hsl(var(--foreground))]">
                {item.name}
              </h3>
              {isExpired ? (
                <Badge variant="destructive" className="text-[10px] shrink-0">
                  Expired
                </Badge>
              ) : isExpiringSoon ? (
                <Badge variant="warning" className="text-[10px] shrink-0">
                  Expiring Soon
                </Badge>
              ) : (
                <Badge variant="success" className="text-[10px] shrink-0">
                  Active
                </Badge>
              )}
            </div>

            <p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">
              {item.brand}
              {item.model ? ` ${item.model}` : ""}
            </p>

            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[hsl(var(--muted-foreground))]">
              {expiryDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {isExpired
                    ? `Expired ${formatDistanceToNow(expiryDate, { addSuffix: true })}`
                    : `Expires ${format(expiryDate, "MMM d, yyyy")}`}
                </span>
              )}
              {item.warrantyType && (
                <span className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  {WARRANTY_TYPES[item.warrantyType as keyof typeof WARRANTY_TYPES] ??
                    item.warrantyType}
                </span>
              )}
              {item.room && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {item.room.name}
                </span>
              )}
            </div>

            {item.warrantyProvider && (
              <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                Provider: {item.warrantyProvider}
              </p>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => onEdit(item)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
