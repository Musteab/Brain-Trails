import { createServerClient } from "@supabase/ssr";
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
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
          // Write to both request and response so the session
          // is available for the rest of the middleware chain
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
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
    request.nextUrl.pathname === "/confirm-email" ||
    request.nextUrl.pathname === "/email-confirmed" ||
    request.nextUrl.pathname === "/privacy" ||
    request.nextUrl.pathname === "/terms" ||
    request.nextUrl.pathname.startsWith("/auth/");

  // KEY FIX: Only redirect to login if we have no user.
  // The isAuthPage check ensures we don't redirect during login/register/reset.
  if (!user && !isAuthPage) {
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