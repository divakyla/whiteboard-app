"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Whiteboard as WhiteboardType } from "@/types/database";
import { LoginModal } from "@/components/login/LoginModal";

export default function BoardListPageClient({
  boards: initialBoards,
}: {
  boards: WhiteboardType[];
}) {
  const [boards, setBoards] = useState(initialBoards);
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState("");
  const router = useRouter();

  const handleClickBoard = (boardId: string) => {
    setSelectedBoardId(boardId);
    setIsModalOpen(true);
  };

  const handleLogin = (userData: { username: string; email?: string }) => {
    setIsModalOpen(false);
    localStorage.setItem("canvas-user", JSON.stringify(userData));
    router.push(
      `/whiteboard/${selectedBoardId}?user=${encodeURIComponent(
        userData.username
      )}${userData.email ? `&email=${encodeURIComponent(userData.email)}` : ""}`
    );
  };

  const createBoard = async () => {
    if (!newBoardTitle.trim()) return;
    try {
      const res = await fetch("/api/create-board", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: newBoardTitle }),
      });

      const data = await res.json();
      if (data?.id) {
        setBoards((prev) => [data, ...prev]); // tambahkan ke atas list
        setNewBoardTitle("");
      }
    } catch (err) {
      console.error("❌ Gagal membuat board baru:", err);
    }
  };

  return (
    <div>
      {/* Form buat board */}
      <div className="flex gap-2 mb-4">
        <input
          value={newBoardTitle}
          onChange={(e) => setNewBoardTitle(e.target.value)}
          placeholder="Masukkan judul board..."
          className="border border-gray-300 px-3 py-2 rounded-md text-sm w-full"
        />
        <button
          onClick={createBoard}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm"
        >
          Buat Board
        </button>
      </div>

      {/* List board */}
      <ul className="space-y-2">
        {boards.map((board) => (
          <li key={board.id}>
            <button
              onClick={() => handleClickBoard(board.id)}
              className="text-blue-600 hover:underline"
            >
              {board.title}
            </button>
          </li>
        ))}
      </ul>

      {/* Modal login muncul hanya setelah klik board */}
      <LoginModal isOpen={isModalOpen} onLogin={handleLogin} />
    </div>
  );
}
