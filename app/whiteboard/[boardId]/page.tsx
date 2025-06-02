// // app/whiteboard/[boardId]/page.tsx

// import { PrismaClient } from "@prisma/client";
// import { notFound } from "next/navigation";
// import Canvas from "@/components/whiteboard/Canvas";
// import Toolbar from "@/components/whiteboard/Toolbar";
// // import WhiteboardClient from "@/components/whiteboard/WhiteboardClient";

// interface WhiteboardPageProps {
//   params: {
//     boardId: string;
//   };
// }

// // Use a singleton pattern for PrismaClient to avoid too many connections in development
// const globalForPrisma = global as unknown as { prisma: PrismaClient };

// const prisma = globalForPrisma.prisma || new PrismaClient();

// if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// export default async function WhiteboardPage({ params }: WhiteboardPageProps) {
//   const { boardId } = params;

//   // Debug: cek apakah boardId diterima
//   console.log("boardId:", boardId);

//   // Cari board berdasarkan ID dari database
//   const board = await prisma.board.findUnique({
//     where: { id: boardId },
//   });

//   // Jika tidak ada data, redirect ke halaman 404
//   if (!board) {
//     notFound();
//   }

//   // Render halaman whiteboard dengan data board dan Canvas
//   return (
//     <>
//       <div className="flex flex-col h-screen">
//         <Toolbar />
//         <div className="flex flex-1">
//           {/* Sidebar kiri */}
//           <aside className="w-64 bg-gray-100 p-4 border-r">
//             <h2>{board.title}</h2>
//             {/* <p>ID: {board.id}</p> */}
//           </aside>
//           {/* Area Canvas */}
//           <main className="flex-1 bg-white relative">
//             <Canvas boardId={board.id} />
//             {/* <div className="absolute inset-0 flex items-center justify-center text-gray-400">
//               Canvas goes here...
//             </div> */}
//           </main>

//           {/* Toolbar kanan */}
//           {/* <aside className="w-16 bg-gray-50 border-l p-2">
//             <div className="text-sm text-center text-gray-400">Tools</div>
//           </aside> */}
//         </div>
//       </div>
//       {/* <WhiteboardClient boardId={boardId} /> */}
//     </>
//   );
// }

// pages/board/[boardId].tsx atau app/board/[boardId]/page.tsx
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

  const { user, isLoading, login, logout, isAuthenticated } = useUser();
  const [showLoginModal, setShowLoginModal] = useState(false);

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
    setShowLoginModal(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!boardId || Array.isArray(boardId)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Invalid Board ID
          </h1>
          <button
            onClick={() => router.push("/")}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const currentUsername = usernameFromQuery || user?.username || "Guest";
  const currentEmail = emailFromQuery || user?.email;
  const currentUserId = `${currentUsername
    .toLowerCase()
    .replace(/\s+/g, "-")}-${Math.random().toString(36).slice(2, 6)}`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-gray-800">
              Collaborative Canvas
            </h1>
            <span className="text-sm text-gray-500">Board: {boardId}</span>
          </div>

          {(user || usernameFromQuery) && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  {currentUsername.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm text-gray-700">{currentUsername}</span>
              </div>

              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 rounded border border-gray-300 hover:border-gray-400"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-73px)]">
        {/* Toolbar */}
        <div className="w-16 bg-white border-r border-gray-200">
          <Toolbar />
        </div>

        {/* Canvas */}
        <div className="flex-1 relative">
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
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  Please log in to use the canvas
                </p>
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Login
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Login Modal */}
      <LoginModal isOpen={showLoginModal} onLogin={handleLogin} />
    </div>
  );
}
