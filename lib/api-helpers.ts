import { NextResponse } from "next/server"
import { RepositoryError } from "@/lib/data/repository"
import { getSession, type SessionUser } from "@/lib/session"
import { reportError } from "@/lib/observability"
import type { ListQuery } from "@/lib/types"

/**
 * 统一包装路由处理器：
 * - 业务错误（RepositoryError）→ 对应 HTTP 状态码 + 明确文案；
 * - 未登录（UnauthorizedError）→ 401；
 * - 未预期异常 → 500，并生成事件编号写入结构化日志，响应体回传编号便于排障。
 */
export async function handleRoute<T>(fn: () => Promise<T>): Promise<NextResponse> {
  try {
    const data = await fn()
    // 处理器可直接返回 NextResponse（例如需要写 Set-Cookie 的登录路由），此时原样透传，
    // 避免二次 NextResponse.json 包裹丢失响应头 / Cookie。
    if (data instanceof NextResponse) return data
    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: error.message }, { status: 401 })
    }
    if (error instanceof RepositoryError) {
      return NextResponse.json({ message: error.message }, { status: error.status })
    }
    const eventId = reportError(error, { scope: "api" })
    return NextResponse.json(
      { message: "服务端内部错误，请稍后重试", eventId },
      { status: 500 },
    )
  }
}

/** 未登录 / 会话失效错误，由 handleRoute 统一转成 401 */
export class UnauthorizedError extends Error {
  constructor(message = "未登录或会话已过期") {
    super(message)
    this.name = "UnauthorizedError"
  }
}

/**
 * 在写操作路由中强制要求有效会话，返回当前用户身份。
 * 会话无效时抛出 UnauthorizedError（→ 401），避免每个路由重复写鉴权分支。
 */
export async function requireSession(): Promise<SessionUser> {
  const session = await getSession()
  if (!session) throw new UnauthorizedError()
  return session
}

/** 从 URL 查询字符串提取列表参数 */
export function parseListQuery(url: string): ListQuery {
  const { searchParams } = new URL(url)
  const query: ListQuery = {}
  searchParams.forEach((value, key) => {
    if (value === "") return
    query[key] = key === "page" || key === "pageSize" ? Number(value) : value
  })
  return query
}
