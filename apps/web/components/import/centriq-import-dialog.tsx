"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, Check, Loader2, AlertCircle } from "lucide-react";

interface CentriqImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ParsedRow {
  name: string;
  brand: string;
  model: string;
  category: string;
  room: string;
  price: string;
  [key: string]: string;
}

interface HomeOption {
  id: string;
  name: string;
}

function parseCSVPreview(csv: string): { headers: string[]; rows: ParsedRow[] } {
  const lines = csv.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) return { headers: [], rows: [] };

  const headers = parseCsvLine(lines[0]).map((h) => h.trim());
  const rows: ParsedRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j].toLowerCase().replace(/\s+/g, "_")] = values[j]?.trim() ?? "";
    }
    // Map to display fields
    rows.push({
      name:
        row.item_name || row.name || row.product_name || row.product || row.title || "",
      brand: row.brand || row.manufacturer || "",
      model: row.model || row.model_name || "",
      category: row.category || row.type || row.product_type || "",
      room: row.room || row.location || "",
      price: row.purchase_price || row.price || row.cost || "",
    });
  }

  return { headers, rows };
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

export function CentriqImportDialog({
  open,
  onOpenChange,
}: CentriqImportDialogProps) {
  const [homes, setHomes] = useState<HomeOption[]>([]);
  const [selectedHome, setSelectedHome] = useState<string>("");
  const [csvText, setCsvText] = useState("");
  const [preview, setPreview] = useState<{
    headers: string[];
    rows: ParsedRow[];
  } | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchHomes = useCallback(async () => {
    const res = await fetch("/api/homes");
    const data = await res.json();
    if (data.success && data.data.length > 0) {
      setHomes(data.data);
      if (!selectedHome) setSelectedHome(data.data[0].id);
    }
  }, [selectedHome]);

  useEffect(() => {
    if (open) {
      fetchHomes();
    }
  }, [open, fetchHomes]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text);
      const parsed = parseCSVPreview(text);
      if (parsed.rows.length === 0) {
        setError("Could not parse CSV. Please check the file format.");
        setPreview(null);
      } else {
        setPreview(parsed);
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!csvText || !selectedHome) return;

    setImporting(true);
    setError(null);

    try {
      const res = await fetch("/api/import/centriq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          csv: csvText,
          homeId: selectedHome,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error || "Import failed");
      }
    } catch {
      setError("Failed to connect to the server");
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setCsvText("");
    setPreview(null);
    setResult(null);
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import from Centriq</DialogTitle>
          <DialogDescription>
            Upload a CSV export from Centriq to import your items into HomeOS
            AI.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-teal-500/10">
              <Check className="h-7 w-7 text-teal-500" />
            </div>
            <p className="text-lg font-semibold">Import Complete</p>
            <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
              Successfully imported {result.imported} item
              {result.imported !== 1 ? "s" : ""}.
            </p>
            <Button className="mt-6" onClick={handleClose}>
              Done
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Home selector */}
            <div className="space-y-2">
              <Label>Import to Home</Label>
              <Select value={selectedHome} onValueChange={setSelectedHome}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a home" />
                </SelectTrigger>
                <SelectContent>
                  {homes.map((home) => (
                    <SelectItem key={home.id} value={home.id}>
                      {home.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* File upload */}
            <div className="space-y-2">
              <Label>CSV File</Label>
              <div className="flex items-center gap-3">
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-[hsl(var(--border))] px-4 py-3 text-sm transition-colors hover:border-teal-500/50 hover:bg-teal-500/5 w-full justify-center">
                  <Upload className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                  <span className="text-[hsl(var(--muted-foreground))]">
                    {preview
                      ? `${preview.rows.length} items found`
                      : "Choose a CSV file..."}
                  </span>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Preview table */}
            {preview && preview.rows.length > 0 && (
              <div className="space-y-2">
                <Label>
                  Preview ({preview.rows.length} item
                  {preview.rows.length !== 1 ? "s" : ""})
                </Label>
                <div className="max-h-64 overflow-auto rounded-lg border border-[hsl(var(--border))]">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-[hsl(var(--muted))]">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">
                          Name
                        </th>
                        <th className="px-3 py-2 text-left font-medium">
                          Brand
                        </th>
                        <th className="px-3 py-2 text-left font-medium">
                          Category
                        </th>
                        <th className="px-3 py-2 text-left font-medium">
                          Room
                        </th>
                        <th className="px-3 py-2 text-right font-medium">
                          Price
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[hsl(var(--border))]">
                      {preview.rows.slice(0, 50).map((row, i) => (
                        <tr key={i} className="hover:bg-[hsl(var(--muted))]/50">
                          <td className="px-3 py-2 font-medium">
                            {row.name || "-"}
                          </td>
                          <td className="px-3 py-2 text-[hsl(var(--muted-foreground))]">
                            {row.brand || "-"}
                          </td>
                          <td className="px-3 py-2 text-[hsl(var(--muted-foreground))]">
                            {row.category || "-"}
                          </td>
                          <td className="px-3 py-2 text-[hsl(var(--muted-foreground))]">
                            {row.room || "-"}
                          </td>
                          <td className="px-3 py-2 text-right text-[hsl(var(--muted-foreground))]">
                            {row.price || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {preview.rows.length > 50 && (
                    <div className="border-t border-[hsl(var(--border))] px-3 py-2 text-xs text-[hsl(var(--muted-foreground))]">
                      Showing 50 of {preview.rows.length} items
                    </div>
                  )}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={importing || !preview || !selectedHome}
              >
                {importing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  `Import ${preview?.rows.length ?? 0} Items`
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
