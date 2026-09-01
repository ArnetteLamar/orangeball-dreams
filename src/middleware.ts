import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const locales = ["pt", "en", "es"] as const;
type Locale = (typeof locales)[number];

const ADMIN_COOKIE_NAME = "obd_admin_session";

function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

function isPublicAsset(pathname: string) {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/generated") ||
    pathname.startsWith("/img") ||
    pathname === "/favicon.ico" ||
    pathname.includes(".")
  );
}

function hasAdminSession(request: NextRequest) {
  const sessionSecret = process.env.ADMIN_SESSION_SECRET;

  if (!sessionSecret) {
    return false;
  }

  const cookieValue = request.cookies.get(ADMIN_COOKIE_NAME)?.value;

  return cookieValue === sessionSecret;
}

function getLocaleFromPathname(pathname: string): Locale {
  const first = pathname.split("/")[1];

  if (isLocale(first)) {
    return first;
  }

  return "pt";
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (isPublicAsset(pathname)) {
    return NextResponse.next();
  }

  const isLoggedIn = hasAdminSession(request);

  // Admin API login/logout ficam públicos
  if (pathname === "/api/admin/login" || pathname === "/api/admin/logout") {
    return NextResponse.next();
  }

  // Bloquear todas as APIs admin
  if (pathname.startsWith("/api/admin")) {
    if (!isLoggedIn) {
      return NextResponse.json(
        { error: "Unauthorized admin request" },
        { status: 401 },
      );
    }

    return NextResponse.next();
  }

  // Outras APIs continuam livres
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Root -> /pt
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/pt", request.url));
  }

  const first = pathname.split("/")[1];

  // Se não começar com locale, manda para /pt
  if (!isLocale(first)) {
    return NextResponse.redirect(new URL(`/pt${pathname}`, request.url));
  }

  const locale = getLocaleFromPathname(pathname);

  const isAdminPage =
    pathname === `/${locale}/admin` || pathname.startsWith(`/${locale}/admin/`);

  const isLoginPage = pathname === `/${locale}/admin/login`;

  // Se já está logado e vai ao login, manda para admin
  if (isLoginPage && isLoggedIn) {
    return NextResponse.redirect(new URL(`/${locale}/admin`, request.url));
  }

  // Bloquear páginas admin
  if (isAdminPage && !isLoginPage && !isLoggedIn) {
    return NextResponse.redirect(
      new URL(`/${locale}/admin/login`, request.url),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
