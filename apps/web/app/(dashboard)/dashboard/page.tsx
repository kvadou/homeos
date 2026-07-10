import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { format, formatDistanceToNow, differenceInCalendarDays, startOfDay } from "date-fns";
import { Home as HomeIcon, Plus } from "lucide-react";
import { SYSTEM_CATEGORY_KEYS } from "@homeos/shared";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { computeHomeHealth, isItemDocumented } from "@/lib/home-health";
import { formatCurrency } from "@/lib/utils";
import { RecallDashboardBanner } from "@/components/recalls/recall-dashboard-banner";
import { PendingInvitationsBanner } from "@/components/homes/pending-invitations-banner";
import { SeasonalDashboardCard } from "@/components/maintenance/seasonal-dashboard-card";
import { ContinueSetupCard } from "@/components/dashboard/continue-setup-card";
import { Greeting } from "@/components/dashboard/greeting";
import { WeatherIntelligence } from "@/components/dashboard/weather-intelligence";
import { HomeHealth } from "@/components/dashboard/home-health";
import { WeekendPriorities, type PriorityTask } from "@/components/dashboard/weekend-priorities";
import { HomeOSInsight } from "@/components/dashboard/homeos-insight";
import { LookingAhead, type LookAheadItem } from "@/components/dashboard/looking-ahead";
import {
  UpcomingMaintenance,
  type UpcomingGroups,
  type MaintenanceGroup,
} from "@/components/dashboard/upcoming-maintenance";
import { HomeKnowledge, type KnowledgeEntry } from "@/components/dashboard/home-knowledge";
import { RecentlyAdded, type RecentItem } from "@/components/dashboard/recently-added";
import { ActiveProjects, type ActiveProject } from "@/components/dashboard/active-projects";
import { HomeStory } from "@/components/dashboard/home-story";
import {
  RecentActivity,
  type ActivityEntry,
  type ActivityIconKey,
} from "@/components/dashboard/recent-activity";

const PRIORITY_RANK: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
const SYSTEM_KEYS: readonly string[] = SYSTEM_CATEGORY_KEYS;

export default async function DashboardPage() {
  const user = await requireAuth();

  const homes = await prisma.home.findMany({
    where: { users: { some: { userId: user.id } } },
    orderBy: { createdAt: "desc" },
  });

  // Preserve prior behavior: send brand-new users to onboarding unless they skipped.
  if (homes.length === 0) {
    const cookieStore = await cookies();
    if (!cookieStore.get("onboarding_skipped")) {
      redirect("/onboarding");
    }
    return <NoHomeState />;
  }

  // ponytail: no persistent home selector exists yet, so the dashboard scopes to the
  // most-recent home (mirrors homes[0] usage in the prior page). Wire these queries to
  // the selector when multi-home selection lands.
  const home = homes[0];
  const homeId = home.id;
  const now = new Date();
  // Calendar-day semantics: a task due earlier today is still "due today", not
  // overdue. Bucketing below uses differenceInCalendarDays, so gate overdue on
  // the start of today to keep both consistent.
  const today = startOfDay(now);

  const [
    openTasks,
    totalTaskCount,
    overdueCount,
    items,
    safety,
    homeEvents,
    recentLogs,
    recallCount,
    improvementAgg,
  ] = await Promise.all([
      prisma.maintenanceTask.findMany({
        where: { item: { homeId }, status: { not: "completed" } },
        include: { item: { select: { name: true, category: true } } },
        orderBy: { nextDueDate: "asc" },
      }),
      prisma.maintenanceTask.count({ where: { item: { homeId } } }),
      prisma.maintenanceTask.count({
        where: { item: { homeId }, status: { not: "completed" }, nextDueDate: { lt: today } },
      }),
      prisma.item.findMany({
        where: { homeId },
        select: {
          id: true,
          name: true,
          category: true,
          condition: true,
          photoUrl: true,
          warrantyExpiry: true,
          purchaseDate: true,
          createdAt: true,
          notes: true,
          _count: { select: { manuals: true, documents: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.safetyInfo.findMany({
        where: { homeId },
        select: { type: true, title: true, location: true },
      }),
      prisma.homeEvent.findMany({
        where: { homeId },
        orderBy: { date: "desc" },
        take: 30,
      }),
      prisma.maintenanceLog.findMany({
        where: { task: { item: { homeId } } },
        include: { task: { select: { title: true } } },
        orderBy: { performedAt: "desc" },
        take: 8,
      }),
      prisma.itemRecall.count({
        where: { item: { home: { users: { some: { userId: user.id } } } } },
      }),
      // Exact improvement totals, independent of the take:30 event slice above.
      prisma.homeEvent.aggregate({
        where: { homeId, type: "improvement" },
        _sum: { cost: true },
        _count: true,
      }),
    ]);

  const completedCount = totalTaskCount - openTasks.length;
  const completionPct = totalTaskCount === 0 ? 100 : Math.round((completedCount / totalTaskCount) * 100);

  // ---- Home Health ----
  const documentedItems = items.filter((i) =>
    isItemDocumented({
      warrantyExpiry: i.warrantyExpiry,
      manualCount: i._count.manuals,
      documentCount: i._count.documents,
    })
  ).length;
  const systemItemConditions = items
    .filter((i) => SYSTEM_KEYS.includes(i.category))
    .map((i) => i.condition);
  const safetyTypesCovered = new Set(safety.map((s) => s.type)).size;
  const noteCount = items.filter((i) => i.notes && i.notes.trim().length > 0).length;

  const health = computeHomeHealth({
    totalTasks: totalTaskCount,
    overdueTasks: overdueCount,
    totalItems: items.length,
    documentedItems,
    systemItemConditions,
    safetyTypesCovered,
    noteCount,
  });

  // ---- This Weekend (top 3 open tasks by priority, then due date) ----
  const prioritized = [...openTasks].sort((a, b) => {
    const pr =
      (PRIORITY_RANK[a.priority ?? "medium"] ?? 2) - (PRIORITY_RANK[b.priority ?? "medium"] ?? 2);
    if (pr !== 0) return pr;
    const ad = a.nextDueDate ? new Date(a.nextDueDate).getTime() : Infinity;
    const bd = b.nextDueDate ? new Date(b.nextDueDate).getTime() : Infinity;
    return ad - bd;
  });
  const weekendTasks: PriorityTask[] = prioritized.slice(0, 3).map((t, idx) => ({
    id: t.id,
    title: t.title,
    meta: dueLabel(t.nextDueDate, now),
    why: t.description ?? t.item.name,
    highlight: idx === 0 && (t.priority === "high" || t.priority === "urgent"),
  }));

  // ---- Upcoming Maintenance (bucketed by due date) ----
  const groups: UpcomingGroups = { "This Week": [], "This Month": [], "This Season": [] };
  for (const t of openTasks) {
    if (!t.nextDueDate) continue;
    const days = differenceInCalendarDays(new Date(t.nextDueDate), now);
    if (days < 0) continue; // overdue lives in This Weekend / priorities
    let group: MaintenanceGroup;
    if (days <= 7) group = "This Week";
    else if (days <= 31) group = "This Month";
    else if (days <= 120) group = "This Season";
    else continue;
    groups[group].push({
      id: t.id,
      title: t.title,
      due: shortDue(t.nextDueDate, now),
      category: t.item.category,
    });
  }

  // ---- Looking Ahead (warranties within 90 days + aging items) ----
  const lookAhead: LookAheadItem[] = [];
  for (const i of items) {
    if (!i.warrantyExpiry) continue;
    const days = differenceInCalendarDays(new Date(i.warrantyExpiry), now);
    if (days >= 0 && days <= 90) {
      lookAhead.push({
        title: `${i.name} warranty ends`,
        detail: `Coverage expires ${format(new Date(i.warrantyExpiry), "MMM d, yyyy")}.`,
        when: days <= 30 ? "Within a month" : "Within 90 days",
        cost: null, // ponytail: no repair-cost model yet
        tone: days <= 30 ? "attention" : "plan",
      });
    }
  }
  for (const i of items) {
    if (lookAhead.length >= 4) break;
    if (!i.purchaseDate) continue;
    const years =
      (now.getTime() - new Date(i.purchaseDate).getTime()) / (365.25 * 24 * 3600 * 1000);
    if (years >= 10) {
      lookAhead.push({
        title: `Consider replacing ${i.name}`,
        detail: `Purchased ${format(new Date(i.purchaseDate), "yyyy")}, approaching typical end of life.`,
        when: "Plan ahead",
        cost: null,
        tone: "plan",
      });
    }
  }
  const lookAheadItems = lookAhead.slice(0, 4);

  // ---- What Your Home Remembers ----
  const documentsCount = items.reduce((s, i) => s + i._count.documents, 0);
  const photosCount = items.filter((i) => i.photoUrl).length;
  const knowledgeEntries: KnowledgeEntry[] = [];
  for (const s of safety) {
    if (knowledgeEntries.length >= 3) break;
    knowledgeEntries.push({
      iconKey: "location",
      title: s.title,
      meta: s.location ? `Documented · ${s.location}` : "Documented",
      href: "/dashboard/safety",
    });
  }
  for (const i of items) {
    if (knowledgeEntries.length >= 3) break;
    if (i.notes && i.notes.trim()) {
      knowledgeEntries.push({
        iconKey: "note",
        title: i.name,
        meta: i.notes.trim().slice(0, 60),
        href: `/library/item/${i.id}`,
      });
    }
  }
  const knowledgeCounts = {
    videos: 0, // ponytail: no video model yet
    notes: noteCount,
    documents: documentsCount,
    locations: safety.filter((s) => s.location && s.location.trim()).length,
    photos: photosCount,
  };

  // ---- Recently Added ----
  const recentItems: RecentItem[] = items.slice(0, 4).map((i) => ({
    id: i.id,
    name: i.name,
    timeAgo: formatDistanceToNow(new Date(i.createdAt), { addSuffix: true }),
    category: i.category,
  }));

  // ---- Active Projects (HomeEvent type=improvement) ----
  const improvementEvents = homeEvents.filter((e) => e.type === "improvement");
  const projects: ActiveProject[] = improvementEvents.slice(0, 3).map((e) => {
    const days = differenceInCalendarDays(new Date(e.date), now);
    const status: ActiveProject["status"] =
      days > 0 ? "Planned" : days > -30 ? "In progress" : "Completed";
    return {
      id: e.id,
      title: e.title,
      detail: e.description ?? "",
      status,
      budget: e.cost != null ? formatCurrency(e.cost) : null,
      when: format(new Date(e.date), "MMM d, yyyy"),
    };
  });

  // ---- Home Story ----
  const daysOwned = differenceInCalendarDays(now, new Date(home.createdAt));
  const yearsCared = Math.max(1, Math.floor(daysOwned / 365));
  // Exact aggregate over every improvement event, not just the take:30 slice.
  const totalInvested = improvementAgg._sum.cost ?? 0;
  const projectsDone = improvementAgg._count;
  const milestones = [
    projectsDone > 0
      ? `${projectsDone} project${projectsDone === 1 ? "" : "s"} completed with care`
      : `${completedCount} maintenance task${completedCount === 1 ? "" : "s"} completed`,
    totalInvested > 0
      ? `About ${formatCurrency(totalInvested)} invested in your home`
      : "A steady record of care, entry by entry",
  ];

  // ---- Recent Activity (merge logs + events + item additions) ----
  const merged: { id: string; iconKey: ActivityIconKey; text: string; date: Date }[] = [];
  for (const log of recentLogs) {
    merged.push({
      id: `log-${log.id}`,
      iconKey: "complete",
      text: `${log.task.title} marked complete`,
      date: new Date(log.performedAt),
    });
  }
  for (const e of homeEvents.slice(0, 8)) {
    merged.push({ id: `event-${e.id}`, iconKey: "event", text: e.title, date: new Date(e.date) });
  }
  for (const i of items.slice(0, 8)) {
    merged.push({
      id: `item-${i.id}`,
      iconKey: "added",
      text: `${i.name} added to your home`,
      date: new Date(i.createdAt),
    });
  }
  merged.sort((a, b) => b.date.getTime() - a.date.getTime());
  const activity: ActivityEntry[] = merged.slice(0, 8).map((m) => ({
    id: m.id,
    iconKey: m.iconKey,
    text: m.text,
    timeAgo: formatDistanceToNow(m.date, { addSuffix: true }),
  }));

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Attention-first surfaces: setup nudge, invites, and safety recalls
          sit above the widget grid so they can't be missed. Each self-hides
          when it has nothing to show. */}
      <div className="space-y-4">
        <ContinueSetupCard />
        <PendingInvitationsBanner />
        <RecallDashboardBanner recallCount={recallCount} />
      </div>

      {/* The conversation begins */}
      <Greeting firstName={user.firstName} />
      <WeatherIntelligence />

      {/* Is my home okay? */}
      <HomeHealth
        score={health.score}
        label={health.label}
        categories={health.categories}
        completionPct={completionPct}
      />

      {/* What should I focus on right now? */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <WeekendPriorities tasks={weekendTasks} />
        </div>
        <div className="lg:col-span-2">
          <HomeOSInsight />
        </div>
      </div>

      {/* What should I plan for? */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <LookingAhead items={lookAheadItems} />
        <UpcomingMaintenance groups={groups} />
      </div>

      {/* Seasonal, climate-aware upkeep once we know where the home is. */}
      {home.zipCode && <SeasonalDashboardCard zipCode={home.zipCode} />}

      {/* What does my home remember? */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <HomeKnowledge counts={knowledgeCounts} entries={knowledgeEntries} />
        <RecentlyAdded items={recentItems} />
      </div>

      {/* What am I working toward? */}
      <ActiveProjects projects={projects} />

      {/* The bigger picture */}
      <HomeStory yearsCared={yearsCared} milestones={milestones} />

      <RecentActivity activity={activity} />
    </div>
  );
}

function dueLabel(due: Date | null, now: Date): string {
  if (!due) return "No due date";
  const days = differenceInCalendarDays(new Date(due), now);
  if (days < 0) return `Overdue ${formatDistanceToNow(new Date(due))}`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days} days`;
}

function shortDue(due: Date, now: Date): string {
  const days = differenceInCalendarDays(new Date(due), now);
  if (days <= 0) return "Due";
  if (days <= 14) return `In ${days} day${days === 1 ? "" : "s"}`;
  return format(new Date(due), "MMM d");
}

function NoHomeState() {
  return (
    <div className="mx-auto max-w-5xl">
      <section className="flex flex-col items-center justify-center rounded-3xl border border-border/70 bg-card p-12 text-center shadow-sm">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-sage/15 text-sage-foreground">
          <HomeIcon className="size-7" strokeWidth={1.75} />
        </span>
        <h1 className="mt-4 font-serif text-2xl tracking-tight">Add your first home</h1>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Once you add a home, your dashboard fills in with its health, tasks, and story.
        </p>
        <Link
          href="/home/new"
          className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
        >
          <Plus className="size-4" />
          Add Home
        </Link>
      </section>
    </div>
  );
}
