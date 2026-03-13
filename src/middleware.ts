export { auth as middleware } from "@/api/auth/auth";

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|auth/).*)",
  ],
};
