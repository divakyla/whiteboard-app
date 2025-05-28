"use client";

import React from "react";
import Toolbar from "./Toolbar";
import Canvas from "./Canvas";

interface WhiteboardClientProps {
  boardId: string;
}

export default function WhiteboardClient({ boardId }: WhiteboardClientProps) {
  return (
    <div className="flex flex-col h-screen">
      <Toolbar />
      <div className="flex flex-1">
        <main className="flex-1 bg-white relative">
          <Canvas boardId={boardId} />
        </main>
      </div>
    </div>
  );
}
