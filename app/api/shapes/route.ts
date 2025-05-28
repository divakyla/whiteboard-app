// import { NextResponse } from "next/server";
// import { PrismaClient } from "@prisma/client";

// const prisma = new PrismaClient();

// export async function POST(req: Request) {
//   const body = await req.json();
//   const { boardId, shape } = body;

//   if (!boardId || !shape || !shape.type) {
//     return NextResponse.json({ error: "Invalid data" }, { status: 400 });
//   }

//   const newShape = await prisma.shape.create({
//     data: {
//       type: shape.type,
//       x: shape.x,
//       y: shape.y,
//       width: shape.width,
//       height: shape.height,
//       cx: shape.cx,
//       cy: shape.cy,
//       r: shape.r,
//       boardId,
//     },
//   });

//   return NextResponse.json(newShape, { status: 201 });
// }
// pages/api/shapes.ts  (Next.js API route)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Ubah ini sesuai dengan tempat import Prisma kamu

// GET /api/shapes?boardId=...
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const boardId = searchParams.get("boardId");

  if (!boardId) {
    return NextResponse.json({ error: "Missing boardId" }, { status: 400 });
  }

  try {
    const shapes = await prisma.shape.findMany({
      where: { boardId },
    });
    return NextResponse.json(shapes, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch shapes." },
      { status: 500 }
    );
  }
}

// POST /api/shapes
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { boardId, shape } = body;

    if (!boardId || !shape) {
      return NextResponse.json(
        { error: "Missing boardId or shape data." },
        { status: 400 }
      );
    }
    console.log("DATA DITERIMA:", { boardId, shape });
    const newShape = await prisma.shape.create({
      data: {
        id: shape.id,
        type: shape.type,
        x: shape.x ?? null,
        y: shape.y ?? null,
        width: shape.width ?? null,
        height: shape.height ?? null,
        cx: shape.cx ?? null,
        cy: shape.cy ?? null,
        r: shape.r ?? null,
        content: shape.content ?? null,
        fontSize: shape.fontSize ?? null,
        fill: shape.fill ?? null,
        boardId,
      },
    });

    return NextResponse.json(newShape, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create shape." },
      { status: 500 }
    );
  }
}
