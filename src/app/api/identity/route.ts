import { NextResponse } from "next/server";

// ID documents are no longer collected in the app.
export function POST() {
  return NextResponse.json({ error: "ID uploads are no longer used." }, { status: 410 });
}
