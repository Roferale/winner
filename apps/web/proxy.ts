import { NextRequest, NextResponse } from "next/server";

const PROTECTED = ["/dashboard", "/financeiro", "/alunos", "/cadastro", "/configuracoes"];
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED.some(p => pathname === p || pathname.startsWith(p + "/"));
  if (!isProtected) return NextResponse.next();

  const token = req.cookies.get("erp_token")?.value;
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
