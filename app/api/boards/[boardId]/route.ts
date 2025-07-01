import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  context: { params: { boardId: string } }
) {
  const boardId = context.params.boardId;
  console.log("🧩 GET /api/boards/", boardId);

  if (!boardId || typeof boardId !== "string") {
    return NextResponse.json({ error: "Invalid board ID" }, { status: 400 });
  }

  const board = await prisma.board.findUnique({
    where: { id: boardId },
  });

  if (!board) {
    console.log("🚫 Board not found for ID:", boardId);
    return NextResponse.json({ error: "Board not found" }, { status: 404 });
  }

  return NextResponse.json(board);
}
