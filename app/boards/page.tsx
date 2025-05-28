// app/boards/page.tsx
import { PrismaClient } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";

const prisma = new PrismaClient();

export default async function BoardsPage() {
  const boards = await prisma.board.findMany();

  async function createBoard() {
    "use server"; // <== biar fungsi ini jalan di server

    const newBoard = await prisma.board.create({
      data: {
        title: "Untitled Board",
      },
    });

    redirect(`/whiteboard/${newBoard.id}`);
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Daftar Whiteboard</h1>

      <form action={createBoard}>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mb-4"
        >
          + Buat Board Baru
        </button>
      </form>

      <ul className="space-y-2">
        {boards.map((board) => (
          <li key={board.id}>
            <Link
              href={`/whiteboard/${board.id}`}
              className="text-blue-600 underline"
            >
              {board.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
