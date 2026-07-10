"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Wrench,
  Youtube,
  ExternalLink,
  ShoppingCart,
  AlertTriangle,
  Clock,
  HardHat,
  ListChecks,
  Stethoscope,
  DollarSign,
  ArrowRightLeft,
} from "lucide-react";
import type { RepairHelpResult } from "@homeos/ai";

interface RepairHelpResultsProps {
  result: RepairHelpResult;
}

const difficultyConfig = {
  easy: {
    label: "Easy",
    className:
      "border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  moderate: {
    label: "Moderate",
    className:
      "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  },
  hard: {
    label: "Hard",
    className:
      "border-transparent bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  },
  professional: {
    label: "Professional Recommended",
    className:
      "border-transparent bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  },
};

export function RepairHelpResults({ result }: RepairHelpResultsProps) {
  const difficulty = difficultyConfig[result.difficulty];

  return (
    <div className="space-y-6">
      {/* Diagnosis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Stethoscope className="h-5 w-5 text-[hsl(var(--primary))]" />
            Diagnosis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed">{result.diagnosis}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Badge className={difficulty.className}>{difficulty.label}</Badge>
            <div className="flex items-center gap-1.5 text-sm text-[hsl(var(--muted-foreground))]">
              <Clock className="h-4 w-4" />
              <span>{result.estimatedTime}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Safety Warnings */}
      {result.safetyWarnings.length > 0 && (
        <Card className="border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-red-800 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
              Safety Warnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {result.safetyWarnings.map((warning, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-red-700 dark:text-red-400"
                >
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{warning}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Cost Comparison: Repair vs Replace */}
      {(result.estimatedRepairCost || result.estimatedReplacementCost) && (
        <Card className="border-teal-200 dark:border-teal-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ArrowRightLeft className="h-5 w-5 text-teal-600" />
              Repair vs. Replace
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-[hsl(var(--border))] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Wrench className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Repair Cost</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  {result.estimatedRepairCost}
                </p>
                <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                  Estimated total with parts and labor
                </p>
              </div>
              <div className="rounded-lg border border-[hsl(var(--border))] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-medium">Replacement Cost</span>
                </div>
                <p className="text-2xl font-bold text-amber-600">
                  {result.estimatedReplacementCost}
                </p>
                <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                  New unit purchase and installation
                </p>
              </div>
            </div>
            {result.repairVsReplaceRecommendation && (
              <div className="mt-4 rounded-lg bg-teal-50 p-3 dark:bg-teal-950/20">
                <p className="text-sm font-medium text-teal-900 dark:text-teal-200">
                  Recommendation
                </p>
                <p className="mt-1 text-sm leading-relaxed text-teal-800 dark:text-teal-300">
                  {result.repairVsReplaceRecommendation}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step-by-Step Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ListChecks className="h-5 w-5 text-[hsl(var(--primary))]" />
            Step-by-Step Instructions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3">
            {result.steps.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--primary))] text-xs font-bold text-[hsl(var(--primary-foreground))]">
                  {i + 1}
                </span>
                <span className="text-sm leading-relaxed pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* Tools Needed */}
      {result.toolsNeeded.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Wrench className="h-5 w-5 text-[hsl(var(--primary))]" />
              Tools Needed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {result.toolsNeeded.map((tool, i) => (
                <Badge key={i} variant="outline" className="gap-1.5">
                  <Wrench className="h-3 w-3" />
                  {tool}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Watch Repair Videos */}
      {result.videos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Youtube className="h-5 w-5 text-red-600" />
              Watch Repair Videos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {result.videos.map((video, i) => (
                <a
                  key={i}
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col rounded-lg border border-[hsl(var(--border))] p-4 transition-colors hover:border-red-300 hover:bg-red-50/50 dark:hover:border-red-900 dark:hover:bg-red-950/20"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                      <Youtube className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                      {video.source}
                    </span>
                  </div>
                  <p className="text-sm font-medium line-clamp-2 group-hover:text-red-700 dark:group-hover:text-red-400">
                    {video.title}
                  </p>
                  <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))] line-clamp-2">
                    {video.description}
                  </p>
                  <div className="mt-auto pt-3">
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
                      Watch on YouTube
                      <ExternalLink className="h-3 w-3" />
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Read Repair Guides */}
      {result.articles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ExternalLink className="h-5 w-5 text-blue-600" />
              Read Repair Guides
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {result.articles.map((article, i) => (
                <a
                  key={i}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-3 rounded-lg border border-[hsl(var(--border))] p-4 transition-colors hover:border-blue-300 hover:bg-blue-50/50 dark:hover:border-blue-900 dark:hover:bg-blue-950/20"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                    <ExternalLink className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium line-clamp-2 group-hover:text-blue-700 dark:group-hover:text-blue-400">
                      {article.title}
                    </p>
                    <span className="mt-1 inline-flex items-center gap-1 text-xs text-[hsl(var(--muted-foreground))]">
                      {article.source}
                      <ExternalLink className="h-2.5 w-2.5" />
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Parts You May Need */}
      {result.partsNeeded.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShoppingCart className="h-5 w-5 text-[hsl(var(--primary))]" />
              Parts You May Need
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {result.partsNeeded.map((part, i) => (
                <div
                  key={i}
                  className="flex flex-col rounded-lg border border-[hsl(var(--border))] p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--muted))]">
                      <HardHat className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{part.name}</p>
                      <p className="text-sm font-semibold text-[hsl(var(--primary))]">
                        {part.estimatedPrice}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-1.5"
                      asChild
                    >
                      <a
                        href={part.searchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ShoppingCart className="h-3.5 w-3.5" />
                        Find on Amazon
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
