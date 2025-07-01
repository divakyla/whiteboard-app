import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // pastikan path prisma sesuai

export async function PUT(req: NextRequest) {
  try {
    const { boardId, title } = await req.json();

    if (!boardId || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const updatedBoard = await prisma.board.update({
      where: { id: boardId },
      data: { title: title.trim() },
    });

    return NextResponse.json(updatedBoard, { status: 200 });
  } catch (error) {
    console.error("❌ Failed to rename board:", error);
    return NextResponse.json({ error: "Rename failed" }, { status: 500 });
  }
}
