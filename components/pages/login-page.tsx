"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  Smartphone,
  Lock,
  User,
  QrCode,
  Boxes,
  GitBranch,
  Shield,
  BarChart3,
  Zap,
  ArrowRight,
  Loader2,
  AlertCircle,
} from "lucide-react"

export function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /** 登录后回到来源页，支持深链分享 */
  const redirectTarget = searchParams.get("next") || "/dashboard"

  async function authenticate(payload: { username: string; password: string } | { method: string }) {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const body = await res.json()
      if (!res.ok) {
        setError(body?.message ?? body?.error?.message ?? "登录失败，请稍后重试")
        return
      }
      // 会话 Cookie 由服务端下发，刷新后不再丢失
      router.replace(redirectTarget)
    } catch {
      setError("网络异常，请检查连接后重试")
    } finally {
      setSubmitting(false)
    }
  }

  function handleCredentialLogin() {
    if (!username.trim() || !password.trim()) {
      setError("请输入用户名和密码")
      return
    }
    void authenticate({ username: username.trim(), password })
  }

  /** CJK 输入法下回车用于确认候选词，不应触发提交 */
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return
    if (e.nativeEvent.isComposing || e.keyCode === 229) return
    handleCredentialLogin()
  }

  return (
    <div className="min-h-screen flex bg-[hsl(var(--login-bg))]">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-[55%] relative flex-col justify-between p-12 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(199,89%,48%)]/8 via-transparent to-[hsl(199,89%,48%)]/4" />
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-[hsl(199,89%,48%)]/6 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-[hsl(199,89%,48%)]/4 rounded-full blur-[100px]" />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, hsl(199,89%,48%) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[hsl(199,89%,48%)] to-[hsl(199,89%,38%)] flex items-center justify-center shadow-lg shadow-[hsl(199,89%,48%)]/20">
              <Boxes className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-foreground block leading-tight">{"\u667A\u80FD\u6784\u5EFA\u5E73\u53F0"}</span>
              <span className="text-[11px] text-muted-foreground">{"\u79FB\u52A8\u7AEF CI/CD \u5E73\u53F0 v1.2"}</span>
            </div>
          </div>
          <ThemeToggle />
        </div>

        <div className="relative z-10 flex-1 flex flex-col justify-center gap-10 max-w-lg">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[hsl(199,89%,48%)]/10 border border-[hsl(199,89%,48%)]/20 mb-6">
              <Zap className="w-3.5 h-3.5 text-status-info" />
              <span className="text-xs text-status-info font-medium">{"\u4E00\u7AD9\u5F0F\u79FB\u52A8\u7AEF CI/CD \u95E8\u6237"}</span>
            </div>
            <h1 className="text-4xl font-bold text-foreground leading-tight text-balance">
              {"\u6784\u5EFA\u3001\u6D4B\u8BD5\u3001\u53D1\u5E03"}
              <br />
              <span className="bg-gradient-to-r from-[hsl(199,89%,48%)] to-[hsl(199,89%,65%)] bg-clip-text text-transparent">{"\u4E00\u4F53\u5316\u667A\u80FD\u6784\u5EFA\u5E73\u53F0"}</span>
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed mt-5">
              {"\u652F\u6301 iOS\u3001Android\u3001H5\u3001\u9E3F\u8499\u591A\u7AEF\u6784\u5EFA\uFF0C\u96C6\u6210\u6D41\u6C34\u7EBF\u7F16\u6392\u3001\u8D28\u91CF\u95E8\u7981\u4E0E\u53D1\u5E03\u7BA1\u7406\u3002"}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-5">
            {[
              { icon: GitBranch, title: "流水线编排", desc: "可视化拖拽式流水线编辑器" },
              { icon: Shield, title: "质量门禁", desc: "自动化检查结合 AI 分析" },
              { icon: BarChart3, title: "实时看板", desc: "构建指标与趋势分析" },
              { icon: Smartphone, title: "多端支持", desc: "iOS / Android / H5 / 鸿蒙" },
            ].map((feat) => (
              <div key={feat.title} className="flex items-start gap-3 p-3 rounded-lg bg-foreground/[0.02] border border-foreground/[0.05] hover:border-[hsl(199,89%,48%)]/20 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-[hsl(199,89%,48%)]/10 border border-[hsl(199,89%,48%)]/15 flex items-center justify-center flex-shrink-0">
                  <feat.icon className="w-4 h-4 text-status-info" />
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground leading-tight">{feat.title}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{feat.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-3 text-[11px] text-muted-foreground/60">
          <span>v1.2.0</span>
          <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
          <span>{"\u667A\u80FD\u6784\u5EFA\u5E73\u53F0"}</span>
          <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
          <span>{"\u79FB\u52A8\u8FD0\u7EF4\u7EC4\u51FA\u54C1"}</span>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[hsl(var(--login-bg))]">
        <div className="w-full max-w-[420px]">
          <div className="lg:hidden flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[hsl(199,89%,48%)] to-[hsl(199,89%,38%)] flex items-center justify-center">
                <Boxes className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-foreground">{"\u667A\u80FD\u6784\u5EFA\u5E73\u53F0"}</span>
            </div>
            <ThemeToggle />
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">{"\u6B22\u8FCE\u56DE\u6765"}</h2>
            <p className="text-muted-foreground text-sm">{"\u767B\u5F55\u4EE5\u7EE7\u7EED\u4F7F\u7528\u667A\u80FD\u6784\u5EFA\u5E73\u53F0"}</p>
          </div>

          <Tabs defaultValue="cac" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-[hsl(var(--login-card))] border border-[hsl(var(--login-card-border))] mb-6 h-10">
              <TabsTrigger value="cac" className="text-xs data-[state=active]:bg-[hsl(199,89%,48%)] data-[state=active]:text-white data-[state=active]:shadow-sm">
                CAC Login
              </TabsTrigger>
              <TabsTrigger value="wechat" className="text-xs data-[state=active]:bg-[hsl(199,89%,48%)] data-[state=active]:text-white data-[state=active]:shadow-sm">
                WeCom
              </TabsTrigger>
              <TabsTrigger value="ichangan" className="text-xs data-[state=active]:bg-[hsl(199,89%,48%)] data-[state=active]:text-white data-[state=active]:shadow-sm">
                iCHANGAN
              </TabsTrigger>
            </TabsList>

            <TabsContent value="cac">
              <Card className="border-[hsl(var(--login-card-border))] bg-[hsl(var(--login-card))]">
                <CardContent className="pt-6 space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="login-username" className="text-muted-foreground text-xs">
                      {"\u7528\u6237\u540D"}
                    </Label>
                    <div className="relative">
                      <User
                        aria-hidden="true"
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--login-subtle))]"
                      />
                      <Input
                        id="login-username"
                        placeholder="请输入 CAC 用户名"
                        autoComplete="username"
                        className="pl-10 h-10 bg-[hsl(var(--login-input-bg))] border-[hsl(var(--login-card-border))] text-foreground placeholder:text-muted-foreground/50 focus:border-[hsl(199,89%,48%)] focus:ring-1 focus:ring-[hsl(199,89%,48%)]/20 transition-all"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        onKeyDown={handleKeyDown}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-muted-foreground text-xs">
                      {"\u5BC6\u7801"}
                    </Label>
                    <div className="relative">
                      <Lock
                        aria-hidden="true"
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--login-subtle))]"
                      />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="请输入密码"
                        autoComplete="current-password"
                        className="pl-10 h-10 bg-[hsl(var(--login-input-bg))] border-[hsl(var(--login-card-border))] text-foreground placeholder:text-muted-foreground/50 focus:border-[hsl(199,89%,48%)] focus:ring-1 focus:ring-[hsl(199,89%,48%)]/20 transition-all"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={handleKeyDown}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <label className="flex items-center gap-2 text-muted-foreground cursor-pointer">
                      <input type="checkbox" className="rounded border-border" />
                      {"\u8BB0\u4F4F\u6211"}
                    </label>
                    <button className="text-status-info hover:text-[hsl(199,89%,55%)] transition-colors">{"\u5FD8\u8BB0\u5BC6\u7801\uFF1F"}</button>
                  </div>

                  {error && (
                    <div
                      role="alert"
                      className="flex items-start gap-2 p-3 rounded-md bg-accent-danger border border-status-danger/20"
                    >
                      <AlertCircle className="w-4 h-4 text-status-danger flex-shrink-0 mt-0.5" aria-hidden="true" />
                      <p className="text-xs text-status-danger leading-relaxed">{error}</p>
                    </div>
                  )}

                  <Button
                    className="w-full h-10 bg-[hsl(199,89%,48%)] hover:bg-[hsl(199,89%,42%)] text-white font-medium shadow-lg shadow-[hsl(199,89%,48%)]/20 transition-all disabled:opacity-60"
                    onClick={handleCredentialLogin}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                        {"\u767B\u5F55\u4E2D\u2026"}
                      </>
                    ) : (
                      <>
                        {"\u767B\u5F55"}
                        <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
                      </>
                    )}
                  </Button>
                  <div className="relative my-2">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-[hsl(var(--login-card-border))]" />
                    </div>
                    <div className="relative flex justify-center text-[10px]">
                      <span className="bg-[hsl(var(--login-card))] px-3 text-muted-foreground/60">{"\u6216\u4F7F\u7528 SSO \u767B\u5F55"}</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full h-10 border-[hsl(var(--login-card-border))] text-muted-foreground bg-transparent hover:bg-secondary hover:text-foreground transition-all"
                    onClick={() => void authenticate({ method: "sso" })}
                    disabled={submitting}
                  >
                    {"\u4F01\u4E1A SSO \u767B\u5F55"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="wechat">
              <Card className="border-[hsl(var(--login-card-border))] bg-[hsl(var(--login-card))]">
                <CardContent className="pt-8 pb-8 flex flex-col items-center gap-5">
                  <div className="w-52 h-52 rounded-xl bg-[hsl(var(--login-input-bg))] border-2 border-dashed border-border flex items-center justify-center">
                    <QrCode className="w-24 h-24 text-muted-foreground/30" />
                  </div>
                  <div className="text-center">
                    <p className="text-foreground text-sm">{"\u4F7F\u7528\u4F01\u4E1A\u5FAE\u4FE1\u626B\u7801\u767B\u5F55"}</p>
                    <p className="text-muted-foreground text-xs mt-1">{"\u4E8C\u7EF4\u7801\u6BCF 60 \u79D2\u81EA\u52A8\u5237\u65B0"}</p>
                  </div>
                  <Button
                    variant="outline"
                    className="border-[hsl(var(--login-card-border))] text-muted-foreground bg-transparent hover:bg-secondary hover:text-foreground transition-all"
                    onClick={() => void authenticate({ method: "wecom" })}
                    disabled={submitting}
                  >
                    {"\u6A21\u62DF\u626B\u7801\u767B\u5F55"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ichangan">
              <Card className="border-[hsl(var(--login-card-border))] bg-[hsl(var(--login-card))]">
                <CardContent className="pt-8 pb-8 flex flex-col items-center gap-5">
                  <div className="w-52 h-52 rounded-xl bg-[hsl(var(--login-input-bg))] border-2 border-dashed border-border flex items-center justify-center">
                    <Smartphone className="w-24 h-24 text-muted-foreground/30" />
                  </div>
                  <div className="text-center">
                    <p className="text-foreground text-sm">{"\u4F7F\u7528 iCHANGAN App \u626B\u7801\u767B\u5F55"}</p>
                    <p className="text-muted-foreground text-xs mt-1">{"\u6253\u5F00 App \u5E76\u70B9\u51FB\u626B\u4E00\u626B"}</p>
                  </div>
                  <Button
                    variant="outline"
                    className="border-[hsl(var(--login-card-border))] text-muted-foreground bg-transparent hover:bg-secondary hover:text-foreground transition-all"
                    onClick={() => void authenticate({ method: "ichangan" })}
                    disabled={submitting}
                  >
                    {"\u6A21\u62DF\u626B\u7801\u767B\u5F55"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
