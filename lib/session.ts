/**
 * 会话管理
 *
 * ============================================================
 * 【对接企业身份体系时的改造点】
 * ============================================================
 * 当前为占位实现：仅校验用户名/密码非空，签发一个不含敏感信息的会话 Cookie，
 * 目的是让「刷新不登出」「未登录跳转」这些路由行为在结构上成立。
 *
 * 生产接入时替换 `verifyCredentials`：
 *   - LDAP / AD：调用企业目录服务校验
 *   - OAuth2 / OIDC / SSO：改为授权码回调流程，本文件仅保留会话读写
 * 同时应将 Cookie 值替换为服务端签名的 JWT 或不透明会话 ID（配合 Redis 等会话存储），
 * 并从令牌中解析真实的用户身份与角色，用于后续 RBAC 鉴权。
 */

import { cookies } from "next/headers"
import type { SessionUser } from "@/lib/types"
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  signSession,
  verifySession,
} from "@/lib/session-token"

export type { SessionUser }
export { SESSION_COOKIE, SESSION_MAX_AGE }

/**
 * 由用户名派生一个稳定的身份对象。
 * 占位实现：展示名直接采用用户名，邮箱按企业域名拼接，角色统一为超级管理员。
 * 生产接入后应从签名令牌 / 会话存储中解析真实的展示名、邮箱与角色（用于 RBAC）。
 */
function deriveUser(username: string): SessionUser {
  const name = username.trim()
  return {
    username: name,
    displayName: name,
    role: "super_admin",
    email: `${name}@corp.com`,
  }
}

/**
 * 校验登录凭据。
 * 占位实现：非空即通过。生产环境须替换为企业目录服务校验。
 */
export async function verifyCredentials(
  username: string,
  password: string,
): Promise<SessionUser | null> {
  if (!username?.trim() || !password?.trim()) return null
  return deriveUser(username)
}

/**
 * 为已校验的用户签发一个 HMAC 签名的会话令牌，作为 Cookie 值写入。
 * 令牌被篡改或过期后 getSession / proxy 校验都会失败。
 */
export async function createSessionToken(username: string): Promise<string> {
  return signSession({
    username: username.trim(),
    exp: Date.now() + SESSION_MAX_AGE * 1000,
  })
}

/**
 * 服务端读取当前会话对应的用户身份，用于审计字段（发布人、操作人等）与顶栏展示。
 * Cookie 中保存的是签名令牌，校验通过后才从中解析用户名并还原身份对象。
 * 生产接入 SSO 后应从令牌 / 会话存储中解析真实的用户身份与角色。
 */
export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const payload = await verifySession(cookieStore.get(SESSION_COOKIE)?.value)
  if (!payload) return null
  return deriveUser(payload.username)
}

/** Cookie 写入选项（httpOnly 防止脚本读取） */
export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  }
}
