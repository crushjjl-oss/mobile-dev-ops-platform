import { NextResponse } from "next/server"
import { handleRoute } from "@/lib/api-helpers"
import { freezeBaseline } from "@/lib/data/repository"
import { getSession } from "@/lib/session"

export async function POST(_request: Request, { params }: { params: Promise<{ version: string }> }) {
  const { version } = await params

  // 操作人取自服务端会话，不信任客户端传入的身份字段，保证审计记录真实可靠。
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ message: "未登录或会话已过期" }, { status: 401 })
  }

  return handleRoute(() => freezeBaseline(decodeURIComponent(version), session.displayName))
}
