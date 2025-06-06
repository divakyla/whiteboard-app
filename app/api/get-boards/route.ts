import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const boards = await prisma.board.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(boards, { status: 200 });
  } catch (err) {
    console.error("❌ Gagal mengambil boards:", err);
    return NextResponse.json(
      { error: "Gagal mengambil boards" },
      { status: 500 }
    );
  }
}
