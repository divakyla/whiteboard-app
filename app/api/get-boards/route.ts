import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
// import { Board } from "@prisma/client";

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

export async function POST(req: NextRequest) {
  try {
    const { filter, currentUserId } = await req.json();

    if (!filter || !currentUserId) {
      return NextResponse.json(
        { error: "Data tidak lengkap" },
        { status: 400 }
      );
    }

    // ✅ Gunakan tipe aman & fleksibel
    const whereClause: Record<string, unknown> = {
      visibility: filter,
    };

    if (filter === "mine") {
      whereClause.userId = currentUserId;
    } else if (filter === "shared") {
      whereClause.sharedWith = {
        some: {
          userId: currentUserId,
        },
      };
    }

    const boards = await prisma.board.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: { sharedWith: true },
    });

    return NextResponse.json(boards);
  } catch (error) {
    console.error("❌ Gagal ambil boards:", error);
    return NextResponse.json(
      { error: "Gagal mengambil board" },
      { status: 500 }
    );
  }
}
