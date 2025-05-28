// app/whiteboard/[boardId]/page.tsx

import { PrismaClient } from "@prisma/client";
import { notFound } from "next/navigation";
import Canvas from "@/components/whiteboard/Canvas";
import Toolbar from "@/components/whiteboard/Toolbar";
import WhiteboardClient from "@/components/whiteboard/WhiteboardClient";

interface WhiteboardPageProps {
  params: {
    boardId: string;
  };
}

const prisma = new PrismaClient();

export default async function WhiteboardPage({ params }: WhiteboardPageProps) {
  const { boardId } = params;

  // Debug: cek apakah boardId diterima
  console.log("boardId:", boardId);

  // Cari board berdasarkan ID dari database
  const board = await prisma.board.findUnique({
    where: { id: boardId },
  });

  // Jika tidak ada data, redirect ke halaman 404
  if (!board) {
    notFound();
  }

  // Render halaman whiteboard dengan data board dan Canvas
  return (
    <>
      <div className="flex flex-col h-screen">
        <Toolbar />
        <div className="flex flex-1">
          {/* Sidebar kiri */}
          <aside className="w-64 bg-gray-100 p-4 border-r">
            <h2>{board.title}</h2>
            <p>ID: {board.id}</p>
          </aside>
          {/* Area Canvas */}
          <main className="flex-1 bg-white relative">
            <Canvas boardId={board.id} />
            {/* <div className="absolute inset-0 flex items-center justify-center text-gray-400">
              Canvas goes here...
            </div> */}
          </main>

          {/* Toolbar kanan */}
          <aside className="w-16 bg-gray-50 border-l p-2">
            <div className="text-sm text-center text-gray-400">Tools</div>
          </aside>
        </div>
      </div>
      {/* <WhiteboardClient boardId={boardId} /> */}
    </>
  );
}
