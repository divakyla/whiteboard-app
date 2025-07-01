import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, email, password } = body;

    const externalApiResponse = await fetch(
      "https://fcc2njnqvg.execute-api.ap-northeast-1.amazonaws.com/dev/webapp_dev_register",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          email,
          password,
        }),
        cache: "no-store",
      }
    );

    // Parse the response from the external API
    const externalApiBody = await externalApiResponse.json();

    // Check if the external API call was successful
    if (!externalApiResponse.ok || externalApiBody.status !== "success") {
      return NextResponse.json(
        {
          status: "error",
          message: externalApiBody?.message || "Failed to register user",
        },
        { status: externalApiResponse.status }
      );
    }

    // Respond with the UserSub received from the external API
    return NextResponse.json(
      {
        status: "success",
        UserSub: externalApiBody.UserSub,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error in registration route:", error);
    return NextResponse.json(
      { status: "error", message: error.message || "Unknown error" },
      { status: 500 }
    );
  }
}
