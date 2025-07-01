import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { UserSub, confirmationCode, username, email } = body;

    if (!UserSub || !confirmationCode) {
      return NextResponse.json(
        {
          status: "error",
          message: "UserSub and confirmationCode are required",
        },
        { status: 400 }
      );
    }

    // Call the actual confirmation API (or your logic for confirming the user)
    const confirmApiResponse = await fetch(
      "https://fcc2njnqvg.execute-api.ap-northeast-1.amazonaws.com/dev/webapp_dev_confirm",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          UserSub,
          confirmationCode,
          username,
          email,
        }),
        cache: "no-store",
      }
    );

    const confirmApiBody = await confirmApiResponse.json();

    if (!confirmApiResponse.ok || confirmApiBody.status !== "success") {
      return NextResponse.json(
        {
          status: "error",
          message: confirmApiBody?.message || "Confirmation failed",
        },
        { status: confirmApiResponse.status }
      );
    }

    // Return success if confirmation is successful
    return NextResponse.json(
      {
        status: "success",
        message: "User confirmed successfully",
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message || "Unknown error" },
      { status: 500 }
    );
  }
}
