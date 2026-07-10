"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Wrench, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { RepairHelpResults } from "@/components/repair/repair-help-results";
import type { RepairHelpResult } from "@homeos/ai";

interface ItemData {
  id: string;
  name: string;
  brand: string | null;
  model: string | null;
  category: string;
}

export default function RepairHelpPage() {
  const params = useParams<{ itemId: string }>();
  const itemId = params.itemId;

  const [item, setItem] = useState<ItemData | null>(null);
  const [itemLoading, setItemLoading] = useState(true);
  const [itemError, setItemError] = useState<string | null>(null);

  const [issue, setIssue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RepairHelpResult | null>(null);

  const fetchItem = useCallback(async () => {
    try {
      const res = await fetch(`/api/items/${itemId}`);
      const json = await res.json();
      if (!json.success) {
        setItemError(json.error || "Failed to load item");
        return;
      }
      setItem(json.data);
    } catch {
      setItemError("Failed to load item details");
    } finally {
      setItemLoading(false);
    }
  }, [itemId]);

  useEffect(() => {
    fetchItem();
  }, [fetchItem]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!issue.trim() || loading) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`/api/items/${itemId}/repair-help`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issue: issue.trim() }),
      });

      const json = await res.json();

      if (!json.success) {
        setError(json.error || "Failed to get repair help");
        return;
      }

      setResult(json.data);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (itemLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--muted-foreground))]" />
      </div>
    );
  }

  if (itemError || !item) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
          <Link
            href="/items"
            className="hover:text-[hsl(var(--foreground))] transition-colors"
          >
            <ArrowLeft className="h-4 w-4 inline mr-1" />
            Items
          </Link>
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-[hsl(var(--muted-foreground))]">
              {itemError || "Item not found"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
        <Link
          href="/items"
          className="hover:text-[hsl(var(--foreground))] transition-colors"
        >
          <ArrowLeft className="h-4 w-4 inline mr-1" />
          Items
        </Link>
        <span>/</span>
        <Link
          href={`/items/${item.id}`}
          className="hover:text-[hsl(var(--foreground))] transition-colors"
        >
          {item.name}
        </Link>
        <span>/</span>
        <span className="text-[hsl(var(--foreground))]">Repair Help</span>
      </div>

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]">
          <Wrench className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold">AI Repair Help</h1>
          <p className="mt-1 text-[hsl(var(--muted-foreground))]">
            Describe what&apos;s wrong with your{" "}
            <span className="font-medium text-[hsl(var(--foreground))]">
              {item.name}
            </span>{" "}
            and get AI-powered repair guidance with video tutorials and parts
            links.
          </p>
        </div>
      </div>

      {/* Issue Input */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            What&apos;s wrong with this item?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              placeholder={`e.g., "The dishwasher isn't draining properly" or "Making a loud grinding noise when running"`}
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
              rows={3}
              disabled={loading}
              className="resize-none"
            />
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400">
                {error}
              </div>
            )}
            <Button
              type="submit"
              disabled={!issue.trim() || loading}
              className="gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Get Repair Help
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-10 w-10 animate-spin text-[hsl(var(--primary))]" />
          <p className="mt-4 text-sm text-[hsl(var(--muted-foreground))]">
            Analyzing the issue and generating repair guidance...
          </p>
          <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
            This may take a few seconds
          </p>
        </div>
      )}

      {/* Results */}
      {result && !loading && <RepairHelpResults result={result} />}
    </div>
  );
}
