// Home Health scoring: turns raw home data into a 0-100 score across five areas.
// ponytail: heuristic weights + condition map, tune later once real usage tells us
// which signals actually predict a well-kept home.

export type HealthCategoryKey =
  | "Systems"
  | "Safety"
  | "Documentation"
  | "Maintenance"
  | "Knowledge";

export interface HealthCategory {
  label: HealthCategoryKey;
  value: number; // 0-100
  note: string;
}

export interface HomeHealthInput {
  totalTasks: number;
  overdueTasks: number;
  totalItems: number;
  /** items with a warranty on file OR at least one manual or document */
  documentedItems: number;
  /** condition strings for HVAC / plumbing / electrical-ish items */
  systemItemConditions: (string | null)[];
  /** distinct SafetyInfo.type values present for the home */
  safetyTypesCovered: number;
  /** items carrying freeform notes, a proxy for captured know-how */
  noteCount: number;
}

export interface HomeHealthResult {
  score: number;
  label: string;
  categories: HealthCategory[];
}

// shutoff_water | shutoff_gas | shutoff_electrical | emergency_contact | evacuation_note | go_bag_item
const EXPECTED_SAFETY_TYPES = 6;

const CONDITION_SCORE: Record<string, number> = {
  excellent: 100,
  good: 85,
  fair: 60,
  poor: 30,
  needs_repair: 15,
  non_functional: 0,
};

const NEUTRAL_NEW_HOME_NOTE = "Add items to start tracking this.";

/** Numeric 0-100 score for an item condition. Unknown/missing conditions fall
 *  back to a healthy-ish 85 so untracked items don't drag a home down. */
export function conditionScore(condition: string | null | undefined): number {
  return CONDITION_SCORE[(condition ?? "good").toLowerCase()] ?? 85;
}

/** An item counts as documented if it has a warranty on file OR at least one
 *  manual/document. Shared so the dashboard and analytics agree. */
export function isItemDocumented(item: {
  warrantyExpiry: Date | null;
  manualCount: number;
  documentCount: number;
}): boolean {
  return item.warrantyExpiry != null || item.manualCount + item.documentCount >= 1;
}

const WEIGHTS: Record<HealthCategoryKey, number> = {
  Maintenance: 0.3,
  Safety: 0.2,
  Documentation: 0.2,
  Systems: 0.2,
  Knowledge: 0.1,
};

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

export function computeHomeHealth(input: HomeHealthInput): HomeHealthResult {
  // A brand-new home (no items) shouldn't read as failing on day one: give the
  // item-driven categories a neutral score until there's something to track.
  const noItems = input.totalItems === 0;

  const maintenance =
    input.totalTasks === 0
      ? 100
      : clamp(((input.totalTasks - input.overdueTasks) / input.totalTasks) * 100);

  const safety = clamp((input.safetyTypesCovered / EXPECTED_SAFETY_TYPES) * 100);

  const documentation = noItems
    ? 100
    : clamp((input.documentedItems / input.totalItems) * 100);

  const systemScores = input.systemItemConditions.map(conditionScore);
  const systems = noItems
    ? 100
    : systemScores.length === 0
      ? 90 // no tracked systems yet: assume healthy rather than penalize
      : clamp(systemScores.reduce((a, b) => a + b, 0) / systemScores.length);

  // Knowledge grows with captured notes and caps out around a dozen entries.
  const knowledge = noItems ? 100 : clamp(30 + input.noteCount * 6);

  const categories: HealthCategory[] = [
    {
      label: "Systems",
      value: systems,
      note: noItems ? NEUTRAL_NEW_HOME_NOTE : systemsNote(systems, systemScores.length),
    },
    { label: "Safety", value: safety, note: safetyNote(input.safetyTypesCovered) },
    {
      label: "Documentation",
      value: documentation,
      note: noItems ? NEUTRAL_NEW_HOME_NOTE : docNote(documentation),
    },
    { label: "Maintenance", value: maintenance, note: maintNote(input.overdueTasks) },
    {
      label: "Knowledge",
      value: knowledge,
      note: noItems ? NEUTRAL_NEW_HOME_NOTE : knowledgeNote(input.noteCount),
    },
  ];

  const score = clamp(
    categories.reduce((sum, c) => sum + c.value * WEIGHTS[c.label], 0)
  );

  return { score, label: scoreLabel(score), categories };
}

export function scoreLabel(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Good";
  if (score >= 60) return "Fair";
  return "Needs attention";
}

function systemsNote(value: number, tracked: number): string {
  if (tracked === 0) return "Add your HVAC, water heater, and electrical to track their condition.";
  if (value >= 85) return "Your major systems are in good working order.";
  if (value >= 60) return "One or more systems could use a closer look.";
  return "Several systems are showing wear worth addressing.";
}

function safetyNote(covered: number): string {
  if (covered >= EXPECTED_SAFETY_TYPES) return "Shutoffs and emergency info are all documented.";
  if (covered === 0) return "Document your water, gas, and electrical shutoffs.";
  return `${covered} of ${EXPECTED_SAFETY_TYPES} safety essentials documented.`;
}

function docNote(value: number): string {
  if (value >= 85) return "Most warranties and manuals are on file.";
  if (value >= 50) return "A good start. A few items still need paperwork.";
  return "Add warranties and manuals so nothing gets lost.";
}

function maintNote(overdue: number): string {
  if (overdue === 0) return "You're on track with your upkeep.";
  if (overdue === 1) return "One task is overdue.";
  return `${overdue} tasks are overdue.`;
}

function knowledgeNote(count: number): string {
  if (count >= 8) return "Your home's know-how is well documented.";
  if (count > 0) return "A few systems have documented how-tos.";
  return "Capture notes so key details aren't lost.";
}
