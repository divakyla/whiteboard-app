import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/boards/[boardId]/shapes
export async function GET(
  req: NextRequest,
  { params }: { params: { boardId: string } }
) {
  const { boardId } = params;

  if (!boardId) {
    return NextResponse.json({ error: "Missing boardId" }, { status: 400 });
  }

  try {
    const shapes = await prisma.shape.findMany({
      where: { boardId },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(shapes, { status: 200 });
  } catch (error) {
    console.error("❌ Error in GET /api/boards/[boardId]/shapes:", error);
    return NextResponse.json(
      { error: "Failed to fetch shapes." },
      { status: 500 }
    );
  }
}
