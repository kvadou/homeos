// Runnable check for computeHomeHealth. Not imported anywhere, so Next never
// executes it. Run manually: `npx tsx apps/web/lib/home-health.check.ts`
import assert from "node:assert";
import { computeHomeHealth, isItemDocumented } from "./home-health";

// A brand-new, empty home: no tasks (100 maintenance), no items, no safety.
// Nothing item-driven should read as failing on day one.
const empty = computeHomeHealth({
  totalTasks: 0,
  overdueTasks: 0,
  totalItems: 0,
  documentedItems: 0,
  systemItemConditions: [],
  safetyTypesCovered: 0,
  noteCount: 0,
});
assert.strictEqual(empty.categories.find((c) => c.label === "Maintenance")!.value, 100);
for (const label of ["Documentation", "Systems", "Knowledge"] as const) {
  assert.strictEqual(
    empty.categories.find((c) => c.label === label)!.value,
    100,
    `zero-items ${label} should be neutral 100`
  );
}
assert.ok(empty.score >= 0 && empty.score <= 100);

// A non_functional system scores 0, dragging Systems to the floor.
const dead = computeHomeHealth({
  totalTasks: 0,
  overdueTasks: 0,
  totalItems: 1,
  documentedItems: 0,
  systemItemConditions: ["non_functional"],
  safetyTypesCovered: 0,
  noteCount: 0,
});
assert.strictEqual(dead.categories.find((c) => c.label === "Systems")!.value, 0);

// Documentation counts an item with a warranty OR a manual/document (not AND).
assert.strictEqual(
  isItemDocumented({ warrantyExpiry: new Date(), manualCount: 0, documentCount: 0 }),
  true
);
assert.strictEqual(
  isItemDocumented({ warrantyExpiry: null, manualCount: 1, documentCount: 0 }),
  true
);
assert.strictEqual(
  isItemDocumented({ warrantyExpiry: null, manualCount: 0, documentCount: 0 }),
  false
);

// A well-kept home should land in the high band.
const great = computeHomeHealth({
  totalTasks: 10,
  overdueTasks: 0,
  totalItems: 20,
  documentedItems: 20,
  systemItemConditions: ["excellent", "good", "good"],
  safetyTypesCovered: 6,
  noteCount: 12,
});
assert.strictEqual(great.label, "Excellent");
assert.ok(great.score >= 90, `expected >=90, got ${great.score}`);

// Overdue tasks must drag maintenance down.
const behind = computeHomeHealth({
  totalTasks: 10,
  overdueTasks: 5,
  totalItems: 10,
  documentedItems: 0,
  systemItemConditions: ["poor"],
  safetyTypesCovered: 0,
  noteCount: 0,
});
assert.strictEqual(behind.categories.find((c) => c.label === "Maintenance")!.value, 50);
assert.ok(behind.score < great.score);

console.log("home-health checks passed");
