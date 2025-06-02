// GET /api/shapes?boardId=xxx

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Ubah ini sesuai dengan tempat import Prisma kamu

export async function GET(req: NextRequest) {
  const boardId = req.nextUrl.searchParams.get("boardId");

  if (!boardId) {
    return NextResponse.json({ error: "Missing boardId" }, { status: 400 });
  }

  try {
    const shapes = await prisma.shape.findMany({
      where: { boardId },
      orderBy: { createdAt: "asc" }, // jika kamu punya createdAt
    });

    return NextResponse.json(shapes);
  } catch (error) {
    console.error("❌ GET /api/shapes error:", error);
    return NextResponse.json(
      { error: "Failed to load shapes" },
      { status: 500 }
    );
  }
}
