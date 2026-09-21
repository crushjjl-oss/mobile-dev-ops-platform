import { NextResponse } from "next/server"
import { handleRoute } from "@/lib/api-helpers"
import { publishIntegrationComponent } from "@/lib/data/repository"
import { getSession } from "@/lib/session"

export async function POST(request: Request, { params }: { params: Promise<{ version: string }> }) {
  const { version } = await params
  let body: { componentKey?: string; version?: string; buildId?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: "请求格式不正确" }, { status: 400 })
  }

  // 操作人取自服务端会话，不信任客户端传入的身份字段，保证审计记录真实可靠。
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ message: "未登录或会话已过期" }, { status: 401 })
  }

  return handleRoute(() =>
    publishIntegrationComponent({
      baselineVersion: decodeURIComponent(version),
      componentKey: String(body.componentKey ?? ""),
      version: String(body.version ?? ""),
      buildId: body.buildId ? String(body.buildId) : undefined,
      operator: session.displayName,
    }),
  )
}
