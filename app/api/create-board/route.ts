import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { title, userId, visibility } = await req.json();

    if (!title || !userId) {
      return NextResponse.json(
        { error: "Title dan userId wajib diisi" },
        { status: 400 }
      );
    }

    // Buat board utama
    const newBoard = await prisma.board.create({
      data: {
        title,
        userId,
        isPublic: visibility === "public",
        visibility, // Add the required visibility property
      },
    });
    console.log("🧪 Data diterima:", title, userId, visibility);

    // Jika board tipe "shared", tambahkan ke tabel SharedBoard
    if (visibility === "shared") {
      await prisma.sharedBoard.create({
        data: {
          boardId: newBoard.id,
          userId: userId,
        },
      });
    }

    return NextResponse.json(newBoard, { status: 201 });
  } catch (error) {
    console.error("❌ Gagal membuat board:", error);
    return NextResponse.json({ error: "Gagal membuat board" }, { status: 500 });
  }
}
