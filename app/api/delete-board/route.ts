import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { boardId } = body;

    if (!boardId) {
      return NextResponse.json(
        { error: "Board ID tidak ditemukan" },
        { status: 400 }
      );
    }

    const board = await prisma.board.findUnique({
      where: { id: boardId },
    });

    if (!board) {
      return NextResponse.json(
        { error: "Board tidak ditemukan" },
        { status: 404 }
      );
    }

    // 🔥 Hapus semua shape dulu
    await prisma.shape.deleteMany({
      where: { boardId },
    });

    // 🔥 Baru hapus board-nya
    await prisma.board.delete({
      where: { id: boardId },
    });

    return NextResponse.json({ success: true, boardId }, { status: 200 });
  } catch (error) {
    console.error("❌ Gagal menghapus board:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan di server" },
      { status: 500 }
    );
  }
}
