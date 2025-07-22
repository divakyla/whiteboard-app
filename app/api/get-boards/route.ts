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
    const { currentUserId } = await req.json();

    if (!currentUserId) {
      return NextResponse.json(
        { error: "currentUserId wajib diisi" },
        { status: 400 }
      );
    }

    // 1️⃣ Ambil semua boards yang bisa diakses user
    const boards = await prisma.board.findMany({
      where: {
        OR: [
          { userId: currentUserId }, // pemilik
          { visibility: "public" }, // publik
          {
            id: {
              in: (
                await prisma.sharedBoard.findMany({
                  where: { userId: currentUserId },
                  select: { boardId: true },
                })
              ).map((sb) => sb.boardId),
            },
          },
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    // Kalau tidak ada board → langsung return []
    if (boards.length === 0) return NextResponse.json([], { status: 200 });

    // 2️⃣ Ambil semua anggota team dari SharedBoard
    const sharedMembers = await prisma.sharedBoard.findMany({
      where: { boardId: { in: boards.map((b) => b.id) } },
      select: { boardId: true, userId: true },
    });

    // 3️⃣ Kelompokkan anggota berdasarkan boardId
    const sharedMap = new Map<string, string[]>();
    for (const s of sharedMembers) {
      if (!sharedMap.has(s.boardId)) sharedMap.set(s.boardId, []);
      sharedMap.get(s.boardId)!.push(s.userId);
    }

    // 4️⃣ Mapping hasil akhir
    // const mapped = boards.map((board) => {
    //   const sharedWith = sharedMap.get(board.id) || [];
    //   return {
    //     id: board.id,
    //     title: board.title,
    //     userId: board.userId,
    //     createdAt: board.createdAt,
    //     sharedWith, // daftar anggota team
    //     collaborators: sharedWith.length + 1, // owner + anggota tim
    //     visibility:
    //       board.visibility === "team"
    //         ? "team" // ✅ biarkan tetap team
    //         : board.userId === currentUserId
    //         ? "mine"
    //         : board.visibility === "public"
    //         ? "public"
    //         : "mine", // fallback
    //   };
    // });

    const mapped = boards.map((board) => {
      const sharedWith = (sharedMap.get(board.id) || []).map((uid) => ({
        userId: uid,
      }));
      return {
        ...board,
        sharedWith, // ✅ sekarang bentuknya [{ userId }]
        collaborators: sharedWith.length,
        visibility: board.visibility, // harus tetap "team"
      };
    });

    console.log("✅ Total boards:", mapped.length);

    // ✅ Return hasil yang sudah lengkap
    return NextResponse.json(mapped, { status: 200 });
  } catch (error) {
    console.error("❌ Gagal ambil boards:", error);
    return NextResponse.json(
      { error: "Gagal mengambil board" },
      { status: 500 }
    );
  }
}
