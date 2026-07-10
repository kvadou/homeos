import Link from "next/link";
import { notFound } from "next/navigation";
import { Edit, Trash2, Package, Calendar, DollarSign, Shield, Tag, Home, ArrowLeft, Wrench, Wifi, Cog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ITEM_CATEGORIES, ITEM_CONDITIONS } from "@homeos/shared";
import { DeleteItemButton } from "@/components/items/delete-item-button";
import { ItemManualsSection } from "@/components/manuals/item-manuals-section";
import { ItemQRCode } from "@/components/items/item-qr-code";
import { ItemRecallBanner } from "@/components/recalls/item-recall-banner";
import { AIPredictions } from "@/components/maintenance/ai-predictions";
import { DeviceDiscovery } from "@/components/smart-home/device-discovery";
import { PartsSection } from "@/components/items/parts-section";

interface Props {
  params: Promise<{ itemId: string }>;
}

export default async function ItemDetailPage({ params }: Props) {
  const { itemId } = await params;
  const user = await requireAuth();

  const item = await prisma.item.findFirst({
    where: {
      id: itemId,
      home: { users: { some: { userId: user.id } } },
    },
    include: {
      room: { select: { id: true, name: true, roomType: true } },
      home: { select: { id: true, name: true } },
      maintenanceTasks: {
        orderBy: { nextDueDate: "asc" },
        take: 10,
      },
      documents: { orderBy: { createdAt: "desc" } },
      manuals: {
        include: {
          manual: {
            include: {
              _count: { select: { chunks: true } },
            },
          },
        },
      },
      recalls: {
        orderBy: { createdAt: "desc" },
      },
      parts: { orderBy: { name: "asc" } },
      _count: { select: { recalls: true } },
    },
  });

  if (!item) notFound();

  const details = [
    { label: "Brand", value: item.brand, icon: Tag },
    { label: "Model", value: item.model },
    { label: "Model Number", value: item.modelNumber },
    { label: "Serial Number", value: item.serialNumber },
    {
      label: "Purchase Date",
      value: item.purchaseDate?.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      icon: Calendar,
    },
    {
      label: "Purchase Price",
      value: item.purchasePrice ? `$${item.purchasePrice.toFixed(2)}` : null,
      icon: DollarSign,
    },
    {
      label: "Warranty Expiry",
      value: item.warrantyExpiry?.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      icon: Shield,
    },
    { label: "Home", value: item.home.name, icon: Home },
    { label: "Room", value: item.room?.name ?? "Unassigned" },
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
        <Link href="/items" className="hover:text-[hsl(var(--foreground))] transition-colors">
          <ArrowLeft className="h-4 w-4 inline mr-1" />
          Items
        </Link>
        <span>/</span>
        <span className="text-[hsl(var(--foreground))]">{item.name}</span>
      </div>

      {/* Recall Warning Banner */}
      <ItemRecallBanner recallCount={item._count.recalls} />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[hsl(var(--muted))]">
            <Package className="h-8 w-8 text-[hsl(var(--muted-foreground))]" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold">{item.name}</h1>
            <p className="mt-1 text-[hsl(var(--muted-foreground))]">
              {item.brand}{item.model ? ` ${item.model}` : ""}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="outline">
                {ITEM_CATEGORIES[item.category as keyof typeof ITEM_CATEGORIES] ?? item.category}
              </Badge>
              {item.condition && (
                <Badge
                  variant={
                    item.condition === "excellent" || item.condition === "good"
                      ? "success"
                      : item.condition === "fair"
                      ? "warning"
                      : "destructive"
                  }
                >
                  {ITEM_CONDITIONS[item.condition as keyof typeof ITEM_CONDITIONS] ?? item.condition}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/items/${item.id}/repair`}>
              <Wrench className="h-4 w-4" />
              Repair Help
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/items/${item.id}/edit`}>
              <Edit className="h-4 w-4" />
              Edit
            </Link>
          </Button>
          <DeleteItemButton itemId={item.id} itemName={item.name} />
        </div>
      </div>

      {/* QR Code */}
      <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
        <div>
      {/* Tabs */}
      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Info</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="predictions">AI Predictions</TabsTrigger>
          <TabsTrigger value="manuals">Manuals</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="parts">
            <Cog className="mr-1 h-4 w-4" />
            Parts
          </TabsTrigger>
          <TabsTrigger value="smart-home">
            <Wifi className="mr-1 h-4 w-4" />
            Smart Home
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card>
            <CardContent className="p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                {details.map(
                  (d) =>
                    d.value && (
                      <div key={d.label}>
                        <p className="text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                          {d.label}
                        </p>
                        <p className="mt-1 font-medium">{d.value}</p>
                      </div>
                    )
                )}
              </div>
              {item.description && (
                <>
                  <Separator className="my-6" />
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                      Description
                    </p>
                    <p className="mt-1 text-sm leading-relaxed">{item.description}</p>
                  </div>
                </>
              )}
              {item.notes && (
                <>
                  <Separator className="my-6" />
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                      Notes
                    </p>
                    <p className="mt-1 text-sm leading-relaxed">{item.notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance">
          <Card>
            <CardContent className="p-6">
              {item.maintenanceTasks.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-[hsl(var(--muted-foreground))]">
                    No maintenance tasks yet. Maintenance features coming soon.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {item.maintenanceTasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="font-medium">{task.title}</p>
                        <p className="text-sm text-[hsl(var(--muted-foreground))]">
                          {task.nextDueDate?.toLocaleDateString() ?? "No due date"}
                        </p>
                      </div>
                      <Badge variant={task.status === "completed" ? "success" : "secondary"}>
                        {task.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictions">
          <Card>
            <CardContent className="p-6">
              <AIPredictions itemId={item.id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manuals">
          <Card>
            <CardContent className="p-6">
              <ItemManualsSection
                itemId={item.id}
                manuals={item.manuals.map((im) => ({
                  id: im.manual.id,
                  title: im.manual.title,
                  brand: im.manual.brand,
                  model: im.manual.model,
                  fileType: im.manual.fileType,
                  pageCount: im.manual.pageCount,
                  createdAt: im.manual.createdAt.toISOString(),
                  _count: im.manual._count,
                }))}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardContent className="p-6">
              {item.documents.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-[hsl(var(--muted-foreground))]">
                    No documents yet. Upload manuals, receipts, or photos.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {item.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="font-medium">{doc.name}</p>
                        <p className="text-sm text-[hsl(var(--muted-foreground))]">
                          {doc.fileType} &middot; {doc.createdAt.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="parts">
          <Card>
            <CardContent className="p-6">
              <PartsSection
                itemId={item.id}
                parts={item.parts.map((p) => ({
                  id: p.id,
                  name: p.name,
                  partNumber: p.partNumber,
                  manufacturer: p.manufacturer,
                  price: p.price,
                  sourceUrl: p.sourceUrl,
                  notes: p.notes,
                  filterSize: p.filterSize,
                  quantity: p.quantity,
                  lastReplacedDate: p.lastReplacedDate?.toISOString() ?? null,
                  replacementInterval: p.replacementInterval,
                }))}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="smart-home">
          <Card>
            <CardContent className="p-6">
              <DeviceDiscovery
                itemId={item.id}
                currentDevice={{
                  smartDeviceId: item.smartDeviceId,
                  smartDeviceType: item.smartDeviceType,
                  smartDeviceMetadata: item.smartDeviceMetadata as Record<string, unknown> | null,
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
        </div>
        <div className="lg:w-64">
          <ItemQRCode itemId={item.id} itemName={item.name} />
        </div>
      </div>
    </div>
  );
}
