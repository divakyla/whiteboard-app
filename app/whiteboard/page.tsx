// pages/whiteboard/page.tsx (server component)

import { PrismaClient } from "@prisma/client";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Whiteboard } from "@/types/database";
import WhiteboardClient from "@/components/whiteboard/WhiteboardClient";

const prisma = new PrismaClient();

export default async function BoardListPage() {
  const boards = await prisma.board.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">ボードリスト</h1>
      <WhiteboardClient boards={boards} />
    </div>
  );
}
