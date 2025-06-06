// components/whiteboard/elements/whiteboardclient.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Whiteboard as WhiteboardType } from "@/types/database";
import { LoginModal } from "@/components/login/LoginModal";

export default function WhiteboardClient({
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
        setBoards((prev) => [data, ...prev]);
        setNewBoardTitle("");
      }
    } catch (err) {
      console.error("❌ Gagal membuat board baru:", err);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex gap-2 mb-4">
        <input
          value={newBoardTitle}
          onChange={(e) => setNewBoardTitle(e.target.value)}
          placeholder="Masukkan judul board..."
          className="border border-gray-300 px-4 py-2 rounded-md text-sm w-full"
        />
        <button
          onClick={createBoard}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-md text-sm font-medium"
        >
          Buat
        </button>
      </div>

      <ul className="space-y-2">
        {boards.map((board) => (
          <li key={board.id}>
            <button
              onClick={() => handleClickBoard(board.id)}
              className="text-blue-600 hover:underline text-base"
            >
              {board.title}
            </button>
          </li>
        ))}
      </ul>

      <LoginModal isOpen={isModalOpen} onLogin={handleLogin} />
    </div>
  );
}
