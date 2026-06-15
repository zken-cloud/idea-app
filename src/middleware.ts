import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // CSRF defense-in-depth: reject cross-origin state-changing API requests.
    // Same-origin browser calls send a matching Origin; non-browser clients send
    // none and are unaffected. NextAuth routes (/api/auth) are excluded by the matcher.
    if (
      !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
      pathname.startsWith("/api/")
    ) {
      const origin = req.headers.get("origin");
      const host = req.headers.get("host");
      if (origin && new URL(origin).host !== host) {
        return NextResponse.json(
          { error: "Cross-origin request blocked" },
          { status: 403 }
        );
      }
    }

    // Check role for admin routes
    if (pathname.startsWith("/admin") && token?.role !== "Admin" && token?.role !== "Moderator" && token?.email !== "admin@local") {
      // Redirect to home or an unauthorized page
      return NextResponse.redirect(new URL("/", req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token, // Require authentication
    },
  }
);

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth(?:$|/)|settings(?:$|/)|auth/signin|auth/signout|privacy(?:$|/)|acceptable-use(?:$|/)).*)"],
};
