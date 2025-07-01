import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const res = await fetch(
      "https://bthlg6mrid.execute-api.ap-northeast-1.amazonaws.com/dev/users_info",
      {
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch users" },
        { status: res.status }
      );
    }

    const data = await res.json();

    // Search for user by ID
    const user = data.result.find((u: any) => u.id === userId);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Return only the username
    return NextResponse.json({ username: user.username });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
