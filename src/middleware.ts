import { NextResponse, type NextRequest } from "next/server";
import { verifyToken } from "@/lib/jwt";

export async function middleware(request: NextRequest) {
  try {
    // Only protect /api/admin/* routes
    if (request.nextUrl.pathname.startsWith("/api/admin")) {
      // Get token from the request cookies
      const token = request.cookies.get("auth_token")?.value;
      if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const payload = await verifyToken(token);
      if (!payload) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Pass user id to the route handler via header
      const response = NextResponse.next();
      response.headers.set("x-user-id", payload.userId);
      return response;
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Middleware error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export const config = {
  matcher: "/api/admin/:path*",
};
