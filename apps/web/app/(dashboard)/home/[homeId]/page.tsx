import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus, Home, Package, DoorOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ROOM_TYPES, HOME_TYPES, ITEM_CONDITIONS } from "@homeos/shared";
import { DeleteHomeButton } from "@/components/homes/delete-home-button";
import { AddRoomDialog } from "@/components/rooms/add-room-dialog";
import { PaintInfo } from "@/components/rooms/paint-info";
import { HomeValueCard } from "@/components/homes/home-value-card";

interface Props {
  params: Promise<{ homeId: string }>;
}

export default async function HomeDetailPage({ params }: Props) {
  const { homeId } = await params;
  const user = await requireAuth();

  const home = await prisma.home.findFirst({
    where: {
      id: homeId,
      users: { some: { userId: user.id } },
    },
    include: {
      rooms: {
        include: {
          _count: { select: { items: true } },
        },
        orderBy: { name: "asc" },
      },
      items: {
        include: {
          room: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      _count: {
        select: { rooms: true, items: true },
      },
    },
  });

  if (!home) notFound();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">{home.name}</h1>
          <p className="mt-1 text-[hsl(var(--muted-foreground))]">
            {[home.address, home.city, home.state].filter(Boolean).join(", ")}
            {home.homeType && ` · ${HOME_TYPES[home.homeType as keyof typeof HOME_TYPES] ?? home.homeType}`}
          </p>
        </div>
        <div className="flex gap-2">
          <DeleteHomeButton homeId={home.id} homeName={home.name} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500/10">
              <DoorOpen className="h-5 w-5 text-teal-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{home._count.rooms}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Rooms</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <Package className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{home._count.items}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Items</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <Home className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{home.yearBuilt ?? "—"}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Year Built</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Home Value */}
      {home.address && home.city && home.state && home.zipCode && (
        <HomeValueCard
          homeId={home.id}
          initialValue={home.estimatedValue}
          initialSource={home.lastValuationSource}
          initialDate={home.lastValuationDate?.toISOString() ?? null}
        />
      )}

      {/* Rooms */}
      <div>
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xl font-semibold">Rooms</h2>
          <AddRoomDialog homeId={home.id} />
        </div>
        {home.rooms.length === 0 ? (
          <Card className="mt-4">
            <CardContent className="flex flex-col items-center py-12">
              <DoorOpen className="h-10 w-10 text-[hsl(var(--muted-foreground))]" />
              <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                No rooms yet. Add your first room to organize your items.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {home.rooms.map((room) => (
              <Card key={room.id} className="transition-all hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{room.name}</h3>
                      <p className="text-sm text-[hsl(var(--muted-foreground))]">
                        {ROOM_TYPES[room.roomType as keyof typeof ROOM_TYPES] ?? room.roomType}
                      </p>
                    </div>
                    <Badge variant="secondary">{room._count.items} items</Badge>
                  </div>
                  {room.description && (
                    <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))] line-clamp-2">
                      {room.description}
                    </p>
                  )}
                  <div className="mt-3 border-t border-[hsl(var(--border))] pt-3">
                    <PaintInfo
                      roomId={room.id}
                      paint={{
                        paintBrand: room.paintBrand,
                        paintColor: room.paintColor,
                        paintFinish: room.paintFinish,
                        paintSheen: room.paintSheen,
                        paintPurchaseDate: room.paintPurchaseDate?.toISOString() ?? null,
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Recent Items */}
      <div>
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xl font-semibold">Recent Items</h2>
          <Button size="sm" asChild>
            <Link href={`/items/new?homeId=${home.id}`}>
              <Plus className="h-4 w-4" />
              Add Item
            </Link>
          </Button>
        </div>
        {home.items.length === 0 ? (
          <Card className="mt-4">
            <CardContent className="flex flex-col items-center py-12">
              <Package className="h-10 w-10 text-[hsl(var(--muted-foreground))]" />
              <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                No items yet. Add items to start tracking your home inventory.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {home.items.map((item) => (
              <Link key={item.id} href={`/items/${item.id}`}>
                <Card className="transition-all hover:shadow-md cursor-pointer">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--muted))]">
                      <Package className="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-medium truncate">{item.name}</h3>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        {item.brand && `${item.brand} · `}
                        {item.room?.name ?? "Unassigned"}
                      </p>
                    </div>
                    {item.condition && (
                      <Badge
                        variant={
                          item.condition === "excellent" || item.condition === "good"
                            ? "success"
                            : item.condition === "fair"
                            ? "warning"
                            : "destructive"
                        }
                        className="shrink-0"
                      >
                        {ITEM_CONDITIONS[item.condition as keyof typeof ITEM_CONDITIONS] ?? item.condition}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
