import {
  Refrigerator,
  Wind,
  Droplet,
  Zap,
  Home,
  Video,
  Trees,
  ShieldCheck,
  Waves,
  DoorOpen,
  Lightbulb,
  Package,
  Hammer,
  Wrench,
  Palette,
  HardHat,
  Image as ImageIcon,
  Receipt,
  BookText,
  Ruler,
  type LucideIcon,
} from "lucide-react";

// Data rows carry an icon *key* (a string), never a component, so loaders stay
// serializable and the same shape works in server and client components.
export const ICONS = {
  refrigerator: Refrigerator,
  wind: Wind,
  droplet: Droplet,
  zap: Zap,
  home: Home,
  video: Video,
  trees: Trees,
  "shield-check": ShieldCheck,
  waves: Waves,
  "door-open": DoorOpen,
  lightbulb: Lightbulb,
  package: Package,
  hammer: Hammer,
  wrench: Wrench,
  palette: Palette,
  "hard-hat": HardHat,
  image: ImageIcon,
  receipt: Receipt,
  "book-text": BookText,
  ruler: Ruler,
} satisfies Record<string, LucideIcon>;

export type IconKey = keyof typeof ICONS;
export type Tint = "sage" | "navy" | "wood";

export type CollectionKey =
  | "appliances"
  | "systems"
  | "rooms"
  | "projects"
  | "paint"
  | "contractors"
  | "photos"
  | "receipts"
  | "manuals"
  | "videos"
  | "measurements"
  | "warranties";

export const tintClasses: Record<Tint, string> = {
  sage: "bg-sage/15 text-sage-foreground",
  navy: "bg-primary/10 text-primary",
  wood: "bg-wood/20 text-wood-foreground",
};

export const COLLECTION_META: {
  key: CollectionKey;
  label: string;
  icon: IconKey;
  tint: Tint;
}[] = [
  { key: "appliances", label: "Appliances", icon: "refrigerator", tint: "sage" },
  { key: "systems", label: "Systems", icon: "wind", tint: "navy" },
  { key: "rooms", label: "Rooms", icon: "door-open", tint: "wood" },
  { key: "projects", label: "Projects", icon: "hammer", tint: "sage" },
  { key: "paint", label: "Paint", icon: "palette", tint: "wood" },
  { key: "contractors", label: "Contractors", icon: "hard-hat", tint: "navy" },
  { key: "photos", label: "Photos", icon: "image", tint: "sage" },
  { key: "receipts", label: "Receipts", icon: "receipt", tint: "wood" },
  { key: "manuals", label: "Manuals", icon: "book-text", tint: "navy" },
  { key: "videos", label: "Videos", icon: "video", tint: "sage" },
  { key: "measurements", label: "Measurements", icon: "ruler", tint: "wood" },
  { key: "warranties", label: "Warranties", icon: "shield-check", tint: "navy" },
];

// Item icon + tint derived from its category (schema uses ITEM_CATEGORIES keys).
const CATEGORY_META: Record<string, { icon: IconKey; tint: Tint }> = {
  appliance: { icon: "refrigerator", tint: "sage" },
  hvac: { icon: "wind", tint: "navy" },
  plumbing: { icon: "droplet", tint: "wood" },
  electrical: { icon: "zap", tint: "navy" },
  furniture: { icon: "home", tint: "wood" },
  electronics: { icon: "video", tint: "navy" },
  outdoor: { icon: "trees", tint: "sage" },
  safety: { icon: "shield-check", tint: "navy" },
  structural: { icon: "home", tint: "sage" },
  flooring: { icon: "waves", tint: "wood" },
  window: { icon: "door-open", tint: "wood" },
  lighting: { icon: "lightbulb", tint: "wood" },
  other: { icon: "package", tint: "sage" },
};

export function categoryMeta(category: string): { icon: IconKey; tint: Tint } {
  return CATEGORY_META[category] ?? { icon: "package", tint: "sage" };
}

export function LibraryIcon({
  name,
  className,
  strokeWidth = 1.75,
}: {
  name: IconKey;
  className?: string;
  strokeWidth?: number;
}) {
  const Icon = ICONS[name] ?? Package;
  return <Icon className={className} strokeWidth={strokeWidth} />;
}
