import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/database.types";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
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
          // If the cookie is updated, update the request and response cookies
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          // If the cookie is removed, update the request and response cookies
          request.cookies.set({
            name,
            value: "",
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    }
  );

  // This will refresh session if expired
  const { data: { user } } = await supabase.auth.getUser();

  // Define authentication/public routes that shouldn't redirect to login
  const isAuthPage = request.nextUrl.pathname === "/login" || 
                     request.nextUrl.pathname === "/register" ||
                     request.nextUrl.pathname === "/forgot-password" ||
                     request.nextUrl.pathname === "/reset-password" ||
                     request.nextUrl.pathname.startsWith("/auth/");

  // Protect routes - if no user and trying to access a protected route, redirect to login
  if (!user && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If user is already logged in, redirect away from auth pages to home
  // (Prevents logged-in users from seeing the login page again)
  const isLoginPage = request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/register";
  if (user && isLoginPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - API routes or assets that don't require auth
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|assets|auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
