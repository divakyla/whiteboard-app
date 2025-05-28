// import { PrismaClient } from "@prisma/client";
// import { NextResponse } from "next/server";

// const prisma = new PrismaClient();

// export async function GET(
//   req: Request,
//   { params }: { params: { boardId: string } }
// ) {
//   const { boardId } = params;

//   if (!boardId) {
//     return NextResponse.json({ error: "Missing boardId" }, { status: 400 });
//   }

//   const shapes = await prisma.shape.findMany({
//     where: {
//       boardId,
//     },
//   });

//   return NextResponse.json(shapes);
// }
// pages/api/boards/[boardId]/shapes.ts

import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { boardId } = req.query;

  if (req.method === "GET") {
    try {
      const shapes = await prisma.shape.findMany({
        where: { boardId: String(boardId) },
      });
      res.status(200).json(shapes);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch shapes." });
    }
  } else {
    res.status(405).json({ error: "Method not allowed." });
  }
}
