import { NextRequest } from "next/server";
import { streamText, tool } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  buildHomeAssistantPrompt,
  searchManualChunks,
} from "@homeos/ai/rag";
import { DEFAULT_MODEL } from "@homeos/ai";
import { executeHomeQueryTool } from "@homeos/ai/home-queries";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();

    const { messages, sessionId, homeId } = body as {
      messages: Array<{ role: string; content: string }>;
      sessionId?: string;
      homeId?: string;
    };

    if (!messages || messages.length === 0) {
      return Response.json(
        { success: false, error: "Messages are required" },
        { status: 400 }
      );
    }

    const lastUserMessage = [...messages]
      .reverse()
      .find((m) => m.role === "user");
    if (!lastUserMessage) {
      return Response.json(
        { success: false, error: "No user message found" },
        { status: 400 }
      );
    }

    // Resolve or create session
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      const session = await prisma.chatSession.create({
        data: {
          userId: user.id,
          homeId: homeId || null,
          title: lastUserMessage.content.slice(0, 100),
        },
      });
      currentSessionId = session.id;
    } else {
      // Verify session belongs to user
      const session = await prisma.chatSession.findFirst({
        where: { id: currentSessionId, userId: user.id },
      });
      if (!session) {
        return Response.json(
          { success: false, error: "Session not found" },
          { status: 404 }
        );
      }
    }

    // Build system prompt with home context
    let systemPrompt =
      "You are HomeOS, a helpful home assistant. You help homeowners manage and maintain their homes.";
    const resolvedHomeId = homeId || (await getSessionHomeId(currentSessionId));

    if (resolvedHomeId) {
      const home = await prisma.home.findFirst({
        where: {
          id: resolvedHomeId,
          users: { some: { userId: user.id } },
        },
        include: {
          rooms: { select: { name: true, roomType: true } },
          items: {
            select: {
              name: true,
              category: true,
              brand: true,
              model: true,
              room: { select: { name: true } },
            },
          },
        },
      });

      if (home) {
        // Search for relevant manual context
        let relevantChunks: Awaited<ReturnType<typeof searchManualChunks>> = [];
        try {
          relevantChunks = await searchManualChunks(
            prisma,
            lastUserMessage.content,
            3
          );
        } catch {
          // RAG search may fail if no embeddings exist yet
        }

        systemPrompt = buildHomeAssistantPrompt(
          {
            homeName: home.name,
            rooms: home.rooms,
            items: home.items.map((i) => ({
              ...i,
              roomName: i.room?.name ?? null,
            })),
          },
          relevantChunks
        );
      }
    }

    // Add tool usage instructions to system prompt when home context is available
    if (resolvedHomeId) {
      systemPrompt +=
        "\n\nYou have access to tools that can query the homeowner's data. Use these tools to answer questions about their items, maintenance history, warranties, spending, and service providers. Always use tools to look up real data rather than guessing.";
    }

    // Save user message to DB
    await prisma.chatMessage.create({
      data: {
        sessionId: currentSessionId,
        role: "user",
        content: lastUserMessage.content,
      },
    });

    // Build tools for Vercel AI SDK
    const homeQueryTools = resolvedHomeId
      ? buildVercelAITools(user.id, resolvedHomeId)
      : {};

    // Stream response using Vercel AI SDK
    const result = streamText({
      model: anthropic(DEFAULT_MODEL),
      system: systemPrompt,
      messages: messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      tools: homeQueryTools,
      maxSteps: 3,
      maxTokens: 4096,
      async onFinish({ text }) {
        // Save assistant response to DB
        await prisma.chatMessage.create({
          data: {
            sessionId: currentSessionId!,
            role: "assistant",
            content: text,
          },
        });

        // Update session title if it's the first exchange
        const messageCount = await prisma.chatMessage.count({
          where: { sessionId: currentSessionId! },
        });
        if (messageCount <= 2) {
          await prisma.chatSession.update({
            where: { id: currentSessionId! },
            data: {
              title: lastUserMessage.content.slice(0, 100),
            },
          });
        }
      },
    });

    return result.toDataStreamResponse({
      headers: {
        "X-Session-Id": currentSessionId,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    console.error("Chat API error:", error);
    return Response.json(
      { success: false, error: "Failed to process chat" },
      { status: 500 }
    );
  }
}

function buildVercelAITools(userId: string, homeId: string) {
  return {
    search_items: tool({
      description:
        "Search for items in the home by name, category, brand, model, or room. Returns matching items with details.",
      parameters: z.object({
        query: z
          .string()
          .optional()
          .describe("Search term to match against item name, brand, or model"),
        category: z
          .string()
          .optional()
          .describe("Filter by category (e.g. appliance, furniture, electronics)"),
        room: z.string().optional().describe("Filter by room name"),
        brand: z.string().optional().describe("Filter by brand name"),
      }),
      execute: async (params) => {
        return executeHomeQueryTool("search_items", params, prisma, userId, homeId);
      },
    }),
    get_maintenance_history: tool({
      description:
        "Get maintenance logs with optional filters. Shows completed maintenance tasks, costs, dates, and who performed the work.",
      parameters: z.object({
        startDate: z
          .string()
          .optional()
          .describe("Start date filter (ISO format, e.g. 2024-01-01)"),
        endDate: z.string().optional().describe("End date filter (ISO format)"),
        itemName: z
          .string()
          .optional()
          .describe("Filter by item name (partial match)"),
        minCost: z.number().optional().describe("Minimum cost filter"),
        maxCost: z.number().optional().describe("Maximum cost filter"),
      }),
      execute: async (params) => {
        return executeHomeQueryTool(
          "get_maintenance_history",
          params,
          prisma,
          userId,
          homeId
        );
      },
    }),
    get_warranty_status: tool({
      description:
        "Get warranty information for items. Can filter to show only items with warranties expiring soon.",
      parameters: z.object({
        expiringWithinDays: z
          .number()
          .optional()
          .describe("Show warranties expiring within this many days from now"),
        expired: z
          .boolean()
          .optional()
          .describe("If true, show only expired warranties"),
        active: z
          .boolean()
          .optional()
          .describe("If true, show only active (non-expired) warranties"),
      }),
      execute: async (params) => {
        return executeHomeQueryTool(
          "get_warranty_status",
          params,
          prisma,
          userId,
          homeId
        );
      },
    }),
    get_spending_summary: tool({
      description:
        "Get a summary of spending on items and maintenance. Can group by category or time period.",
      parameters: z.object({
        startDate: z
          .string()
          .optional()
          .describe("Start date for spending period (ISO format)"),
        endDate: z
          .string()
          .optional()
          .describe("End date for spending period (ISO format)"),
        groupBy: z
          .enum(["category", "room", "month"])
          .optional()
          .describe("How to group the spending data"),
        includeItems: z
          .boolean()
          .optional()
          .describe("Include item purchase costs in addition to maintenance"),
      }),
      execute: async (params) => {
        return executeHomeQueryTool(
          "get_spending_summary",
          params,
          prisma,
          userId,
          homeId
        );
      },
    }),
    get_room_items: tool({
      description: "List all items in a specific room.",
      parameters: z.object({
        roomName: z
          .string()
          .describe("Name of the room to list items for"),
      }),
      execute: async (params) => {
        return executeHomeQueryTool(
          "get_room_items",
          params,
          prisma,
          userId,
          homeId
        );
      },
    }),
    get_provider_history: tool({
      description:
        "Get service request history, optionally filtered by provider name or status.",
      parameters: z.object({
        providerName: z
          .string()
          .optional()
          .describe("Filter by provider name (partial match)"),
        status: z
          .enum(["pending", "scheduled", "in_progress", "completed", "cancelled"])
          .optional()
          .describe("Filter by request status"),
      }),
      execute: async (params) => {
        return executeHomeQueryTool(
          "get_provider_history",
          params,
          prisma,
          userId,
          homeId
        );
      },
    }),
    count_items: tool({
      description:
        "Count items by various filters. Useful for questions like 'how many appliances do I have?'",
      parameters: z.object({
        category: z.string().optional().describe("Filter by category"),
        room: z.string().optional().describe("Filter by room name"),
        hasWarranty: z
          .boolean()
          .optional()
          .describe("Filter to items that have warranty info"),
        hasManual: z
          .boolean()
          .optional()
          .describe("Filter to items that have manuals attached"),
      }),
      execute: async (params) => {
        return executeHomeQueryTool(
          "count_items",
          params,
          prisma,
          userId,
          homeId
        );
      },
    }),
  };
}

async function getSessionHomeId(
  sessionId: string
): Promise<string | null> {
  const session = await prisma.chatSession.findUnique({
    where: { id: sessionId },
    select: { homeId: true },
  });
  return session?.homeId ?? null;
}
