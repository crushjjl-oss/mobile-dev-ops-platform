"use client"

/**
 * 数据获取 hooks —— 页面组件的统一取数入口
 *
 * 基于 SWR，自动提供缓存、请求去重、焦点重新校验与轮询能力。
 * 对接企业 API 时本文件无需改动（改 repository.ts 即可）。
 */

import useSWR from "swr"
import type {
  Project,
  Pipeline,
  Build,
  BuildDetail,
  Release,
  QualityGateRule,
  QualityGateRun,
  AuditLogEntry,
  PipelineTemplate,
  IntegrationPack,
  DashboardData,
  Paginated,
  ListQuery,
  IntegrationComponent,
  IntegrationBaseline,
  IntegrationBaselineDetail,
  TestSubmission,
  ComponentChangeset,
  SessionUser,
  WorkbenchData,
} from "@/lib/types"

/** 携带状态码与中文消息的请求错误 */
export class FetchError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = "FetchError"
    this.status = status
  }
}

async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    let message = "请求失败，请稍后重试"
    try {
      const body = await res.json()
      if (body?.message) message = body.message
    } catch {
      // 响应体非 JSON，沿用默认消息
    }
    throw new FetchError(message, res.status)
  }
  return res.json()
}

/** 把查询参数序列化为稳定的 URL（键排序，保证 SWR 缓存键一致） */
function buildUrl(base: string, query: ListQuery = {}): string {
  const entries = Object.entries(query)
    .filter(([, v]) => v !== undefined && v !== "" && v !== null)
    .sort(([a], [b]) => a.localeCompare(b))
  if (entries.length === 0) return base
  const params = new URLSearchParams()
  for (const [k, v] of entries) params.set(k, String(v))
  return `${base}?${params.toString()}`
}

const listConfig = {
  keepPreviousData: true,
  revalidateOnFocus: false,
}

// ---------- 会话 ----------

export function useSession() {
  return useSWR<SessionUser>("/api/auth/session", fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  })
}

// ---------- 看板 ----------

export function useDashboard() {
  return useSWR<DashboardData>("/api/dashboard", fetcher, {
    refreshInterval: 30_000,
    revalidateOnFocus: true,
  })
}

// ---------- 工作台 ----------

export function useWorkbench() {
  return useSWR<WorkbenchData>("/api/workbench", fetcher, {
    refreshInterval: 30_000,
    revalidateOnFocus: true,
  })
}

// ---------- 项目 ----------

export function useProjects(query: ListQuery = {}) {
  return useSWR<Paginated<Project>>(buildUrl("/api/projects", query), fetcher, listConfig)
}

export function useProject(id: string | null) {
  return useSWR<Project>(id ? `/api/projects/${id}` : null, fetcher)
}

// ---------- 流水线 ----------

export function usePipelines(query: ListQuery = {}) {
  return useSWR<Paginated<Pipeline>>(buildUrl("/api/pipelines", query), fetcher, listConfig)
}

export function usePipeline(id: string | null) {
  return useSWR<Pipeline>(id ? `/api/pipelines/${id}` : null, fetcher)
}

// ---------- 构建 ----------

export function useBuilds(query: ListQuery = {}) {
  return useSWR<Paginated<Build>>(buildUrl("/api/builds", query), fetcher, {
    ...listConfig,
    refreshInterval: 15_000,
  })
}

export function useBuild(id: string | null) {
  return useSWR<BuildDetail>(id ? `/api/builds/${id}` : null, fetcher, {
    // 运行中的构建需要持续刷新日志与阶段状态
    refreshInterval: (data) => (data?.status === "running" ? 5_000 : 0),
  })
}

export function useBuildStats() {
  return useSWR<{ total: number; success: number; failed: number; running: number }>(
    "/api/builds/stats",
    fetcher,
    { refreshInterval: 30_000 },
  )
}

// ---------- 发布 ----------

export function useReleases(query: ListQuery = {}) {
  return useSWR<Paginated<Release>>(buildUrl("/api/releases", query), fetcher, listConfig)
}

// ---------- 质量门禁 ----------

export function useQualityGateRules() {
  return useSWR<QualityGateRule[]>("/api/quality-gates/rules", fetcher)
}

export function useQualityGateRuns(query: ListQuery = {}) {
  return useSWR<Paginated<QualityGateRun>>(buildUrl("/api/quality-gates/runs", query), fetcher, listConfig)
}

// ---------- 审计日志 ----------

export function useAuditLogs(query: ListQuery = {}) {
  return useSWR<Paginated<AuditLogEntry>>(buildUrl("/api/audit-logs", query), fetcher, listConfig)
}

// ---------- 模板 ----------

export function useTemplates(query: ListQuery = {}) {
  return useSWR<Paginated<PipelineTemplate>>(buildUrl("/api/templates", query), fetcher, listConfig)
}

// ---------- 集成包 ----------

export function useIntegrationPacks(query: ListQuery = {}) {
  return useSWR<Paginated<IntegrationPack>>(buildUrl("/api/integrations", query), fetcher, listConfig)
}

// ---------- 集成打包 / 基线依赖配置 ----------

export function useIntegrationComponents() {
  return useSWR<IntegrationComponent[]>("/api/integration-components", fetcher)
}

export function useIntegrationBaselines(query: ListQuery = {}) {
  return useSWR<Paginated<IntegrationBaseline>>(buildUrl("/api/integration-baselines", query), fetcher, listConfig)
}

export function useIntegrationBaseline(version: string | null) {
  return useSWR<IntegrationBaselineDetail>(
    version ? `/api/integration-baselines/${encodeURIComponent(version)}` : null,
    fetcher,
    {
      // 组版构建 / 提测过程中状态会流转，进行中时轮询以驱动工作台阶段更新
      refreshInterval: (data) =>
        data?.status === "building" || data?.status === "frozen" ? 4_000 : 0,
    },
  )
}

/** 某组版版本的提测历史 */
export function useTestSubmissions(version: string | null) {
  return useSWR<TestSubmission[]>(
    version ? `/api/integration-baselines/${encodeURIComponent(version)}/test-submissions` : null,
    fetcher,
  )
}

/** 某组版版本下各组件距上次组版 tag 的 git 提交变更集 */
export function useBaselineChangesets(version: string | null) {
  return useSWR<ComponentChangeset[]>(
    version ? `/api/integration-baselines/${encodeURIComponent(version)}/changesets` : null,
    fetcher,
  )
}
