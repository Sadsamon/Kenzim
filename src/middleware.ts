import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PROTECTED = ["/news", "/events", "/directory", "/market", "/profile", "/verify", "/admin", "/about", "/places", "/dues", "/notifications"];
const GUEST_ONLY = ["/login", "/signup", "/welcome"];

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const path = request.nextUrl.pathname;

  if (!user && PROTECTED.some((p) => path === p || path.startsWith(p + "/"))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  if (user && GUEST_ONLY.includes(path)) {
    const url = request.nextUrl.clone();
    url.pathname = "/news";
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw.js|offline.html|icons/|manifest.webmanifest).*)",
  ],
};
