import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    console.log("Middleware token:", req.nextauth.token);
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Check role for admin routes
    if (pathname.startsWith("/admin") && token?.role !== "Admin" && token?.role !== "Moderator" && token?.email !== "admin@local") {
      console.log("Unauthorized access attempt to:", pathname);
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
