import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Impor instance PrismaClient Anda
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

export async function POST(req: Request) {
  try {
    const { boardId, userId, action } = await req.json();

    // Validasi input dasar
    if (!boardId || !userId || !action) {
      return NextResponse.json(
        { message: "Missing boardId, userId, or action" },
        { status: 400 }
      );
    }

    // --- Validasi Lanjut: Pastikan Board dan User itu ada ---
    const existingBoard = await prisma.board.findUnique({
      where: { id: boardId },
      select: { id: true, userId: true }, // Hanya ambil ID dan ownerId
    });

    if (!existingBoard) {
      return NextResponse.json({ message: "Board not found" }, { status: 404 });
    }

    let responseMessage = "";
    let status = 200;

    if (action === "add") {
      try {
        await prisma.sharedBoard.create({
          data: {
            boardId: boardId,
            userId: userId,
          },
        });
        responseMessage = `User ${userId} successfully added as collaborator to board ${boardId}.`;
      } catch (error) {
        // Tangani jika user sudah menjadi kolaborator (unique constraint violation P2002)
        if (
          error instanceof PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          responseMessage = "User is already a collaborator on this board.";
          status = 200; // Masih dianggap sukses karena status yang diinginkan sudah tercapai
        } else {
          console.error("Error adding collaborator:", error);
          responseMessage =
            "Failed to add collaborator due to an unexpected error.";
          status = 500;
        }
      }
    } else if (action === "remove") {
      try {
        const deleteResult = await prisma.sharedBoard.deleteMany({
          where: {
            boardId: boardId,
            userId: userId,
          },
        });

        if (deleteResult.count === 0) {
          responseMessage = "User was not a collaborator on this board.";
          status = 200; // Masih dianggap sukses
        } else {
          responseMessage = `User ${userId} successfully removed as collaborator from board ${boardId}.`;
        }
      } catch (error) {
        console.error("Error removing collaborator:", error);
        responseMessage =
          "Failed to remove collaborator due to an unexpected error.";
        status = 500;
      }
    } else {
      responseMessage = "Invalid action specified. Must be 'add' or 'remove'.";
      status = 400;
    }

    // Setelah operasi (tambah/hapus), ambil data papan terbaru dan hitung kolaborator
    const updatedBoardWithCollaborators = await prisma.board.findUnique({
      where: { id: boardId },
      include: {
        sharedWith: {
          // Sertakan relasi sharedWith untuk menghitung kolaborator
          select: { userId: true }, // Hanya perlu userId untuk menghitung
        },
      },
    });

    // Siapkan data papan untuk dikembalikan ke frontend
    // Frontend Anda mengharapkan `collaborators` sebagai angka.
    const boardDataForFrontend = {
      ...updatedBoardWithCollaborators,
      collaborators:
        (updatedBoardWithCollaborators?.sharedWith.length || 0) + 1,
      // Hapus sharedWith dari objek jika tidak ingin mengirim array penuh ke frontend
      // sharedWith: undefined,
    };

    return NextResponse.json(
      { message: responseMessage, board: boardDataForFrontend },
      { status: status }
    );
  } catch (error) {
    console.error("API handler error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
