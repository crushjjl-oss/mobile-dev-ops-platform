import { Loader2 } from "lucide-react"

/** 路由切换时的骨架，避免导航过程中出现空白 */
export default function Loading() {
  return (
    <div className="flex items-center justify-center py-24" role="status" aria-live="polite">
      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" aria-hidden="true" />
      <span className="ml-2 text-sm text-muted-foreground">加载中…</span>
    </div>
  )
}
