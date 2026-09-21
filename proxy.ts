import { NextResponse, type NextRequest } from "next/server"

import { SESSION_COOKIE, verifySession } from "@/lib/session-token"

/**
 * 边缘会话守卫。
 *
 * 页面路由：未登录访问业务页面 → 跳转 /login 并带上 next 参数，登录后回到原页面；
 *          已登录访问 /login   → 跳转 /dashboard，避免重复登录。
 * API 路由：/api/auth/* 免鉴权（登录/登出本身）；其余 /api/* 未带有效会话 Cookie
 *          直接返回 401 JSON，防止绕过页面登录墙直接调用数据接口。
 *
 * 鉴权不再只看 Cookie 是否存在，而是校验 HMAC 签名与过期时间：
 * 伪造或过期的会话令牌会被当作未登录处理。
 * 对接企业 SSO 后，此处改为校验 IdP 下发令牌的有效性。
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const authed = Boolean(await verifySession(request.cookies.get(SESSION_COOKIE)?.value))
  const isAuthRoute = pathname.startsWith("/api/auth/")

  if (pathname.startsWith("/api/")) {
    if (isAuthRoute || authed) return NextResponse.next()
    return NextResponse.json({ message: "未登录或会话已过期" }, { status: 401 })
  }

  if (pathname === "/login") {
    if (authed) return NextResponse.redirect(new URL("/dashboard", request.url))
    return NextResponse.next()
  }

  if (!authed) {
    const url = new URL("/login", request.url)
    // 记录来源，登录后可直达原页面（支持深链分享）
    if (pathname !== "/") url.searchParams.set("next", pathname + search)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  // 排除静态资源与图片优化路径；API 路由需要进入 proxy 才能受到鉴权保护
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
