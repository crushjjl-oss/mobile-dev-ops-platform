/**
 * 会话令牌签名与校验（Edge / Node 通用）
 *
 * ============================================================
 * 【为什么需要这一层】
 * ============================================================
 * 会话 Cookie 不能存放明文用户名——否则任何人手动写入
 * `qiyuan_session=admin` 即可冒充管理员。此模块用服务端密钥对
 * 会话载荷做 HMAC-SHA256 签名，令牌一旦被篡改校验立即失败。
 *
 * 仅使用 Web Crypto API（globalThis.crypto.subtle），因此同时兼容
 * Edge 中间件（proxy.ts）与 Node 运行时（Route Handler / Server Component），
 * 不引入 next/headers，可安全地被边缘守卫导入。
 *
 * 对接企业 SSO / OIDC 后，本模块可保留为「会话封装层」：
 * 把 IdP 返回的身份声明写入 payload 并继续签名，或替换为校验 IdP 下发的 JWT。
 */

export const SESSION_COOKIE = "qiyuan_session"
export const SESSION_MAX_AGE = 60 * 60 * 8 // 8 小时（秒）

export interface SessionPayload {
  /** 登录用户名（后续可扩展为 sub / 角色 / 租户等声明） */
  username: string
  /** 过期时间戳（毫秒），服务端校验，不信任客户端时钟 */
  exp: number
}

const DEV_FALLBACK_SECRET = "dev-only-insecure-session-secret-change-me"
let warnedMissingSecret = false

/**
 * 读取签名密钥。生产环境必须通过 SESSION_SECRET 提供强随机值；
 * 开发环境允许回退到固定弱密钥，但会打印一次告警，避免误用到生产。
 */
function getSecret(): string {
  const secret = process.env.SESSION_SECRET
  if (secret && secret.length >= 16) return secret

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "SESSION_SECRET 未配置或过短：生产环境必须设置至少 16 位的强随机会话签名密钥",
    )
  }

  if (!warnedMissingSecret) {
    warnedMissingSecret = true
    console.warn(
      "[v0] 未检测到 SESSION_SECRET，开发环境回退到内置弱密钥。生产部署前请务必配置强随机密钥。",
    )
  }
  return DEV_FALLBACK_SECRET
}

const encoder = new TextEncoder()
const decoder = new TextDecoder()

function bytesToBase64url(bytes: Uint8Array): string {
  let binary = ""
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function base64urlToBytes(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/")
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

async function getKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  )
}

/** 对会话载荷签名，返回 `payload.signature` 形式的紧凑令牌 */
export async function signSession(payload: SessionPayload): Promise<string> {
  const encodedPayload = bytesToBase64url(encoder.encode(JSON.stringify(payload)))
  const key = await getKey()
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(encodedPayload))
  return `${encodedPayload}.${bytesToBase64url(new Uint8Array(signature))}`
}

/**
 * 校验令牌签名与有效期。任一环节不通过均返回 null（视为未登录），
 * 调用方不应从失败的令牌里读取任何字段。
 */
export async function verifySession(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token) return null
  const [encodedPayload, encodedSignature] = token.split(".")
  if (!encodedPayload || !encodedSignature) return null

  try {
    const key = await getKey()
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      base64urlToBytes(encodedSignature),
      encoder.encode(encodedPayload),
    )
    if (!valid) return null

    const payload = JSON.parse(decoder.decode(base64urlToBytes(encodedPayload))) as SessionPayload
    if (!payload?.username || typeof payload.exp !== "number") return null
    if (payload.exp < Date.now()) return null
    return payload
  } catch {
    return null
  }
}
