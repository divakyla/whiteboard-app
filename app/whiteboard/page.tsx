// app/whiteboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Whiteboard as WhiteboardType } from "@/types/database";
import { LoginModal } from "@/components/login/LoginModal";

export default function WhiteboardLandingPage() {
  const [boards, setBoards] = useState<WhiteboardType[]>([]);
  const [newBoardTitle, setNewBoardTitle] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);

  const router = useRouter();
  // const searchParams = useSearchParams();
  // const username = searchParams.get("user") || "Guest";
  // const email = searchParams.get("email") || undefined;

  useEffect(() => {
    const fetchBoards = async () => {
      try {
        const res = await fetch("/api/get-boards");
        const data = await res.json();
        setBoards(data);
      } catch (error) {
        console.error("Gagal memuat boards:", error);
      }
    };
    fetchBoards();
  }, []);

  const createBoard = async () => {
    if (!newBoardTitle.trim()) return;
    try {
      const res = await fetch("/api/create-board", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newBoardTitle }),
      });
      const data = await res.json();
      if (data?.id) {
        setBoards((prev) => [data, ...prev]);
        setNewBoardTitle("");
      }
    } catch (err) {
      console.error("Gagal membuat board:", err);
    }
  };

  const handleClickBoard = (id: string) => {
    setSelectedBoardId(id);
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

  const handleDeleteBoard = async (boardId: string) => {
    try {
      const res = await fetch("/api/delete-board", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ boardId }),
      });

      const text = await res.text();

      if (!res.ok) {
        throw new Error(`Server error ${res.status}: ${text}`);
      }

      const result = text ? JSON.parse(text) : {};
      console.log("✅ Board berhasil dihapus:", result);

      // 🔄 Update UI tanpa reload
      setBoards((prev) => prev.filter((board) => board.id !== boardId));
    } catch (err) {
      console.error("❌ Error saat menghapus board:", err);
    }
  };

  return (
    <main className="min-h-screen bg-white px-6 py-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        ホワイトボード一覧
      </h1>

      <div className="flex gap-2 mb-8">
        <input
          value={newBoardTitle}
          onChange={(e) => setNewBoardTitle(e.target.value)}
          placeholder="ボードタイトルを入力"
          className="border border-gray-300 px-4 py-2 rounded-md text-sm w-full"
        />
        <button
          onClick={createBoard}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-md text-sm font-medium"
        >
          新規作成
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {boards.map((board) => (
          <div
            key={board.id}
            onClick={() => handleClickBoard(board.id)}
            className="cursor-pointer p-4 border border-gray-200 rounded-lg hover:shadow-md transition"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">
                {board.title || "Untitled Board"}
              </h2>
              <button
                onClick={(e) => {
                  e.stopPropagation(); // ✅ cegah buka modal login
                  handleDeleteBoard(board.id);
                }}
                className="text-red-500 hover:text-red-700 text-sm"
                title="Hapus board"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      <LoginModal isOpen={isModalOpen} onLogin={handleLogin} />
    </main>
  );
}
