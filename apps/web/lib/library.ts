import { formatDistanceToNow } from "date-fns";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";
import { ITEM_CATEGORIES, ITEM_CONDITIONS, ROOM_TYPES } from "@homeos/shared";
import {
  COLLECTION_META,
  categoryMeta,
  type CollectionKey,
  type IconKey,
  type Tint,
} from "@/components/library/icons";

// A "system" is any item in one of the building-service categories. Appliances
// are their own bucket so the two collections don't overlap.
const SYSTEM_CATEGORIES = ["hvac", "plumbing", "electrical", "structural"];
const APPLIANCE_CATEGORIES = ["appliance"];

// Every library view is scoped to the homes the signed-in user belongs to,
// matching the pattern used by the items pages.
const homeScope = (userId: string) => ({
  users: { some: { userId } },
});
const itemScope = (userId: string) => ({ home: homeScope(userId) });

function categoryLabel(category: string): string {
  return ITEM_CATEGORIES[category as keyof typeof ITEM_CATEGORIES] ?? category;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function relativeDay(d: Date): string {
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return formatDistanceToNow(d, { addSuffix: true });
}

// User-entered URLs (contractor sites, manual sources) are often stored without
// a scheme ("acme.com"), which the browser then treats as an in-app relative
// link. Prepend https:// when no scheme is present. App-internal paths (starting
// with "/") are left untouched.
function normalizeExternalUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("/")) return url;
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(url)) return url;
  return `https://${url}`;
}

// Receipts are detected by document name for now. fileType holds MIME types
// (e.g. "application/pdf"), never the word "receipt", so a name match is the
// only signal we have. Move to a dedicated document flag if this proves loose.
const receiptWhere = (userId: string) => ({
  item: itemScope(userId),
  name: { contains: "receipt", mode: "insensitive" as const },
});

// ---------- Library home ----------

export type SearchRow = {
  id: string;
  name: string;
  category: string;
  summary: string;
  icon: IconKey;
  tint: Tint;
};
export type RecentRow = {
  id: string;
  name: string;
  kind: string;
  when: string;
  icon: IconKey;
  tint: Tint;
};
export type TimelineRow = {
  year: string;
  title: string;
  detail: string;
  icon: IconKey;
  tint: Tint;
};

const EVENT_ICON: Record<string, { icon: IconKey; tint: Tint }> = {
  maintenance: { icon: "wrench", tint: "sage" },
  purchase: { icon: "package", tint: "wood" },
  improvement: { icon: "hammer", tint: "navy" },
  warranty: { icon: "shield-check", tint: "sage" },
  custom: { icon: "home", tint: "wood" },
};

export async function getLibraryHome(userId: string): Promise<{
  counts: Record<CollectionKey, number>;
  recent: RecentRow[];
  timeline: TimelineRow[];
  searchItems: SearchRow[];
}> {
  const scope = homeScope(userId);
  const iScope = itemScope(userId);

  const [
    appliances,
    systems,
    rooms,
    projects,
    paint,
    contractors,
    receipts,
    manuals,
    warranties,
    itemPhotos,
    roomPhotos,
    docPhotos,
    recentItems,
    events,
    allItems,
  ] = await Promise.all([
    prisma.item.count({ where: { home: scope, category: { in: APPLIANCE_CATEGORIES } } }),
    prisma.item.count({ where: { home: scope, category: { in: SYSTEM_CATEGORIES } } }),
    prisma.room.count({ where: { home: scope } }),
    prisma.homeEvent.count({ where: { home: scope, type: "improvement" } }),
    prisma.room.count({
      where: { home: scope, OR: [{ paintColor: { not: null } }, { paintBrand: { not: null } }] },
    }),
    prisma.providerProfile.count({
      where: { serviceRequests: { some: { home: scope } } },
    }),
    prisma.itemDocument.count({ where: receiptWhere(userId) }),
    prisma.manual.count({ where: { items: { some: { item: iScope } } } }),
    prisma.item.count({ where: { home: scope, warrantyExpiry: { not: null } } }),
    prisma.item.count({ where: { home: scope, photoUrl: { not: null } } }),
    prisma.room.count({ where: { home: scope, photoUrl: { not: null } } }),
    prisma.itemDocument.count({ where: { item: iScope, fileType: { startsWith: "image" } } }),
    prisma.item.findMany({
      where: { home: scope },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, name: true, category: true, createdAt: true },
    }),
    prisma.homeEvent.findMany({
      where: { home: scope },
      orderBy: { date: "desc" },
      take: 12,
    }),
    // Client-side search index, capped at 500. Select only the fields the search
    // filter reads. Move to a search API route if homes outgrow this.
    prisma.item.findMany({
      where: { home: scope },
      orderBy: { name: "asc" },
      take: 500,
      select: { id: true, name: true, category: true, brand: true, model: true, description: true },
    }),
  ]);

  const counts: Record<CollectionKey, number> = {
    appliances,
    systems,
    rooms,
    projects,
    paint,
    contractors,
    photos: itemPhotos + roomPhotos + docPhotos,
    receipts,
    manuals,
    videos: 0, // no video model yet
    measurements: 0, // no measurement model yet
    warranties,
  };

  const recent: RecentRow[] = recentItems.map((i) => {
    const m = categoryMeta(i.category);
    return {
      id: i.id,
      name: i.name,
      kind: categoryLabel(i.category),
      when: relativeDay(i.createdAt),
      icon: m.icon,
      tint: m.tint,
    };
  });

  // We fetch the latest 12 events (date desc) but the timeline reads oldest to
  // newest, so flip them back to chronological order for display.
  const timeline: TimelineRow[] = [...events].reverse().map((e) => {
    const m = EVENT_ICON[e.type] ?? EVENT_ICON.custom;
    return {
      year: String(e.date.getFullYear()),
      title: e.title,
      detail: e.description ?? categoryLabel(e.type),
      icon: m.icon,
      tint: m.tint,
    };
  });

  const searchItems: SearchRow[] = allItems.map((i) => {
    const m = categoryMeta(i.category);
    const summary =
      [i.brand, i.model].filter(Boolean).join(" ") || i.description || categoryLabel(i.category);
    return {
      id: i.id,
      name: i.name,
      category: categoryLabel(i.category),
      summary,
      icon: m.icon,
      tint: m.tint,
    };
  });

  return { counts, recent, timeline, searchItems };
}

// ---------- Collection view ----------

export type CollectionRow = {
  key: string;
  title: string;
  subtitle: string;
  href?: string;
  icon: IconKey;
  tint: Tint;
};
export type CollectionData = {
  key: CollectionKey;
  label: string;
  icon: IconKey;
  tint: Tint;
  rows: CollectionRow[];
  available: boolean;
};

function itemRows(
  items: { id: string; name: string; category: string; brand: string | null; model: string | null }[],
): CollectionRow[] {
  return items.map((i) => {
    const m = categoryMeta(i.category);
    return {
      key: i.id,
      title: i.name,
      subtitle: [i.brand, i.model].filter(Boolean).join(" ") || categoryLabel(i.category),
      href: `/library/item/${i.id}`,
      icon: m.icon,
      tint: m.tint,
    };
  });
}

export async function getCollection(
  userId: string,
  key: CollectionKey,
): Promise<CollectionData | null> {
  const meta = COLLECTION_META.find((c) => c.key === key);
  if (!meta) return null;
  const scope = homeScope(userId);
  const iScope = itemScope(userId);
  const base = { key, label: meta.label, icon: meta.icon, tint: meta.tint, available: true };

  switch (key) {
    case "appliances":
    case "systems": {
      const items = await prisma.item.findMany({
        where: {
          home: scope,
          category: { in: key === "appliances" ? APPLIANCE_CATEGORIES : SYSTEM_CATEGORIES },
        },
        orderBy: { name: "asc" },
        select: { id: true, name: true, category: true, brand: true, model: true },
      });
      return { ...base, rows: itemRows(items) };
    }

    case "warranties": {
      const items = await prisma.item.findMany({
        where: { home: scope, warrantyExpiry: { not: null } },
        orderBy: { warrantyExpiry: "asc" },
        select: {
          id: true,
          name: true,
          category: true,
          warrantyExpiry: true,
        },
      });
      const now = Date.now();
      return {
        ...base,
        rows: items.map((i) => {
          const m = categoryMeta(i.category);
          const expiry = i.warrantyExpiry!;
          const expired = expiry.getTime() < now;
          return {
            key: i.id,
            title: i.name,
            subtitle: `${expired ? "Expired" : "Active through"} ${formatDate(expiry)}`,
            href: `/library/item/${i.id}`,
            icon: m.icon,
            tint: m.tint,
          };
        }),
      };
    }

    case "rooms": {
      const rooms = await prisma.room.findMany({
        where: { home: scope },
        orderBy: { name: "asc" },
        include: { _count: { select: { items: true } } },
      });
      return {
        ...base,
        rows: rooms.map((r) => ({
          key: r.id,
          title: r.name,
          subtitle: `${r._count.items} ${r._count.items === 1 ? "thing" : "things"} connected`,
          href: `/library/room/${r.id}`,
          icon: "door-open",
          tint: "wood",
        })),
      };
    }

    case "paint": {
      const rooms = await prisma.room.findMany({
        where: { home: scope, OR: [{ paintColor: { not: null } }, { paintBrand: { not: null } }] },
        orderBy: { name: "asc" },
      });
      return {
        ...base,
        rows: rooms.map((r) => ({
          key: r.id,
          title: r.paintColor ?? `${r.name} paint`,
          subtitle: [r.paintBrand, r.paintFinish ?? r.paintSheen, r.name]
            .filter(Boolean)
            .join(" · "),
          href: `/library/room/${r.id}`,
          icon: "palette",
          tint: "wood",
        })),
      };
    }

    case "projects": {
      const events = await prisma.homeEvent.findMany({
        where: { home: scope, type: "improvement" },
        orderBy: { date: "desc" },
      });
      return {
        ...base,
        rows: events.map((e) => ({
          key: e.id,
          title: e.title,
          subtitle:
            e.description ??
            `Completed ${e.date.toLocaleDateString("en-US", { year: "numeric" })}`,
          icon: "hammer",
          tint: "sage",
        })),
      };
    }

    case "contractors": {
      const providers = await prisma.providerProfile.findMany({
        where: { serviceRequests: { some: { home: scope } } },
        orderBy: { name: "asc" },
      });
      return {
        ...base,
        rows: providers.map((p) => ({
          key: p.id,
          title: p.name,
          subtitle: [p.specialty, p.company].filter(Boolean).join(" · "),
          href: normalizeExternalUrl(p.website),
          icon: "hard-hat",
          tint: "navy",
        })),
      };
    }

    case "manuals": {
      const manuals = await prisma.manual.findMany({
        where: { items: { some: { item: iScope } } },
        orderBy: { title: "asc" },
      });
      return {
        ...base,
        rows: manuals.map((m) => ({
          key: m.id,
          title: m.title,
          subtitle:
            [m.brand, m.model].filter(Boolean).join(" ") ||
            (m.pageCount ? `${m.pageCount} pages` : "Manual"),
          href: normalizeExternalUrl(m.fileUrl ?? m.sourceUrl),
          icon: "book-text",
          tint: "navy",
        })),
      };
    }

    case "receipts": {
      const docs = await prisma.itemDocument.findMany({
        where: receiptWhere(userId),
        orderBy: { createdAt: "desc" },
        include: { item: { select: { name: true } } },
      });
      return {
        ...base,
        rows: docs.map((d) => ({
          key: d.id,
          title: d.name,
          subtitle: `${d.item.name} · ${formatDate(d.createdAt)}`,
          href: normalizeExternalUrl(d.fileUrl),
          icon: "receipt",
          tint: "wood",
        })),
      };
    }

    case "photos": {
      const [items, rooms, docs] = await Promise.all([
        prisma.item.findMany({
          where: { home: scope, photoUrl: { not: null } },
          orderBy: { name: "asc" },
          select: { id: true, name: true, category: true, photoUrl: true },
        }),
        prisma.room.findMany({
          where: { home: scope, photoUrl: { not: null } },
          orderBy: { name: "asc" },
          select: { id: true, name: true, photoUrl: true },
        }),
        prisma.itemDocument.findMany({
          where: { item: iScope, fileType: { startsWith: "image" } },
          orderBy: { createdAt: "desc" },
          include: { item: { select: { name: true } } },
        }),
      ]);
      const rows: CollectionRow[] = [
        ...items.map((i) => ({
          key: `item-${i.id}`,
          title: i.name,
          subtitle: "Item photo",
          href: normalizeExternalUrl(i.photoUrl),
          icon: categoryMeta(i.category).icon,
          tint: categoryMeta(i.category).tint,
        })),
        ...rooms.map((r) => ({
          key: `room-${r.id}`,
          title: r.name,
          subtitle: "Room photo",
          href: normalizeExternalUrl(r.photoUrl),
          icon: "door-open" as IconKey,
          tint: "wood" as Tint,
        })),
        ...docs.map((d) => ({
          key: `doc-${d.id}`,
          title: d.name,
          subtitle: `${d.item.name} · Image`,
          href: normalizeExternalUrl(d.fileUrl),
          icon: "image" as IconKey,
          tint: "sage" as Tint,
        })),
      ];
      return { ...base, rows };
    }

    // No models back these yet, so render a friendly "coming soon" empty state.
    case "videos":
    case "measurements":
      return { ...base, rows: [], available: false };
  }
}

// ---------- Item detail ----------

export type Fact = { label: string; value: string };
export type DocRow = { label: string; meta: string; icon: IconKey; href?: string };
export type MaintRow = { date: string; title: string; by?: string };
export type LibraryItemDetail = {
  id: string;
  name: string;
  icon: IconKey;
  tint: Tint;
  category: string;
  summary: string;
  status?: { label: string; tone: "good" | "attention" | "neutral" };
  room?: { id: string; name: string };
  facts: Fact[];
  documents: DocRow[];
  maintenance: MaintRow[];
  questions: string[];
};

function itemStatus(
  condition: string | null,
  warrantyExpiry: Date | null,
): LibraryItemDetail["status"] {
  const badCondition =
    condition === "poor" || condition === "needs_repair" || condition === "non_functional";
  // Bad condition is the more urgent truth, so it wins over an expired warranty.
  if (badCondition) return { label: "Needs attention", tone: "attention" };
  if (warrantyExpiry && warrantyExpiry.getTime() < Date.now())
    return { label: "Warranty expired", tone: "attention" };
  if (warrantyExpiry) return { label: "Under warranty", tone: "good" };
  if (condition === "excellent" || condition === "good")
    return {
      label: ITEM_CONDITIONS[condition as keyof typeof ITEM_CONDITIONS],
      tone: "good",
    };
  return { label: "On file", tone: "neutral" };
}

function docIcon(name: string, fileType: string | null): IconKey {
  const s = `${name} ${fileType ?? ""}`.toLowerCase();
  if (s.includes("receipt")) return "receipt";
  if (s.includes("warrant")) return "shield-check";
  if (s.includes("image") || s.includes("photo") || s.includes("jpg") || s.includes("png"))
    return "image";
  return "book-text";
}

export async function getItem(userId: string, id: string): Promise<LibraryItemDetail | null> {
  const item = await prisma.item.findFirst({
    where: { id, home: homeScope(userId) },
    include: {
      room: { select: { id: true, name: true } },
      documents: { orderBy: { createdAt: "desc" } },
      manuals: { include: { manual: true } },
      maintenanceTasks: {
        orderBy: { nextDueDate: "asc" },
        include: { logs: { orderBy: { performedAt: "desc" } } },
      },
    },
  });
  if (!item) return null;

  const m = categoryMeta(item.category);

  const facts: Fact[] = [];
  const push = (label: string, value: string | null | undefined) => {
    if (value) facts.push({ label, value });
  };
  push("Manufacturer", item.brand);
  push("Model", item.model);
  push("Model number", item.modelNumber);
  push("Serial number", item.serialNumber);
  push(
    "Purchased",
    item.purchaseDate?.toLocaleDateString("en-US", { year: "numeric", month: "long" }),
  );
  push(
    "Purchase price",
    item.purchasePrice != null ? formatCurrency(item.purchasePrice, { cents: true }) : null,
  );
  if (item.warrantyExpiry) {
    const expired = item.warrantyExpiry.getTime() < Date.now();
    push("Warranty", `${expired ? "Expired" : "Active through"} ${formatDate(item.warrantyExpiry)}`);
  }
  push("Warranty provider", item.warrantyProvider);
  push("Condition", item.condition ? ITEM_CONDITIONS[item.condition as keyof typeof ITEM_CONDITIONS] ?? item.condition : null);
  push("Location", item.room?.name);

  const documents: DocRow[] = [
    ...item.documents.map((d) => ({
      label: d.name,
      meta: [d.fileType?.toUpperCase(), d.fileSize ? `${Math.round(d.fileSize / 1024)} KB` : null]
        .filter(Boolean)
        .join(" · "),
      icon: docIcon(d.name, d.fileType),
      href: normalizeExternalUrl(d.fileUrl),
    })),
    ...item.manuals.map((im) => ({
      label: im.manual.title,
      meta: im.manual.pageCount ? `Manual · ${im.manual.pageCount} pages` : "Manual",
      icon: "book-text" as IconKey,
      href: normalizeExternalUrl(im.manual.fileUrl ?? im.manual.sourceUrl),
    })),
  ];

  const maintenance: MaintRow[] = item.maintenanceTasks
    .flatMap((task) => task.logs.map((log) => ({ task, log })))
    .sort((a, b) => b.log.performedAt.getTime() - a.log.performedAt.getTime())
    .map(({ task, log }) => ({
      date: log.performedAt.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      title: log.notes ? `${task.title}: ${log.notes}` : task.title,
      by: log.performedBy ?? undefined,
    }));

  const summary =
    item.description ||
    `${[item.brand, item.model].filter(Boolean).join(" ")}${item.room ? ` in the ${item.room.name}` : ""}`.trim() ||
    categoryLabel(item.category);

  const questions = [
    `When is my ${item.name} due for service?`,
    `What's the warranty status on my ${item.name}?`,
    `Show me everything about the ${item.name}`,
  ];

  return {
    id: item.id,
    name: item.name,
    icon: m.icon,
    tint: m.tint,
    category: categoryLabel(item.category),
    summary,
    status: itemStatus(item.condition, item.warrantyExpiry),
    room: item.room ? { id: item.room.id, name: item.room.name } : undefined,
    facts,
    documents,
    maintenance,
    questions,
  };
}

// ---------- Room view ----------

export type RoomGroup = {
  label: string;
  icon: IconKey;
  items: { id?: string; label: string; meta: string }[];
};
export type RoomDetail = {
  id: string;
  name: string;
  summary: string;
  photoUrl?: string;
  groups: RoomGroup[];
};

export async function getRoom(userId: string, id: string): Promise<RoomDetail | null> {
  const room = await prisma.room.findFirst({
    where: { id, home: homeScope(userId) },
    include: { items: { orderBy: { name: "asc" } } },
  });
  if (!room) return null;

  const groups: RoomGroup[] = [];

  // One group per item category present, in the schema's category order.
  for (const category of Object.keys(ITEM_CATEGORIES)) {
    const inCategory = room.items.filter((i) => i.category === category);
    if (inCategory.length === 0) continue;
    groups.push({
      label: categoryLabel(category),
      icon: categoryMeta(category).icon,
      items: inCategory.map((i) => ({
        id: i.id,
        label: i.name,
        meta:
          [i.brand, i.model].filter(Boolean).join(" ") ||
          (i.condition
            ? ITEM_CONDITIONS[i.condition as keyof typeof ITEM_CONDITIONS] ?? i.condition
            : "Tracked"),
      })),
    });
  }

  if (room.paintColor || room.paintBrand) {
    groups.push({
      label: "Paint",
      icon: "palette",
      items: [
        {
          label: room.paintColor ?? "Wall color",
          meta: [room.paintBrand, room.paintFinish ?? room.paintSheen].filter(Boolean).join(" · ") || "On file",
        },
      ],
    });
  }

  const roomTypeLabel = ROOM_TYPES[room.roomType as keyof typeof ROOM_TYPES] ?? room.roomType;
  const itemCount = room.items.length;
  const summary =
    room.description ||
    `${roomTypeLabel} · ${itemCount} ${itemCount === 1 ? "thing" : "things"} tracked in this room.`;

  return {
    id: room.id,
    name: room.name,
    summary,
    photoUrl: room.photoUrl ?? undefined,
    groups,
  };
}
