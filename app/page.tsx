import { redirect } from "next/navigation"

/** 根路径统一收敛到总览看板；未登录时 proxy.ts 会先拦截到 /login */
export default function RootPage() {
  redirect("/dashboard")
}
