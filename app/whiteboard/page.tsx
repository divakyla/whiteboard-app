// app/whiteboard/page.tsx

import { PrismaClient } from "@prisma/client";
import { Whiteboard as WhiteboardType } from "@/types/database";
import Link from "next/link";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

export default async function BoardListPage() {
  const boards = await prisma.board.findMany({
    orderBy: { createdAt: "desc" },
  });

  async function createBoard(formData: FormData) {
    "use server";
    const title = formData.get("title")?.toString() || "Untitled";
    await prisma.board.create({
      data: { title },
    });
    revalidatePath("/board");
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Your Whiteboards</h1>

      <form action={createBoard} className="mb-6 flex gap-2">
        <input
          name="title"
          placeholder="Enter board title"
          className="border p-2 rounded w-full"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Create
        </button>
      </form>

      <ul className="space-y-2">
        {boards.map((board: WhiteboardType) => (
          <li key={board.id}>
            <Link
              href={`/whiteboard/${board.id}`}
              className="text-blue-600 hover:underline"
            >
              {board.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
