import { NextResponse } from "next/server";

// ID documents are no longer collected in the app.
export function GET() {
  return new NextResponse("Gone", { status: 410 });
}
