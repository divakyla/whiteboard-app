import { NextResponse } from "next/server";

export async function GET() {
  try {
    const deptsApi = process.env.DEPARTMENTS_API_LINK as string;
    const resp = await fetch(deptsApi, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });
    const departments = await resp.json();

    return NextResponse.json(departments.result);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error fetching users" },
      { status: 500 }
    );
  }
}
