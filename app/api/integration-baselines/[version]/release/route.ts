import { NextResponse } from "next/server"
import { handleRoute } from "@/lib/api-helpers"
import { releaseBaseline } from "@/lib/data/repository"
import { getSession } from "@/lib/session"

export async function POST(_request: Request, { params }: { params: Promise<{ version: string }> }) {
  const { version } = await params

  const session = await getSession()
  if (!session) {
    return NextResponse.json({ message: "未登录或会话已过期" }, { status: 401 })
  }

  return handleRoute(() => releaseBaseline(decodeURIComponent(version), session.displayName))
}
