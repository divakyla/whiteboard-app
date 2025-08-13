import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { title, userId, visibility, sharedWith } = await req.json();

    if (!title || !userId) {
      return NextResponse.json(
        { error: "Title dan userId wajib diisi" },
        { status: 400 }
      );
    }

    // 1️⃣ Buat board utama
    const newBoard = await prisma.board.create({
      data: {
        title,
        userId,
        isPublic: visibility === "public",
        visibility, // "mine" | "team" | "public"
      },
    });

    console.log("✅ Board dibuat:", newBoard.id, title);

    // // 2️⃣ Kalau board tipe "team", tambahkan anggota tim ke SharedBoard
    if (visibility === "team") {
      //   // ✅ Perbaikan: Memastikan sharedWith adalah array string
      const validSharedWith = Array.isArray(sharedWith)
        ? sharedWith.filter((item) => typeof item === "string")
        : [];

      // Memastikan owner tidak ada di array sharedWith
      const membersWithoutOwner = validSharedWith.filter(
        (memberId) => memberId !== userId
      );

      const allMembers = Array.from(new Set([...membersWithoutOwner, userId])); // Menambahkan owner secara eksplisit di akhir
      console.log("DEBUG: All members to be added:", allMembers);

      if (allMembers.length > 0) {
        await prisma.sharedBoard.createMany({
          data: allMembers.map((uid) => ({
            boardId: newBoard.id,
            userId: uid,
          })),
        });
      }
    }

    // 3️⃣ Hitung collaborators: owner + anggota tim
    const collaboratorsCount =
      visibility === "team" && Array.isArray(sharedWith)
        ? sharedWith.length + 1
        : 1;

    // 4️⃣ Response ke frontend → langsung kirim sharedWith + collaborators
    return NextResponse.json(
      {
        ...newBoard,
        sharedWith: sharedWith || [],
        collaborators: collaboratorsCount,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Gagal membuat board:", error);
    return NextResponse.json({ error: "Gagal membuat board" }, { status: 500 });
  }
}
