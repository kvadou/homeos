import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { chunkText, generateEmbedding } from "@homeos/ai/embeddings";

interface Context {
  params: Promise<{ manualId: string }>;
}

export async function POST(req: NextRequest, ctx: Context) {
  try {
    const user = await requireAuth();
    const { manualId } = await ctx.params;

    // Verify manual exists and user has access
    const manual = await prisma.manual.findFirst({
      where: {
        id: manualId,
        items: {
          some: {
            item: { home: { users: { some: { userId: user.id } } } },
          },
        },
      },
    });

    if (!manual) {
      return NextResponse.json(
        { success: false, error: "Manual not found" },
        { status: 404 }
      );
    }

    // Parse the uploaded PDF
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file uploaded" },
        { status: 400 }
      );
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { success: false, error: "Only PDF files are supported" },
        { status: 400 }
      );
    }

    // Convert file to buffer and parse PDF
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Dynamic import of pdf-parse to avoid bundling issues
    const pdfParse = (await import("pdf-parse")).default;
    const pdfData = await pdfParse(buffer);

    const fullText = pdfData.text;
    const pageCount = pdfData.numpages;

    if (!fullText || fullText.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Could not extract text from PDF" },
        { status: 400 }
      );
    }

    // Delete any existing chunks for this manual
    await prisma.manualChunk.deleteMany({ where: { manualId } });

    // Chunk the extracted text
    const chunks = chunkText(fullText);

    // Create chunks and generate embeddings
    const createdChunks = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      // Create the chunk record first
      const created = await prisma.manualChunk.create({
        data: {
          manualId,
          content: chunk,
          chunkIndex: i,
          pageNumber: estimatePageNumber(i, chunks.length, pageCount),
        },
      });

      // Generate embedding and store with raw SQL for pgvector
      try {
        const embedding = await generateEmbedding(chunk);
        await prisma.$executeRawUnsafe(
          `UPDATE manual_chunks SET embedding = $1::vector WHERE id = $2`,
          `[${embedding.join(",")}]`,
          created.id
        );
      } catch {
        // Embedding generation may fail if no API key configured; chunk is still stored
      }

      createdChunks.push(created);
    }

    // Update manual metadata
    await prisma.manual.update({
      where: { id: manualId },
      data: {
        pageCount,
        fileType: "pdf",
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        manualId,
        chunksCreated: createdChunks.length,
        pageCount,
        textLength: fullText.length,
      },
    });
  } catch (error) {
    console.error("PDF processing error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process PDF" },
      { status: 500 }
    );
  }
}

function estimatePageNumber(
  chunkIndex: number,
  totalChunks: number,
  totalPages: number
): number {
  if (totalPages <= 1) return 1;
  return Math.min(
    Math.floor((chunkIndex / totalChunks) * totalPages) + 1,
    totalPages
  );
}
