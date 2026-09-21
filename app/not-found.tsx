import Link from "next/link"
import { FileQuestion, Home } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto w-14 h-14 rounded-full bg-secondary flex items-center justify-center mb-6">
          <FileQuestion className="w-7 h-7 text-muted-foreground" aria-hidden="true" />
        </div>

        <p className="text-sm font-mono text-muted-foreground mb-2">404</p>
        <h1 className="text-xl font-semibold text-foreground mb-2">页面不存在</h1>
        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
          请求的页面可能已被移除、重命名，或链接有误。
        </p>

        <Button asChild className="gap-2">
          <Link href="/dashboard">
            <Home className="w-4 h-4" aria-hidden="true" />
            返回总览看板
          </Link>
        </Button>
      </div>
    </main>
  )
}
