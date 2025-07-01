import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { boardId } = body;

    if (!boardId) {
      return NextResponse.json(
        { error: "Board ID wajib dikirim." },
        { status: 400 }
      );
    }

    await prisma.sharedBoard.deleteMany({
      where: { boardId },
    });

    await prisma.shape.deleteMany({
      where: { boardId },
    });

    await prisma.board.delete({
      where: { id: boardId },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("❌ Gagal menghapus board:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan di server saat menghapus board" },
      { status: 500 }
    );
  }
}
