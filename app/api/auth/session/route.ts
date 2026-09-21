import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"

/**
 * 返回当前登录用户身份，供客户端顶栏展示。
 * 位于 /api/auth/* 下，proxy 对其免鉴权；未登录时返回 401，
 * 客户端据此可优雅降级（不影响页面级登录守卫）。
 */
export async function GET() {
  const user = await getSession()
  if (!user) {
    return NextResponse.json({ message: "未登录或会话已过期" }, { status: 401 })
  }
  return NextResponse.json(user)
}
