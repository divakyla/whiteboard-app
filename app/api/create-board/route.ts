import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { title } = await req.json();
    const newBoard = await prisma.board.create({
      data: {
        title: title || "Untitled",
      },
    });
    return NextResponse.json(newBoard, { status: 201 });
  } catch (err) {
    console.error("❌ Gagal membuat board:", err);
    return NextResponse.json({ error: "Gagal membuat board" }, { status: 500 });
  }
}
