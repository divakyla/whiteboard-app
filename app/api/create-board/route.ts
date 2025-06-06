import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { title } = await req.json();

  if (typeof title !== "string" || title.trim() === "") {
    return NextResponse.json(
      { error: "Judul board tidak valid" },
      { status: 400 }
    );
  }

  try {
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
