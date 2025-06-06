// app/whiteboard/[boardId]/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Canvas from "@/components/whiteboard/Canvas";
import Toolbar from "@/components/whiteboard/Toolbar";
import { LoginModal } from "@/components/login/LoginModal";
import { useUser } from "@/hooks/useUser";

export default function BoardPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const boardId = params?.boardId as string;
  const usernameFromQuery = searchParams?.get("user");
  const emailFromQuery = searchParams?.get("email") ?? undefined;
  const [boardTitle, setBoardTitle] = useState("Untitled Board");

  const { user, isLoading, login, logout, isAuthenticated } = useUser();
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    const fetchBoard = async () => {
      try {
        const res = await fetch(`/api/boards/${boardId}`);
        if (!res.ok) throw new Error("Board not found");
        const data = await res.json();
        setBoardTitle(data.title || "Untitled Board");
      } catch {
        setBoardTitle("Untitled Board");
      }
    };

    fetchBoard();
  }, [boardId]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !usernameFromQuery) {
      setShowLoginModal(true);
    }
  }, [isLoading, isAuthenticated, usernameFromQuery]);

  const handleLogin = (userData: { username: string; email?: string }) => {
    login(userData);
    setShowLoginModal(false);
  };

  const handleLogout = () => {
    logout();
    router.push("/dashboard"); // ✅ arahkan ke dashboard
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-20 w-20 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!boardId || Array.isArray(boardId)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            無効なボードID
          </h1>
          <button
            onClick={() => router.push("/")}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    );
  }

  const currentUsername = usernameFromQuery || user?.username || "ゲスト";
  const currentEmail = emailFromQuery || user?.email;
  const currentUserId = `${currentUsername
    .toLowerCase()
    .replace(/\s+/g, "-")}-${Math.random().toString(36).slice(2, 6)}`;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-white/70 backdrop-blur-md shadow-sm border-b px-4 py-2 flex items-center justify-between gap-2">
        {/* Kiri - Judul Board */}
        <div className="flex items-center gap-3">
          <span className="text-xl">🧭</span>
          <input
            className="bg-transparent border-none text-lg font-medium text-gray-900 focus:outline-none focus:ring-0 w-64"
            value={boardTitle}
            onChange={(e) => setBoardTitle(e.target.value)}
            placeholder="Untitled Board"
          />

          <span className="text-xs text-purple-600 bg-purple-100 rounded px-2 py-0.5 font-semibold">
            Free
          </span>
        </div>

        {/* Kanan - Share & User */}
        <div className="flex items-center gap-3">
          <button className="bg-purple-600 text-white text-sm px-4 py-1.5 rounded hover:bg-purple-700 font-medium">
            Share
          </button>

          {(user || usernameFromQuery) && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                {currentUsername.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm text-gray-700 truncate max-w-[120px]">
                {currentUsername}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm border px-3 py-1 rounded text-gray-500 hover:text-gray-700 hover:border-gray-400"
              >
                ログアウト
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Body Layout */}
      <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-64px)] overflow-hidden">
        {/* Toolbar - repositioned in top for mobile */}
        {/* Toolbar */}
        <aside>
          <div className="flex md:flex-col justify-center md:justify-start items-center gap-4 py-2 md:py-4 overflow-x-auto md:overflow-visible">
            <Toolbar />
          </div>
        </aside>

        {/* Canvas Area */}
        <main className="flex-1 relative min-w-0">
          {user || usernameFromQuery ? (
            <Canvas
              boardId={boardId}
              currentUser={{
                id: currentUserId,
                username: currentUsername,
                email: currentEmail,
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center px-4">
                <p className="text-gray-600 mb-4">
                  ご利用の前にログインしてください
                </p>
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  ログイン
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      <LoginModal isOpen={showLoginModal} onLogin={handleLogin} />
    </div>
  );
}
