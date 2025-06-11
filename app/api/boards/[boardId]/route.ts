import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: { boardId?: string } }
) {
  const boardId = params?.boardId;
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
