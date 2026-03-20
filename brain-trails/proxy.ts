import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/database.types";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const allCookies = request.cookies.getAll().map(c => c.name);
  console.log("Middleware: Path:", request.nextUrl.pathname);
  console.log("Middleware: Cookies present:", allCookies);

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError) {
    console.error("Middleware: getUser error:", authError.message);
  }
  console.log("Middleware: User ID:", user?.id || "None");

  const isAuthPage =
    request.nextUrl.pathname === "/login" ||
    request.nextUrl.pathname === "/register" ||
    request.nextUrl.pathname === "/forgot-password" ||
    request.nextUrl.pathname === "/reset-password" ||
    request.nextUrl.pathname.startsWith("/auth/");

  // KEY FIX: Only redirect to login if we DEFINITIVELY have no user AND no error.
  // If authError is present, the session may be mid-exchange (e.g. OAuth PKCE).
  // Let it through — the destination page will handle unauthenticated state.
  if (!user && !authError && !isAuthPage) {
    console.log("Middleware: No user, redirecting to /login");
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const isLoginPage =
    request.nextUrl.pathname === "/login" ||
    request.nextUrl.pathname === "/register";

  if (user && isLoginPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|assets|api|auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    //                                                          ^^^
    //                                         Added: exclude /api/* routes too
  ],
};