import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

function formatICalDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function mapStatusToIcal(status: string): string {
  switch (status) {
    case "completed":
      return "COMPLETED";
    case "in_progress":
      return "IN-PROCESS";
    case "overdue":
      return "NEEDS-ACTION";
    default:
      return "NEEDS-ACTION";
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return new Response("Unauthorized", { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { calendarToken: token },
  });

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const tasks = await prisma.maintenanceTask.findMany({
    where: {
      nextDueDate: { not: null },
      item: {
        home: { users: { some: { userId: user.id } } },
      },
    },
    include: {
      item: {
        select: {
          name: true,
          home: { select: { name: true } },
        },
      },
    },
  });

  const events = tasks
    .map((task) => {
      const dtstart = formatICalDate(task.nextDueDate!);
      const summary = escapeICalText(task.title);
      const descParts: string[] = [];
      if (task.description) descParts.push(task.description);
      descParts.push(`Item: ${task.item.name}`);
      descParts.push(`Home: ${task.item.home.name}`);
      const description = escapeICalText(descParts.join("\n"));
      const status = mapStatusToIcal(task.status);

      return [
        "BEGIN:VEVENT",
        `UID:${task.id}@homeos`,
        `DTSTART;VALUE=DATE:${dtstart}`,
        `SUMMARY:${summary}`,
        `DESCRIPTION:${description}`,
        `STATUS:${status}`,
        "END:VEVENT",
      ].join("\r\n");
    })
    .join("\r\n");

  const calendar = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//HomeOS//Maintenance Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:HomeOS Maintenance",
    events,
    "END:VCALENDAR",
  ].join("\r\n");

  return new Response(calendar, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="homeos-maintenance.ics"',
    },
  });
}
