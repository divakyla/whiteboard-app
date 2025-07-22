import { NextResponse } from "next/server";

export async function GET() {
  try {
    const usersApi = process.env.USERS_API_LINK as string;
    const resp = await fetch(usersApi, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });
    const users = await resp.json();
    // console.log('users',users)
    return NextResponse.json(users.result);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error fetching users" },
      { status: 500 }
    );
  }
}
