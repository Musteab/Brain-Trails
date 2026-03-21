import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  console.log("Auth Callback Route Hit:", request.url);
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=No+authentication+code+received", request.url)
    );
  }

  const cookieStore = await cookies();
  const redirectTo = new URL("/", request.url);
  const response = NextResponse.redirect(redirectTo);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
          // Dual-write: set on BOTH the cookieStore and the response.
          // cookieStore.set works in Route Handlers (Next 15+) and is
          // the most reliable way to persist across redirects.
          // response.cookies.set is a fallback for older runtimes.
          cookiesToSet.forEach(({ name, value, options }) => {
            try {
              cookieStore.set(name, value, options);
            } catch {
              // Swallow — cookieStore.set may throw in some edge-runtime versions
            }
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("Auth callback exchange error:", error);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url)
    );
  }

  // Session cookie is now persisted — middleware will see the user
  return response;
}
