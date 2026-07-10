import { generateEmbedding } from "./embeddings";

export interface RetrievedChunk {
  id: string;
  content: string;
  pageNumber: number | null;
  manualTitle: string;
  similarity: number;
}

/**
 * Build a system prompt with RAG context for the home assistant.
 */
export function buildHomeAssistantPrompt(
  homeContext: {
    homeName: string;
    rooms: Array<{ name: string; roomType: string }>;
    items: Array<{
      name: string;
      category: string;
      brand: string | null;
      model: string | null;
      roomName: string | null;
    }>;
  },
  relevantChunks: RetrievedChunk[] = []
): string {
  let prompt = `You are HomeOS, a helpful home assistant. You help homeowners manage and maintain their homes.

## User's Home: ${homeContext.homeName}

### Rooms:
${homeContext.rooms.map((r) => `- ${r.name} (${r.roomType})`).join("\n")}

### Items/Appliances:
${homeContext.items
  .map(
    (i) =>
      `- ${i.name}${i.brand ? ` (${i.brand})` : ""}${i.model ? ` Model: ${i.model}` : ""}${i.roomName ? ` in ${i.roomName}` : ""} [${i.category}]`
  )
  .join("\n")}`;

  if (relevantChunks.length > 0) {
    prompt += `\n\n### Relevant Manual References:\n`;
    for (const chunk of relevantChunks) {
      prompt += `\n**From "${chunk.manualTitle}"${chunk.pageNumber ? ` (p.${chunk.pageNumber})` : ""}:**\n${chunk.content}\n`;
    }
  }

  prompt += `\n\n## Instructions:
- Answer questions about the user's home, appliances, and maintenance
- Reference specific items and manuals when relevant
- Provide practical, actionable advice
- If you reference manual content, cite the manual name and page
- If you don't know something specific, say so rather than guessing
- Be concise and helpful`;

  return prompt;
}

/**
 * SQL query template for pgvector cosine similarity search.
 * Must be executed via Prisma.$queryRaw or $queryRawUnsafe.
 */
export function buildVectorSearchQuery(
  embedding: number[],
  limit: number = 5,
  similarityThreshold: number = 0.3
): {
  sql: string;
  params: [string, number, number];
} {
  const embeddingStr = `[${embedding.join(",")}]`;
  return {
    sql: `
      SELECT
        mc.id,
        mc.content,
        mc.page_number as "pageNumber",
        m.title as "manualTitle",
        1 - (mc.embedding <=> $1::vector) as similarity
      FROM manual_chunks mc
      JOIN manuals m ON mc.manual_id = m.id
      WHERE mc.embedding IS NOT NULL
        AND 1 - (mc.embedding <=> $1::vector) > $2
      ORDER BY mc.embedding <=> $1::vector
      LIMIT $3
    `,
    params: [embeddingStr, similarityThreshold, limit],
  };
}

/**
 * Search for relevant manual chunks given a user query.
 * Requires a Prisma client instance for database access.
 */
export async function searchManualChunks(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prisma: { $queryRawUnsafe: (query: string, ...values: any[]) => Promise<any> },
  query: string,
  limit: number = 5
): Promise<RetrievedChunk[]> {
  const embedding = await generateEmbedding(query);
  const { sql, params } = buildVectorSearchQuery(embedding, limit);

  const results = (await prisma.$queryRawUnsafe(sql, ...params)) as RetrievedChunk[];
  return results;
}
