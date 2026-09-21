import { NextResponse } from "next/server"
import {
  SESSION_COOKIE,
  createSessionToken,
  sessionCookieOptions,
  verifyCredentials,
} from "@/lib/session"
import { handleRoute } from "@/lib/api-helpers"
import { loginSchema, parseBody } from "@/lib/validation"
import { RepositoryError } from "@/lib/data/repository"
import { logEvent } from "@/lib/observability"

export async function POST(request: Request) {
  return handleRoute(async () => {
    const { username, password } = await parseBody(request, loginSchema)

    const user = await verifyCredentials(username, password)
    if (!user) {
      throw new RepositoryError("用户名或密码错误", 401)
    }

    const token = await createSessionToken(user.username)
    const response = NextResponse.json({ user })
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions())
    logEvent("用户登录", { username: user.username })
    return response
  })
}
