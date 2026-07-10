import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import JSZip from "jszip";

function sanitizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9-_ ]/g, "-");
}

export async function GET() {
  try {
    const user = await requireAuth();

    const homes = await prisma.home.findMany({
      where: {
        users: { some: { userId: user.id } },
      },
      orderBy: { name: "asc" },
    });

    if (homes.length === 0) {
      return NextResponse.json(
        { success: false, error: "No homes found" },
        { status: 404 }
      );
    }

    const zip = new JSZip();

    for (const home of homes) {
      const folderName = sanitizeName(home.name);
      const folder = zip.folder(folderName)!;

      const rooms = await prisma.room.findMany({
        where: { homeId: home.id },
        orderBy: { name: "asc" },
      });

      const items = await prisma.item.findMany({
        where: { homeId: home.id },
        include: {
          room: { select: { name: true } },
        },
        orderBy: { name: "asc" },
      });

      const maintenanceTasks = await prisma.maintenanceTask.findMany({
        where: { item: { homeId: home.id } },
        include: {
          item: { select: { id: true, name: true } },
          logs: { orderBy: { performedAt: "desc" } },
        },
        orderBy: { createdAt: "desc" },
      });

      const manuals = await prisma.manual.findMany({
        where: {
          items: { some: { item: { homeId: home.id } } },
        },
        include: {
          items: {
            where: { item: { homeId: home.id } },
            include: { item: { select: { id: true, name: true } } },
          },
        },
      });

      folder.file(
        "home.json",
        JSON.stringify(
          {
            id: home.id,
            name: home.name,
            address: home.address,
            city: home.city,
            state: home.state,
            zipCode: home.zipCode,
            country: home.country,
            homeType: home.homeType,
            yearBuilt: home.yearBuilt,
            squareFeet: home.squareFeet,
            description: home.description,
            createdAt: home.createdAt,
            updatedAt: home.updatedAt,
          },
          null,
          2
        )
      );

      folder.file(
        "rooms.json",
        JSON.stringify(
          rooms.map((r) => ({
            id: r.id,
            name: r.name,
            roomType: r.roomType,
            floor: r.floor,
            description: r.description,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
          })),
          null,
          2
        )
      );

      folder.file(
        "items.json",
        JSON.stringify(
          items.map((item) => ({
            id: item.id,
            name: item.name,
            category: item.category,
            roomName: item.room?.name ?? null,
            brand: item.brand,
            model: item.model,
            serialNumber: item.serialNumber,
            modelNumber: item.modelNumber,
            purchaseDate: item.purchaseDate,
            purchasePrice: item.purchasePrice,
            warrantyExpiry: item.warrantyExpiry,
            warrantyProvider: item.warrantyProvider,
            warrantyType: item.warrantyType,
            warrantyNotes: item.warrantyNotes,
            condition: item.condition,
            description: item.description,
            notes: item.notes,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
          })),
          null,
          2
        )
      );

      folder.file(
        "maintenance.json",
        JSON.stringify(
          maintenanceTasks.map((task) => ({
            id: task.id,
            itemName: task.item.name,
            title: task.title,
            description: task.description,
            frequency: task.frequency,
            nextDueDate: task.nextDueDate,
            priority: task.priority,
            status: task.status,
            createdAt: task.createdAt,
            updatedAt: task.updatedAt,
            logs: task.logs.map((log) => ({
              id: log.id,
              notes: log.notes,
              cost: log.cost,
              performedAt: log.performedAt,
              performedBy: log.performedBy,
            })),
          })),
          null,
          2
        )
      );

      folder.file(
        "manuals.json",
        JSON.stringify(
          manuals.map((manual) => ({
            id: manual.id,
            title: manual.title,
            brand: manual.brand,
            model: manual.model,
            fileUrl: manual.fileUrl,
            sourceUrl: manual.sourceUrl,
            fileType: manual.fileType,
            pageCount: manual.pageCount,
            createdAt: manual.createdAt,
            updatedAt: manual.updatedAt,
            linkedItems: manual.items.map((link) => ({
              itemId: link.item.id,
              itemName: link.item.name,
            })),
          })),
          null,
          2
        )
      );
    }

    const zipData = await zip.generateAsync({ type: "arraybuffer" });

    return new NextResponse(zipData, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="homeos-export-all.zip"`,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to export data" },
      { status: 500 }
    );
  }
}
