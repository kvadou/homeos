import { prisma } from "./db";
import { getUserSubscription } from "./stripe";
import { PLAN_LIMITS, type PlanName } from "@homeos/shared";

/**
 * Get the user's current plan name.
 */
export async function getUserPlan(userId: string): Promise<PlanName> {
  const subscription = await getUserSubscription(userId);
  const plan = subscription.plan as PlanName;
  return plan in PLAN_LIMITS ? plan : "free";
}

/**
 * Check if a resource limit allows more usage. -1 means unlimited.
 */
function isWithinLimit(used: number, limit: number): boolean {
  if (limit === -1) return true;
  return used < limit;
}

/**
 * Check if a user can create another item based on their plan limit.
 */
export async function canCreateItem(userId: string): Promise<boolean> {
  const plan = await getUserPlan(userId);
  const limit = PLAN_LIMITS[plan].items as number;

  if (!isWithinLimit(0, limit)) return false;

  const itemCount = await prisma.item.count({
    where: {
      home: { users: { some: { userId } } },
    },
  });

  return isWithinLimit(itemCount, limit);
}

/**
 * Check if a user can create another home based on their plan limit.
 */
export async function canCreateHome(userId: string): Promise<boolean> {
  const plan = await getUserPlan(userId);
  const limit = PLAN_LIMITS[plan].homes as number;

  if (!isWithinLimit(0, limit)) return false;

  const homeCount = await prisma.homeUser.count({
    where: { userId },
  });

  return isWithinLimit(homeCount, limit);
}

/**
 * Check if a user can use AI scan based on their monthly plan limit.
 */
export async function canUseScan(userId: string): Promise<boolean> {
  const plan = await getUserPlan(userId);
  const limit = PLAN_LIMITS[plan].aiScans as number;

  if (!isWithinLimit(0, limit)) return false;

  // Count scans this month (ChatSessions used for scan are tracked via the scan API)
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const scanCount = await prisma.chatSession.count({
    where: {
      userId,
      title: "AI Scan",
      createdAt: { gte: startOfMonth },
    },
  });

  return isWithinLimit(scanCount, limit);
}

/**
 * Record an AI scan usage for tracking purposes.
 */
export async function recordScanUsage(userId: string): Promise<void> {
  await prisma.chatSession.create({
    data: {
      userId,
      title: "AI Scan",
    },
  });
}

/**
 * Compute remaining count. -1 means unlimited.
 */
function computeRemaining(used: number, limit: number): number {
  if (limit === -1) return -1;
  return Math.max(0, limit - used);
}

/**
 * Get remaining limits and current usage for all resources.
 */
export async function getRemainingLimits(userId: string) {
  const plan = await getUserPlan(userId);
  const limits = PLAN_LIMITS[plan];

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [itemCount, homeCount, scanCount, memberCount] = await Promise.all([
    prisma.item.count({
      where: { home: { users: { some: { userId } } } },
    }),
    prisma.homeUser.count({
      where: { userId },
    }),
    prisma.chatSession.count({
      where: {
        userId,
        title: "AI Scan",
        createdAt: { gte: startOfMonth },
      },
    }),
    // Count total members across all homes the user owns
    prisma.homeUser.count({
      where: {
        home: {
          users: {
            some: { userId, role: "owner" },
          },
        },
      },
    }),
  ]);

  const itemsLimit = limits.items as number;
  const homesLimit = limits.homes as number;
  const aiScansLimit = limits.aiScans as number;
  const membersLimit = limits.members as number;

  return {
    plan,
    items: {
      used: itemCount,
      limit: itemsLimit,
      remaining: computeRemaining(itemCount, itemsLimit),
    },
    homes: {
      used: homeCount,
      limit: homesLimit,
      remaining: computeRemaining(homeCount, homesLimit),
    },
    aiScans: {
      used: scanCount,
      limit: aiScansLimit,
      remaining: computeRemaining(scanCount, aiScansLimit),
    },
    members: {
      used: memberCount,
      limit: membersLimit,
      remaining: computeRemaining(memberCount, membersLimit),
    },
  };
}
