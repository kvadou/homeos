export const HOME_TYPES = {
  single_family: "Single Family",
  townhouse: "Townhouse",
  condo: "Condo",
  apartment: "Apartment",
  duplex: "Duplex",
  mobile_home: "Mobile Home",
  other: "Other",
} as const;

export const ROOM_TYPES = {
  kitchen: "Kitchen",
  living_room: "Living Room",
  bedroom: "Bedroom",
  bathroom: "Bathroom",
  dining_room: "Dining Room",
  office: "Office",
  garage: "Garage",
  basement: "Basement",
  attic: "Attic",
  laundry: "Laundry Room",
  mudroom: "Mudroom",
  pantry: "Pantry",
  closet: "Closet",
  patio: "Patio/Deck",
  yard: "Yard",
  other: "Other",
} as const;

export const ITEM_CATEGORIES = {
  appliance: "Appliance",
  hvac: "HVAC",
  plumbing: "Plumbing",
  electrical: "Electrical",
  furniture: "Furniture",
  electronics: "Electronics",
  outdoor: "Outdoor",
  safety: "Safety & Security",
  structural: "Structural",
  flooring: "Flooring",
  window: "Window & Door",
  lighting: "Lighting",
  other: "Other",
} as const;

/** Single source of truth for what counts as a building "system" vs an
 *  appliance. Both the dashboard health score and the Library collections
 *  must use these — do not redefine category groupings in app code. */
export const SYSTEM_CATEGORY_KEYS = ["hvac", "plumbing", "electrical", "structural"] as const satisfies readonly (keyof typeof ITEM_CATEGORIES)[];
export const APPLIANCE_CATEGORY_KEYS = ["appliance"] as const satisfies readonly (keyof typeof ITEM_CATEGORIES)[];

export const ITEM_CONDITIONS = {
  excellent: "Excellent",
  good: "Good",
  fair: "Fair",
  poor: "Poor",
  needs_repair: "Needs Repair",
  non_functional: "Non-Functional",
} as const;

export const MAINTENANCE_PRIORITIES = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
} as const;

export const MAINTENANCE_STATUSES = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
  skipped: "Skipped",
  overdue: "Overdue",
} as const;

export const SERVICE_REQUEST_STATUSES = {
  pending: "Pending",
  scheduled: "Scheduled",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
} as const;

export type HomeType = keyof typeof HOME_TYPES;
export type RoomType = keyof typeof ROOM_TYPES;
export type ItemCategory = keyof typeof ITEM_CATEGORIES;
export type ItemCondition = keyof typeof ITEM_CONDITIONS;
export type MaintenancePriority = keyof typeof MAINTENANCE_PRIORITIES;
export type MaintenanceStatus = keyof typeof MAINTENANCE_STATUSES;
export type ServiceRequestStatus = keyof typeof SERVICE_REQUEST_STATUSES;

export const NOTIFICATION_TYPES = {
  warranty_expiry: "Warranty Expiry",
  maintenance_due: "Maintenance Due",
  maintenance_overdue: "Maintenance Overdue",
  recall_alert: "Recall Alert",
  system: "System",
} as const;

export type NotificationType = keyof typeof NOTIFICATION_TYPES;

export const WARRANTY_TYPES = {
  manufacturer: "Manufacturer",
  extended: "Extended",
  home_warranty: "Home Warranty",
} as const;

export type WarrantyType = keyof typeof WARRANTY_TYPES;

export const HOME_ROLES = {
  owner: "Owner",
  editor: "Editor",
  viewer: "Viewer",
} as const;

export type HomeRole = keyof typeof HOME_ROLES;

export const INVITATION_STATUSES = {
  pending: "Pending",
  accepted: "Accepted",
  declined: "Declined",
  expired: "Expired",
} as const;

export type InvitationStatus = keyof typeof INVITATION_STATUSES;

export const RECALL_SEVERITIES = {
  low: "Low",
  moderate: "Moderate",
  high: "High",
  critical: "Critical",
} as const;

export type RecallSeverity = keyof typeof RECALL_SEVERITIES;

export const REPAIR_DIFFICULTIES = {
  easy: "Easy - DIY Beginner",
  moderate: "Moderate - DIY Intermediate",
  hard: "Hard - DIY Advanced",
  professional: "Professional Required",
} as const;

export type RepairDifficulty = keyof typeof REPAIR_DIFFICULTIES;

export const PLAN_LIMITS = {
  free:   { homes: 1, items: 25, aiScans: 10, members: 1 },
  pro:    { homes: 5, items: 500, aiScans: 100, members: 3 },
  family: { homes: 10, items: -1, aiScans: -1, members: 10 },
} as const;

export type PlanName = keyof typeof PLAN_LIMITS;

export const PLAN_NAMES = {
  free: "Free",
  pro: "Pro",
  family: "Family",
} as const;

export const SUBSCRIPTION_STATUSES = {
  active: "Active",
  past_due: "Past Due",
  canceled: "Canceled",
  trialing: "Trialing",
} as const;

export type SubscriptionStatus = keyof typeof SUBSCRIPTION_STATUSES;

export const PAYMENT_STATUSES = {
  pending: "Pending",
  processing: "Processing",
  completed: "Completed",
  failed: "Failed",
  refunded: "Refunded",
} as const;

export type PaymentStatus = keyof typeof PAYMENT_STATUSES;
