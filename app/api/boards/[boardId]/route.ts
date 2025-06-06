import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const board = await prisma.board.findUnique({
    where: { id: params.id },
  });

  if (!board) {
    return NextResponse.json({ error: "Board not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: board.id,
    title: board.title ?? "Untitled Board",
  });
}
