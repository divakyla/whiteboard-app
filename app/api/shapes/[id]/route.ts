import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  console.log("🔍 Trying to delete shape ID:", id);

  if (!id) {
    return NextResponse.json({ error: "Missing shape ID" }, { status: 400 });
  }

  try {
    // Cek dulu apakah shape ada
    const shape = await prisma.shape.findUnique({
      where: { id },
    });

    if (!shape) {
      console.log("❌ Shape not found:", id);
      return NextResponse.json({ error: "Shape not found" }, { status: 404 });
    }

    // Hapus shape
    await prisma.shape.delete({ where: { id } });

    console.log("✅ Shape deleted successfully:", id);
    return NextResponse.json({ message: "Shape deleted successfully" });
  } catch (error) {
    console.error("❌ Delete error:", error);
    console.error("❌ Error type:", typeof error);
    const errorMessage = (error as Error)?.message || "Unknown error";
    console.error("❌ Error message:", errorMessage);

    return NextResponse.json(
      { error: "Failed to delete shape", details: errorMessage },
      { status: 500 }
    );
  }
}
