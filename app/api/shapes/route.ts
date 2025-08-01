import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/shapes
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const boardId = searchParams.get("boardId");

  if (!boardId) {
    return NextResponse.json({ error: "Missing boardId" }, { status: 400 });
  }

  try {
    const shapes = await prisma.shape.findMany({
      where: { boardId },
      orderBy: { createdAt: "asc" }, // Optional: order shapes
    });
    return NextResponse.json(shapes, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch shapes." },
      { status: 500 }
    );
  }
}

// POST /api/shapes
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { boardId, shape } = body;

    if (!boardId || !shape) {
      return NextResponse.json(
        { error: "Missing boardId or shape data." },
        { status: 400 }
      );
    }

    const exists = await prisma.shape.findUnique({ where: { id: shape.id } });
    if (exists) {
      return NextResponse.json(
        { error: "Shape with this ID already exists." },
        { status: 409 }
      );
    }

    const newShape = await prisma.shape.create({
      data: {
        id: shape.id,
        type: shape.type,
        x: shape.x ?? null,
        y: shape.y ?? null,
        width: shape.width ?? null,
        height: shape.height ?? null,
        cx: shape.cx ?? null,
        cy: shape.cy ?? null,
        r: shape.r ?? null,
        content: shape.content ?? null,
        fontSize: shape.fontSize ? parseInt(shape.fontSize.toString()) : null,
        fill: shape.fill ?? null,
        stroke: shape.stroke ?? null,
        strokeWidth: shape.strokeWidth ?? null,
        points: shape.points ?? null,
        pathData: shape.pathData ?? null,
        boardId,
      },
    });

    return NextResponse.json(newShape, { status: 201 });
  } catch (error: unknown) {
    console.error("❌ POST /api/shapes error:", error);
    return NextResponse.json(
      {
        error: "Failed to create shape",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const boardId = searchParams.get("boardId");

  if (!boardId) {
    return NextResponse.json({ message: "Missing boardId" }, { status: 400 });
  }

  try {
    await prisma.shape.deleteMany({
      where: { boardId },
    });

    return NextResponse.json({ message: "All shapes deleted" });
  } catch (error) {
    console.error("❌ Error deleting all shapes:", error);
    return NextResponse.json(
      { message: "Failed to delete shapes" },
      { status: 500 }
    );
  }
}

// DELETE /api/shapes?id=...
// export async function DELETE(req: NextRequest) {
//   const { searchParams } = new URL(req.url);
//   const id = searchParams.get("id");

//   if (!id) {
//     return NextResponse.json({ error: "Missing shape id" }, { status: 400 });
//   }

//   try {
//     await prisma.shape.delete({ where: { id } });
//     return NextResponse.json({ message: "Shape deleted" }, { status: 200 });
//   } catch (error) {
//     console.error("Error deleting shape:", error);
//     return NextResponse.json(
//       { error: "Failed to delete shape" },
//       { status: 500 }
//     );
//   }
// }
