// Oturum tazeleme + rota koruma mantığı
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const host = request.headers.get("host") || "";
  const isAppDomain = host.startsWith("app."); // app.invoyca.com
  const isAppRoute = path.startsWith("/app");
  const isAuthRoute = path.startsWith("/login") || path.startsWith("/signup");

  // app.invoyca.com'a gelen biri landing'e (/) düşerse → uygulamaya yönlendir.
  // Giriş yapmışsa dashboard, yapmamışsa login.
  if (isAppDomain && path === "/") {
    const url = request.nextUrl.clone();
    url.pathname = user ? "/app/dashboard" : "/login";
    return NextResponse.redirect(url);
  }

  // Giriş yapmadan app'e girmeye çalışırsa → login'e yönlendir
  if (isAppRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Giriş yapmışken login/signup'a giderse → dashboard'a yönlendir
  if (isAuthRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/app/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}
