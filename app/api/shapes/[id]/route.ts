import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: "Missing shape ID" }, { status: 400 });
  }

  try {
    await prisma.shape.delete({ where: { id } });
    return NextResponse.json({ message: "Shape deleted successfully" });
  } catch (error) {
    console.error("❌ Failed to delete shape:", error);
    return NextResponse.json(
      { error: "Failed to delete shape" },
      { status: 500 }
    );
  }
}
