"use client"

import { useEffect } from "react"
import { AlertTriangle, RotateCcw, Home } from "lucide-react"

import { Button } from "@/components/ui/button"

/**
 * 全局错误边界。
 *
 * 拦截渲染期未捕获异常，避免整站白屏。
 * 生产接入时应在 useEffect 中上报到 Sentry / 企业 APM。
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // TODO(生产): 替换为企业错误监控上报
    console.error("[v0] 未捕获异常:", error)
  }, [error])

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto w-14 h-14 rounded-full bg-accent-danger flex items-center justify-center mb-6">
          <AlertTriangle className="w-7 h-7 text-status-danger" aria-hidden="true" />
        </div>

        <h1 className="text-xl font-semibold text-foreground mb-2">页面出现异常</h1>
        <p className="text-sm text-muted-foreground leading-relaxed mb-2">
          系统遇到未预期的错误，已记录本次事件。可尝试重新加载，若问题持续请联系平台运维。
        </p>

        {error.digest && (
          <p className="text-xs font-mono text-muted-foreground/70 mb-6">
            事件编号: {error.digest}
          </p>
        )}

        <div className="flex items-center justify-center gap-3 mt-6">
          <Button onClick={reset} className="gap-2">
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            重新加载
          </Button>
          <Button variant="outline" asChild className="gap-2">
            <a href="/dashboard">
              <Home className="w-4 h-4" aria-hidden="true" />
              返回总览
            </a>
          </Button>
        </div>
      </div>
    </main>
  )
}
