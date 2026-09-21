import { NextResponse } from "next/server"
import { handleRoute } from "@/lib/api-helpers"
import { getWorkbench } from "@/lib/data/repository"
import { getSession } from "@/lib/session"

export async function GET() {
  // 工作台以当前登录用户为中心聚合数据，身份取自服务端会话。
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ message: "未登录或会话已过期" }, { status: 401 })
  }

  return handleRoute(() =>
    getWorkbench({
      displayName: session.displayName,
      role: session.role,
      email: session.email,
    }),
  )
}
