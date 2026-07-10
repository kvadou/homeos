"use client";

import { format, isPast } from "date-fns";
import {
  Home,
  MapPin,
  Calendar,
  Ruler,
  DoorOpen,
  Package,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Wrench,
  Clock,
  AlertTriangle,
  ClipboardList,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface PassportWarranty {
  expiry: string | null;
  provider: string | null;
  type: string | null;
  notes: string | null;
}

interface MaintenanceLog {
  notes: string | null;
  cost: number | null;
  performedAt: string;
  performedBy: string | null;
}

interface MaintenanceTask {
  id: string;
  title: string;
  description: string | null;
  frequency: string | null;
  nextDueDate: string | null;
  priority: string | null;
  status: string;
  recentLogs: MaintenanceLog[];
}

interface PassportRoom {
  id: string;
  name: string;
  roomType: string;
  floor: number | null;
  description: string | null;
}

interface PassportItem {
  id: string;
  name: string;
  category: string;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  modelNumber: string | null;
  purchaseDate: string | null;
  purchasePrice: number | null;
  condition: string | null;
  description: string | null;
  notes: string | null;
  room: { id: string; name: string } | null;
  warranty: PassportWarranty;
  maintenance: MaintenanceTask[];
}

interface ServiceRequestProvider {
  name: string;
  company: string | null;
  specialty: string;
}

interface PassportServiceRequest {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string | null;
  scheduledAt: string | null;
  completedAt: string | null;
  cost: number | null;
  provider: ServiceRequestProvider | null;
}

interface PassportSummary {
  totalRooms: number;
  totalItems: number;
  itemsWithWarranty: number;
  activeWarranties: number;
  pendingMaintenance: number;
  activeServiceRequests: number;
}

export interface PassportData {
  generatedAt: string;
  property: {
    name: string;
    address: string | null;
    city: string | null;
    state: string | null;
    zipCode: string | null;
    country: string | null;
    homeType: string | null;
    yearBuilt: number | null;
    squareFeet: number | null;
    description: string | null;
  };
  rooms: PassportRoom[];
  items: PassportItem[];
  serviceRequests: PassportServiceRequest[];
  summary: PassportSummary;
}

interface PassportViewerProps {
  data: PassportData;
  branded?: boolean;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  try {
    return format(new Date(dateStr), "MMM d, yyyy");
  } catch {
    return null;
  }
}

function getStatusBadgeVariant(status: string) {
  switch (status.toLowerCase()) {
    case "completed":
      return "success" as const;
    case "overdue":
    case "cancelled":
      return "destructive" as const;
    case "pending":
    case "scheduled":
    case "in_progress":
      return "warning" as const;
    default:
      return "secondary" as const;
  }
}

function getConditionBadgeVariant(condition: string | null) {
  switch (condition?.toLowerCase()) {
    case "excellent":
    case "good":
      return "success" as const;
    case "fair":
      return "warning" as const;
    case "poor":
      return "destructive" as const;
    default:
      return "secondary" as const;
  }
}

function getPriorityBadgeVariant(priority: string | null) {
  switch (priority?.toLowerCase()) {
    case "high":
    case "urgent":
      return "destructive" as const;
    case "medium":
      return "warning" as const;
    case "low":
      return "secondary" as const;
    default:
      return "secondary" as const;
  }
}

export function PassportViewer({ data, branded = false }: PassportViewerProps) {
  const { property, rooms, items, serviceRequests, summary } = data;

  // Group items by room
  const itemsByRoom = new Map<string, PassportItem[]>();
  const unassignedItems: PassportItem[] = [];

  items.forEach((item) => {
    if (item.room) {
      const existing = itemsByRoom.get(item.room.id) || [];
      existing.push(item);
      itemsByRoom.set(item.room.id, existing);
    } else {
      unassignedItems.push(item);
    }
  });

  // Items with active warranties
  const warrantyItems = items.filter(
    (item) => item.warranty.expiry
  );

  // Items with pending maintenance
  const maintenanceItems = items.filter(
    (item) => item.maintenance.some((t) => t.status !== "completed")
  );

  return (
    <div className="space-y-8 print:space-y-6">
      {/* Property Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-500/10">
              <Home className="h-5 w-5 text-teal-500" />
            </div>
            <div>
              <CardTitle className="text-xl">Property Overview</CardTitle>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                {property.name}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {property.address && (
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--muted-foreground))]" />
                <div>
                  <p className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                    Address
                  </p>
                  <p className="text-sm">
                    {property.address}
                    {property.city && `, ${property.city}`}
                    {property.state && `, ${property.state}`}
                    {property.zipCode && ` ${property.zipCode}`}
                  </p>
                </div>
              </div>
            )}
            {property.homeType && (
              <div className="flex items-start gap-2">
                <Home className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--muted-foreground))]" />
                <div>
                  <p className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                    Type
                  </p>
                  <p className="text-sm capitalize">
                    {property.homeType.replace(/_/g, " ")}
                  </p>
                </div>
              </div>
            )}
            {property.yearBuilt && (
              <div className="flex items-start gap-2">
                <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--muted-foreground))]" />
                <div>
                  <p className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                    Year Built
                  </p>
                  <p className="text-sm">{property.yearBuilt}</p>
                </div>
              </div>
            )}
            {property.squareFeet && (
              <div className="flex items-start gap-2">
                <Ruler className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--muted-foreground))]" />
                <div>
                  <p className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                    Square Feet
                  </p>
                  <p className="text-sm">
                    {property.squareFeet.toLocaleString()} sq ft
                  </p>
                </div>
              </div>
            )}
          </div>
          {property.description && (
            <div className="mt-4">
              <p className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                Description
              </p>
              <p className="mt-1 text-sm">{property.description}</p>
            </div>
          )}
          {/* Summary Stats */}
          <Separator className="my-4" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-teal-600">
                {summary.totalRooms}
              </p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                Rooms
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-teal-600">
                {summary.totalItems}
              </p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                Items
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-teal-600">
                {summary.activeWarranties}
              </p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                Active Warranties
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-teal-600">
                {summary.itemsWithWarranty}
              </p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                Total Warranties
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-600">
                {summary.pendingMaintenance}
              </p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                Pending Tasks
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {summary.activeServiceRequests}
              </p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                Service Requests
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rooms */}
      {rooms.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-500/10">
                <DoorOpen className="h-5 w-5 text-teal-500" />
              </div>
              <CardTitle className="text-xl">
                Rooms ({rooms.length})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {rooms.map((room) => {
                const roomItems = itemsByRoom.get(room.id) || [];
                return (
                  <div
                    key={room.id}
                    className="rounded-lg border border-[hsl(var(--border))] p-4"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{room.name}</h4>
                      <Badge variant="secondary" className="text-[10px]">
                        {room.roomType.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    {room.floor && (
                      <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                        Floor {room.floor}
                      </p>
                    )}
                    {room.description && (
                      <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                        {room.description}
                      </p>
                    )}
                    <p className="mt-2 text-xs font-medium text-teal-600">
                      {roomItems.length} item{roomItems.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Items by Room */}
      {items.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-500/10">
                <Package className="h-5 w-5 text-teal-500" />
              </div>
              <CardTitle className="text-xl">
                Items ({items.length})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {rooms.map((room) => {
              const roomItems = itemsByRoom.get(room.id);
              if (!roomItems || roomItems.length === 0) return null;
              return (
                <div key={room.id}>
                  <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[hsl(var(--muted-foreground))]">
                    <DoorOpen className="h-4 w-4" />
                    {room.name}
                  </h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {roomItems.map((item) => (
                      <ItemCard key={item.id} item={item} />
                    ))}
                  </div>
                </div>
              );
            })}
            {unassignedItems.length > 0 && (
              <div>
                <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[hsl(var(--muted-foreground))]">
                  <Package className="h-4 w-4" />
                  Unassigned Items
                </h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  {unassignedItems.map((item) => (
                    <ItemCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Warranties */}
      {warrantyItems.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-500/10">
                <Shield className="h-5 w-5 text-teal-500" />
              </div>
              <CardTitle className="text-xl">
                Warranties ({warrantyItems.length})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {warrantyItems.map((item) => {
                const isActive =
                  item.warranty.expiry &&
                  !isPast(new Date(item.warranty.expiry));
                return (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 rounded-lg border border-[hsl(var(--border))] p-4"
                  >
                    {isActive ? (
                      <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                    ) : (
                      <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{item.name}</p>
                        <Badge
                          variant={isActive ? "success" : "destructive"}
                          className="text-[10px]"
                        >
                          {isActive ? "Active" : "Expired"}
                        </Badge>
                      </div>
                      <div className="mt-1 space-y-0.5 text-xs text-[hsl(var(--muted-foreground))]">
                        {item.warranty.expiry && (
                          <p>
                            Expires: {formatDate(item.warranty.expiry)}
                          </p>
                        )}
                        {item.warranty.provider && (
                          <p>Provider: {item.warranty.provider}</p>
                        )}
                        {item.warranty.type && (
                          <p>Type: {item.warranty.type}</p>
                        )}
                        {item.warranty.notes && (
                          <p className="mt-1 italic">
                            {item.warranty.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Maintenance Status */}
      {maintenanceItems.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-500/10">
                <Wrench className="h-5 w-5 text-teal-500" />
              </div>
              <CardTitle className="text-xl">Maintenance Status</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {maintenanceItems.map((item) => (
                <div key={item.id}>
                  <h4 className="mb-2 text-sm font-semibold">{item.name}</h4>
                  <div className="space-y-2">
                    {item.maintenance
                      .filter((t) => t.status !== "completed")
                      .map((task) => {
                        const isOverdue =
                          task.nextDueDate &&
                          isPast(new Date(task.nextDueDate));
                        return (
                          <div
                            key={task.id}
                            className={`flex items-start gap-3 rounded-lg border p-3 ${
                              isOverdue
                                ? "border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/30"
                                : "border-[hsl(var(--border))]"
                            }`}
                          >
                            {isOverdue ? (
                              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                            ) : (
                              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--muted-foreground))]" />
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium">
                                  {task.title}
                                </p>
                                <Badge
                                  variant={getPriorityBadgeVariant(
                                    task.priority
                                  )}
                                  className="text-[10px]"
                                >
                                  {task.priority || "medium"}
                                </Badge>
                              </div>
                              {task.description && (
                                <p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">
                                  {task.description}
                                </p>
                              )}
                              <div className="mt-1 flex flex-wrap gap-2 text-xs text-[hsl(var(--muted-foreground))]">
                                {task.frequency && (
                                  <span>Frequency: {task.frequency}</span>
                                )}
                                {task.nextDueDate && (
                                  <span>
                                    Due: {formatDate(task.nextDueDate)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Service Requests */}
      {serviceRequests.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-500/10">
                <ClipboardList className="h-5 w-5 text-teal-500" />
              </div>
              <CardTitle className="text-xl">
                Service Requests ({serviceRequests.length})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {serviceRequests.map((sr) => (
                <div
                  key={sr.id}
                  className="rounded-lg border border-[hsl(var(--border))] p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{sr.title}</p>
                    <Badge
                      variant={getStatusBadgeVariant(sr.status)}
                      className="text-[10px]"
                    >
                      {sr.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  {sr.description && (
                    <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                      {sr.description}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-[hsl(var(--muted-foreground))]">
                    {sr.provider && (
                      <span>
                        Provider: {sr.provider.name}
                        {sr.provider.company && ` (${sr.provider.company})`}
                      </span>
                    )}
                    {sr.scheduledAt && (
                      <span>Scheduled: {formatDate(sr.scheduledAt)}</span>
                    )}
                    {sr.completedAt && (
                      <span>Completed: {formatDate(sr.completedAt)}</span>
                    )}
                    {sr.cost != null && (
                      <span>Cost: ${sr.cost.toLocaleString()}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Branded footer */}
      {branded && (
        <div className="flex items-center justify-center py-6 text-center print:py-4">
          <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
            <Home className="h-4 w-4 text-teal-500" />
            <span>
              Generated by{" "}
              <span className="font-semibold text-[hsl(var(--foreground))]">
                HomeOS
              </span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function ItemCard({ item }: { item: PassportItem }) {
  const hasWarranty = !!item.warranty.expiry;
  const warrantyActive =
    hasWarranty && !isPast(new Date(item.warranty.expiry!));
  const pendingTasks = item.maintenance.filter(
    (t) => t.status !== "completed"
  );

  return (
    <div className="rounded-lg border border-[hsl(var(--border))] p-4">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{item.name}</p>
          <div className="mt-0.5 flex flex-wrap gap-1">
            <Badge variant="outline" className="text-[10px]">
              {item.category}
            </Badge>
            {item.condition && (
              <Badge
                variant={getConditionBadgeVariant(item.condition)}
                className="text-[10px]"
              >
                {item.condition}
              </Badge>
            )}
          </div>
        </div>
        <div className="ml-2 flex shrink-0 gap-1">
          {hasWarranty && (
            warrantyActive ? (
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
            ) : (
              <ShieldAlert className="h-4 w-4 text-red-400" />
            )
          )}
          {pendingTasks.length > 0 && (
            <Wrench className="h-4 w-4 text-amber-500" />
          )}
        </div>
      </div>
      <div className="mt-2 space-y-0.5 text-xs text-[hsl(var(--muted-foreground))]">
        {item.brand && <p>Brand: {item.brand}</p>}
        {item.model && <p>Model: {item.model}</p>}
        {item.serialNumber && <p>Serial: {item.serialNumber}</p>}
        {item.purchaseDate && (
          <p>Purchased: {formatDate(item.purchaseDate)}</p>
        )}
        {item.purchasePrice != null && (
          <p>Price: ${item.purchasePrice.toLocaleString()}</p>
        )}
      </div>
    </div>
  );
}
