import { NextResponse, type NextRequest } from "next/server";
import { decryptToken, SESSION_COOKIE } from "@/lib/session";

// True for "/admin" and "/admin/...", but not "/administrator".
function inArea(pathname: string, area: string) {
  return pathname === area || pathname.startsWith(`${area}/`);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // The login page is open to everyone.
  if (pathname === "/login") return NextResponse.next();

  const session = await decryptToken(request.cookies.get(SESSION_COOKIE)?.value);

  if (!session) {
    // API callers (bell, Postman) get JSON, not an HTML page.
    if (inArea(pathname, "/api")) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const home = session.role === "ADMIN" ? "/admin" : "/member";

  // Wrong role for this area? Go to your own home.
  if (inArea(pathname, "/admin") && session.role !== "ADMIN") {
    return NextResponse.redirect(new URL(home, request.url));
  }
  if (inArea(pathname, "/member") && session.role !== "MEMBER") {
    return NextResponse.redirect(new URL(home, request.url));
  }

  return NextResponse.next();
}

// Skip Next.js files and images, so they load fast.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};