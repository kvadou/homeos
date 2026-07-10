import Link from "next/link";
import { Plus, Package, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ITEM_CATEGORIES, ITEM_CONDITIONS } from "@homeos/shared";
import { CategoryFilter } from "@/components/items/category-filter";
import { ItemsHeader } from "@/components/items/items-header";

interface Props {
  searchParams: Promise<{ category?: string; homeId?: string; roomId?: string }>;
}

export default async function ItemsPage({ searchParams }: Props) {
  const params = await searchParams;
  const user = await requireAuth();

  const items = await prisma.item.findMany({
    where: {
      home: { users: { some: { userId: user.id } } },
      ...(params.homeId && { homeId: params.homeId }),
      ...(params.roomId && { roomId: params.roomId }),
      ...(params.category && { category: params.category }),
    },
    include: {
      room: { select: { id: true, name: true } },
      home: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <ItemsHeader
        itemCount={items.length}
        items={items.map((i) => ({ id: i.id, name: i.name, brand: i.brand }))}
      />

      <CategoryFilter activeCategory={params.category} />

      {items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16">
            <Package className="h-12 w-12 text-[hsl(var(--muted-foreground))]" />
            <h3 className="mt-4 font-heading text-lg font-semibold">No items found</h3>
            <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
              {params.category ? "Try a different filter or add new items." : "Add your first item to get started."}
            </p>
            <Button className="mt-4" asChild>
              <Link href="/items/new">
                <Plus className="h-4 w-4" />
                Add Item
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Link key={item.id} href={`/items/${item.id}`}>
              <Card className="h-full transition-all duration-200 hover:shadow-md hover:border-[hsl(var(--ring))]/30 cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--muted))]">
                      <Package className="h-6 w-6 text-[hsl(var(--muted-foreground))]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold truncate">{item.name}</h3>
                      <p className="text-sm text-[hsl(var(--muted-foreground))]">
                        {item.brand}{item.model ? ` ${item.model}` : ""}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <Badge variant="outline" className="text-xs">
                          {ITEM_CATEGORIES[item.category as keyof typeof ITEM_CATEGORIES] ?? item.category}
                        </Badge>
                        {item.room && (
                          <Badge variant="secondary" className="text-xs">
                            {item.room.name}
                          </Badge>
                        )}
                        {item.condition && (
                          <Badge
                            variant={
                              item.condition === "excellent" || item.condition === "good"
                                ? "success"
                                : item.condition === "fair"
                                ? "warning"
                                : "destructive"
                            }
                            className="text-xs"
                          >
                            {ITEM_CONDITIONS[item.condition as keyof typeof ITEM_CONDITIONS] ?? item.condition}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
