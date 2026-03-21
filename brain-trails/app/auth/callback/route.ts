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
  // Determine where to redirect based on the flow type
  const next = requestUrl.searchParams.get("next") || "/";
  const redirectTo = new URL(next, request.url);
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
