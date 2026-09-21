/**
 * 可观测性：结构化日志与错误上报钩子
 *
 * ============================================================
 * 【对接企业监控时的改造点】
 * ============================================================
 * 当前实现把日志/错误以结构化 JSON 打到 console，并保留统一入口。
 * 生产接入时在 `reportError` / `logEvent` 内部替换为企业监控 SDK
 * （如 Sentry、Datadog、OpenTelemetry Collector），无需改动调用方。
 *
 * 该模块不依赖任何运行时特定 API，可在 Edge / Node / 浏览器中调用。
 */

type LogLevel = "info" | "warn" | "error"

interface LogFields {
  [key: string]: unknown
}

function emit(level: LogLevel, message: string, fields?: LogFields) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    message,
    ...fields,
  }
  const line = JSON.stringify(entry)
  if (level === "error") console.error(line)
  else if (level === "warn") console.warn(line)
  else console.log(line)
}

/** 记录一条结构化业务/请求日志 */
export function logEvent(message: string, fields?: LogFields) {
  emit("info", message, fields)
}

/** 记录一条结构化警告 */
export function logWarning(message: string, fields?: LogFields) {
  emit("warn", message, fields)
}

/**
 * 统一错误上报入口。生产环境应在此转发到企业错误监控平台。
 * 返回一个可展示给用户的事件编号，便于用户反馈时定位。
 */
export function reportError(error: unknown, fields?: LogFields): string {
  const eventId = fields?.eventId ? String(fields.eventId) : generateEventId()
  emit("error", error instanceof Error ? error.message : "未知错误", {
    eventId,
    stack: error instanceof Error ? error.stack : undefined,
    ...fields,
  })
  // TODO(生产): 转发到企业错误监控平台，例如 Sentry.captureException(error, { tags: { eventId } })
  return eventId
}

/** 生成短事件编号（用于日志关联与用户反馈） */
export function generateEventId(): string {
  return (
    globalThis.crypto?.randomUUID?.().slice(0, 8) ??
    Math.random().toString(36).slice(2, 10)
  )
}
