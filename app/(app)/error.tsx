"use client"

import { useEffect } from "react"
import { AlertTriangle, RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { reportError } from "@/lib/observability"

/**
 * 业务区错误边界。
 *
 * 与全局 error.tsx 的区别：此处保留侧边栏与顶栏，用户可直接切换到其它页面，
 * 不必被整站错误页打断工作流。
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    reportError(error, { scope: "app-error-boundary", digest: error.digest })
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-12 h-12 rounded-full bg-accent-danger flex items-center justify-center mb-5">
        <AlertTriangle className="w-6 h-6 text-status-danger" aria-hidden="true" />
      </div>

      <h2 className="text-base font-semibold text-foreground mb-2">该页面加载失败</h2>
      <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mb-1">
        请求处理过程中出现异常。可重试当前页面，或从左侧切换到其它模块。
      </p>

      {error.digest && (
        <p className="text-xs font-mono text-muted-foreground/70 mb-5">事件编号: {error.digest}</p>
      )}

      <Button onClick={reset} size="sm" className="gap-2 mt-4">
        <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
        重试
      </Button>
    </div>
  )
}
