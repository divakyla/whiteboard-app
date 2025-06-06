// app/page.tsx
"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Whiteboard as WhiteboardType } from "@/types/database";

const WhiteboardClient = dynamic(
  () => import("@/components/whiteboard/WhiteboardClient"),
  { ssr: false }
);

export default function HomePage() {
  const [boards, setBoards] = useState<WhiteboardType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBoards = async () => {
      try {
        const res = await fetch("/api/get-boards");
        const data = await res.json();
        setBoards(data || []);
      } catch (error) {
        console.error("Gagal mengambil boards:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBoards();
  }, []);

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center py-20 px-6">
      <div className="text-center max-w-xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          FAIR Whiteboard
        </h1>
        <p className="text-gray-600 mb-8 text-lg">
          Buat dan kelola papan ide digital secara kolaboratif dengan mudah.
        </p>
      </div>

      <div className="w-full max-w-2xl mt-10">
        {loading ? (
          <div className="text-center text-gray-500">
            Memuat daftar board...
          </div>
        ) : (
          <WhiteboardClient boards={boards} />
        )}
      </div>
    </main>
  );
}
