/**
 * 仓储层 —— 数据访问的唯一入口
 *
 * ============================================================
 * 【对接企业 API 时，只需修改本文件】
 * ============================================================
 * 当前实现从 fixtures.ts 读取 mock 数据。接入真实后端时，把每个函数体
 * 替换为对企业 API 的调用即可，函数签名与返回类型保持不变，
 * 因此上层的 API 路由、SWR hooks、页面组件均无需改动。
 *
 * 例如：
 *   export async function listProjects(query: ListQuery) {
 *     const res = await fetch(`${process.env.CI_API_BASE}/projects?...`, {
 *       headers: { Authorization: `Bearer ${token}` },
 *     })
 *     if (!res.ok) throw new RepositoryError('获取项目列表失败', res.status)
 *     return res.json()
 *   }
 */

import * as fx from "@/lib/data/fixtures"
import { BASELINE_STATUS_LABELS } from "@/lib/types"
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
  ResolvedComponentVersion,
  ComponentType,
  ComponentStatus,
  TestSubmission,
  ComponentChangeset,
  BaselineStatus,
  UserRole,
  WorkbenchData,
  WorkbenchActionItem,
  WorkbenchActiveVersion,
  WorkbenchActivity,
  WorkbenchStat,
} from "@/lib/types"

/** 仓储层错误，携带 HTTP 状态码便于上层区分 404 与 500 */
export class RepositoryError extends Error {
  status: number
  constructor(message: string, status = 500) {
    super(message)
    this.name = "RepositoryError"
    this.status = status
  }
}

/**
 * 模拟网络延迟，仅在开发环境让加载态可见；生产构建下直接跳过，
 * 避免给每次调用凭空增加延迟。对接真实 API 后可整体删除。
 */
const MOCK_LATENCY_MS = 280
function delay(ms = MOCK_LATENCY_MS) {
  if (process.env.NODE_ENV === "production") return Promise.resolve()
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** 通用分页切片 */
function paginate<T>(items: T[], page = 1, pageSize = 10): Paginated<T> {
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const start = (safePage - 1) * pageSize
  return {
    items: items.slice(start, start + pageSize),
    total,
    page: safePage,
    pageSize,
    totalPages,
  }
}

function matches(haystack: string, needle?: string) {
  if (!needle) return true
  return haystack.toLowerCase().includes(needle.toLowerCase())
}

/** 生成 "YYYY-MM-DD HH:mm" 格式的当前时间，与 fixtures 保持一致 */
function now(): string {
  return new Date().toISOString().slice(0, 16).replace("T", " ")
}

// ---------- 内存态可写副本（组件 / 构建 / 提测） ----------
// mock 层用于模拟注册组件、组版构建、提测等写操作。对接企业 API 后整体删除，改为调用后端。

const componentStore: IntegrationComponent[] = fx.integrationComponents.map((c) => ({ ...c }))

/** 从构建详情派生列表摘要（去掉 stages / 产物明细 / 触发原因等详情字段） */
function toBuildSummary(detail: BuildDetail): Build {
  const { stages: _stages, artifactList: _artifactList, triggerReason: _triggerReason, ...summary } = detail
  return summary
}

const buildStore: Build[] = [...fx.builds]
const buildDetailStore: Record<string, BuildDetail> = { ...fx.buildDetails }
// 将种子组版构建详情并入构建存储，使其同时出现在「构建记录」列表与统计中
for (const detail of fx.integrationPackBuildDetails) {
  buildDetailStore[detail.id] = detail
  if (!buildStore.some((b) => b.id === detail.id)) buildStore.unshift(toBuildSummary(detail))
}

const testSubmissionStore: TestSubmission[] = fx.testSubmissions.map((t) => ({ ...t }))

let packBuildSeq = 400

// ---------- 项目 ----------

export async function listProjects(query: ListQuery = {}): Promise<Paginated<Project>> {
  await delay()
  const { search, brand, status, page = 1, pageSize = 12 } = query as ListQuery & {
    brand?: string
    status?: string
  }
  const filtered = fx.projects.filter((p) => {
    if (!matches(p.name + p.desc, search as string)) return false
    if (brand && brand !== "all" && p.brand !== brand) return false
    if (status && status !== "all" && p.status !== status) return false
    return true
  })
  return paginate(filtered, Number(page), Number(pageSize))
}

export async function getProject(id: string): Promise<Project> {
  await delay()
  const found = fx.projects.find((p) => p.id === id)
  if (!found) throw new RepositoryError(`项目 ${id} 不存在`, 404)
  return found
}

// ---------- 流水线 ----------

/**
 * 为绑定了集成组件的流水线附加“可集成”信息：组件名称与最近一次成功构建的
 * 产物版本。仅用于展示，不落库；对接企业 API 后同样在此层按构建历史计算。
 */
function withIntegrationInfo(pipeline: Pipeline): Pipeline {
  if (!pipeline.componentKey) return pipeline
  const component = componentStore.find((c) => c.key === pipeline.componentKey)
  if (!component) return pipeline
  const latestBuild = buildStore
    .filter((b) => b.componentKey === pipeline.componentKey && b.status === "success")
    .sort((a, b) => b.number - a.number)[0]
  return {
    ...pipeline,
    integration: {
      componentKey: component.key,
      componentName: component.name,
      componentType: component.type,
      latestVersion: latestBuild?.version,
      latestBuildId: latestBuild?.id,
    },
  }
}

export async function listPipelines(query: ListQuery = {}): Promise<Paginated<Pipeline>> {
  await delay()
  const { search, env, status, projectId, page = 1, pageSize = 10 } = query as ListQuery & {
    env?: string
    status?: string
    projectId?: string
  }
  const filtered = fx.pipelines.filter((p) => {
    if (!matches(p.name + p.project, search as string)) return false
    if (env && env !== "all" && p.env !== env) return false
    if (status && status !== "all" && p.lastStatus !== status) return false
    if (projectId && p.projectId !== projectId) return false
    return true
  })
  const result = paginate(filtered, Number(page), Number(pageSize))
  return { ...result, items: result.items.map(withIntegrationInfo) }
}

export async function getPipeline(id: string): Promise<Pipeline> {
  await delay()
  const found = fx.pipelines.find((p) => p.id === id)
  if (!found) throw new RepositoryError(`流水线 ${id} 不存在`, 404)
  return withIntegrationInfo(found)
}

// ---------- 构建 ----------

export async function listBuilds(query: ListQuery = {}): Promise<Paginated<Build>> {
  await delay()
  const { search, status, projectId, pipelineId, page = 1, pageSize = 10 } = query as ListQuery & {
    status?: string
    projectId?: string
    pipelineId?: string
  }
  const filtered = buildStore.filter((b) => {
    if (!matches(`${b.number}${b.project}${b.branch}${b.commit}`, search as string)) return false
    if (status && status !== "all" && b.status !== status) return false
    if (projectId && projectId !== "all" && b.projectId !== projectId) return false
    if (pipelineId && b.pipelineId !== pipelineId) return false
    return true
  })
  return paginate(filtered, Number(page), Number(pageSize))
}

export async function getBuild(id: string): Promise<BuildDetail> {
  await delay()
  const found = buildDetailStore[id]
  if (!found) throw new RepositoryError(`构建 #${id} 不存在`, 404)
  return found
}

/** 构建统计摘要，供列表页顶部卡片使用（避免用当前页数据算总量） */
export async function getBuildStats(): Promise<{
  total: number
  success: number
  failed: number
  running: number
}> {
  await delay(120)
  return {
    total: buildStore.length,
    success: buildStore.filter((b) => b.status === "success").length,
    failed: buildStore.filter((b) => b.status === "failed").length,
    running: buildStore.filter((b) => b.status === "running").length,
  }
}

// ---------- 发布 ----------

export async function listReleases(query: ListQuery = {}): Promise<Paginated<Release>> {
  await delay()
  const { search, status, platform, page = 1, pageSize = 10 } = query as ListQuery & {
    status?: string
    platform?: string
  }
  const filtered = fx.releases.filter((r) => {
    if (!matches(r.version + r.project, search as string)) return false
    if (status && status !== "all" && r.status !== status) return false
    if (platform && platform !== "all" && r.platform !== platform) return false
    return true
  })
  return paginate(filtered, Number(page), Number(pageSize))
}

// ---------- 质量门禁 ----------

export async function listQualityGateRules(): Promise<QualityGateRule[]> {
  await delay()
  return fx.qualityGateRules
}

export async function listQualityGateRuns(query: ListQuery = {}): Promise<Paginated<QualityGateRun>> {
  await delay()
  const { page = 1, pageSize = 10 } = query
  return paginate(fx.qualityGateRuns, Number(page), Number(pageSize))
}

// ---------- 审计日志 ----------

export async function listAuditLogs(query: ListQuery = {}): Promise<Paginated<AuditLogEntry>> {
  await delay()
  const { search, result, targetType, page = 1, pageSize = 10 } = query as ListQuery & {
    result?: string
    targetType?: string
  }
  const filtered = fx.auditLogs.filter((a) => {
    if (!matches(`${a.actor}${a.action}${a.target}`, search as string)) return false
    if (result && result !== "all" && a.result !== result) return false
    if (targetType && targetType !== "all" && a.targetType !== targetType) return false
    return true
  })
  return paginate(filtered, Number(page), Number(pageSize))
}

// ---------- 模板 ----------

export async function listTemplates(query: ListQuery = {}): Promise<Paginated<PipelineTemplate>> {
  await delay()
  const { search, platform, page = 1, pageSize = 12 } = query as ListQuery & { platform?: string }
  const filtered = fx.templates.filter((t) => {
    if (!matches(t.name + t.desc, search as string)) return false
    if (platform && platform !== "all" && t.platform !== platform) return false
    return true
  })
  return paginate(filtered, Number(page), Number(pageSize))
}

// ---------- 集成包 ----------

export async function listIntegrationPacks(query: ListQuery = {}): Promise<Paginated<IntegrationPack>> {
  await delay()
  const { search, category, page = 1, pageSize = 12 } = query as ListQuery & { category?: string }
  const filtered = fx.integrationPacks.filter((i) => {
    if (!matches(i.name + i.desc, search as string)) return false
    if (category && category !== "all" && i.category !== category) return false
    return true
  })
  return paginate(filtered, Number(page), Number(pageSize))
}

// ---------- 看板 ----------

export async function getDashboard(): Promise<DashboardData> {
  await delay()
  return fx.dashboard
}

// ---------- 工作台 ----------

/** 组版进行中状态对应的行动建议与紧急度 */
function baselineAction(status: BaselineStatus): { cta: string; severity: "error" | "warning" | "info"; desc: string } {
  switch (status) {
    case "draft":
      return { cta: "去冻结组版", severity: "info", desc: "依赖清单待冻结，冻结后触发组版构建" }
    case "frozen":
    case "building":
      return { cta: "查看进度", severity: "info", desc: "组版构建进行中，等待构建结果" }
    case "build_success":
      return { cta: "去提测发版", severity: "warning", desc: "组版构建成功，待提测或发版" }
    case "testing":
      return { cta: "去发版", severity: "warning", desc: "已提测，待确认正式发版" }
    default:
      return { cta: "查看详情", severity: "info", desc: "" }
  }
}

const SEVERITY_WEIGHT: Record<"error" | "warning" | "info", number> = { error: 0, warning: 1, info: 2 }

/**
 * 工作台数据聚合：以当前登录用户为中心，跨模块汇总「待我处理」的行动项、
 * 我参与中的组版版本、以及我的近期操作动态。
 * 对接企业 API 后应改为按真实用户身份与 RBAC 过滤，此处 mock 层做角色无关的全量聚合。
 */
export async function getWorkbench(user: {
  displayName: string
  role: UserRole
  email: string
}): Promise<WorkbenchData> {
  await delay()
  const me = user.displayName

  const reviewReleases = fx.releases.filter((r) => r.status === "in_review")
  const gateAlerts = fx.qualityGateRuns.filter((g) => g.result === "failed" || g.result === "warning")
  const activeBaselines = baselineStore.filter((b) => !b.isDefault && b.status !== "released")
  const failedBuilds = fx.dashboard.recentBuilds.filter((b) => b.status === "failed")

  const actionItems: WorkbenchActionItem[] = []

  for (const r of reviewReleases) {
    actionItems.push({
      id: `rel-${r.id}`,
      kind: "release_review",
      title: `${r.project} ${r.version}`,
      desc: `${r.platform} · ${r.channel} 发布审核中`,
      severity: "warning",
      href: "/releases",
      cta: "去审批",
      time: r.releasedAt,
    })
  }

  for (const g of gateAlerts) {
    actionItems.push({
      id: `gate-${g.id}`,
      kind: "quality_gate",
      title: `${g.project} #${g.buildId}`,
      desc:
        g.result === "failed"
          ? `质量门禁未通过（${g.passedCount}/${g.totalCount} 项通过）`
          : `质量门禁存在告警（${g.passedCount}/${g.totalCount} 项通过）`,
      severity: g.result === "failed" ? "error" : "warning",
      href: "/quality",
      cta: g.result === "failed" ? "去处理" : "去查看",
      time: g.checkedAt,
    })
  }

  for (const b of activeBaselines) {
    const { cta, severity, desc } = baselineAction(b.status)
    actionItems.push({
      id: `baseline-${b.version}`,
      kind: "baseline",
      title: `组版 ${b.version}`,
      desc: `${BASELINE_STATUS_LABELS[b.status]} · ${desc}`,
      severity,
      href: `/integrations/${encodeURIComponent(b.version)}`,
      cta,
      time: b.updatedAt,
    })
  }

  for (const b of failedBuilds) {
    actionItems.push({
      id: `build-${b.id}`,
      kind: "build_failed",
      title: `${b.project} #${b.id}`,
      desc: `构建失败 · ${b.branch}`,
      severity: "error",
      href: `/builds/${b.id}`,
      cta: "去排查",
      time: b.time,
    })
  }

  actionItems.sort((a, b) => SEVERITY_WEIGHT[a.severity] - SEVERITY_WEIGHT[b.severity])

  const stats: WorkbenchStat[] = [
    { key: "review", label: "待我审批", value: reviewReleases.length, tone: "warning", href: "/releases" },
    { key: "gate", label: "门禁告警", value: gateAlerts.length, tone: "danger", href: "/quality" },
    { key: "baseline", label: "进行中组版", value: activeBaselines.length, tone: "info", href: "/integrations" },
    { key: "build", label: "失败构建", value: failedBuilds.length, tone: "danger", href: "/builds" },
  ]

  const activeVersions: WorkbenchActiveVersion[] = activeBaselines
    .slice()
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map((b) => ({
      version: b.version,
      description: b.description,
      status: b.status,
      updatedAt: b.updatedAt,
      componentCount: Object.keys(b.components).length,
    }))

  const activities: WorkbenchActivity[] = fx.auditLogs.slice(0, 8).map((a) => ({
    id: a.id,
    action: a.action,
    target: a.target,
    targetType: a.targetType,
    result: a.result,
    time: a.timestamp,
    actor: a.actor,
    mine: a.actor === me,
  }))

  return {
    greetingName: user.displayName,
    role: user.role,
    email: user.email,
    stats,
    actionItems,
    activeVersions,
    activities,
  }
}

// ---------- 集成打包 / 基线依赖配置 ----------
// 内存态可写副本：mock 层用于模拟“发布集成”“新建基线”等写操作。
// 对接企业 API 后，这些写操作应改为调用后端接口，此处的内存态可整体删除。
const baselineStore: IntegrationBaseline[] = fx.integrationBaselines.map((b) => ({
  ...b,
  components: { ...b.components },
}))

function findBaseline(version: string): IntegrationBaseline | undefined {
  return baselineStore.find((b) => b.version === version)
}

function getDefaultBaseline(): IntegrationBaseline {
  const found = baselineStore.find((b) => b.isDefault)
  if (!found) throw new RepositoryError("未配置默认兜底基线，请联系平台管理员", 500)
  return found
}

/**
 * 合并指定基线与其上一基线（或默认兜底），得到每个组件的最终解析版本。
 * 优先级：本版本发布集成 > 上一基线（previousVersion） > 默认兜底基线。
 * 停用组件仅在被显式引用时出现，避免污染新版本清单。
 */
function resolveComponents(baseline: IntegrationBaseline): ResolvedComponentVersion[] {
  const defaultBaseline = getDefaultBaseline()
  const previous = baseline.previousVersion ? findBaseline(baseline.previousVersion) : undefined
  const fallback = baseline.isDefault ? baseline : previous ?? defaultBaseline
  return componentStore
    .filter(
      (component) =>
        component.status === "active" ||
        baseline.components[component.key] ||
        fallback.components[component.key],
    )
    .map((component) => {
    const explicit = baseline.components[component.key]
    if (explicit) {
      return {
        component,
        version: explicit.version,
        source: "published" as const,
        publishedAt: explicit.publishedAt,
        publishedBy: explicit.publishedBy,
        buildId: explicit.buildId,
      }
    }
    const defaultEntry = fallback.components[component.key]
    return {
      component,
      version: defaultEntry?.version ?? "未配置",
      source: "default" as const,
      publishedAt: defaultEntry?.publishedAt,
      publishedBy: defaultEntry?.publishedBy,
      buildId: defaultEntry?.buildId,
    }
  })
}

export async function listIntegrationComponents(): Promise<IntegrationComponent[]> {
  await delay()
  return componentStore
}

// ---------- 组件管理：注册 / 编辑 / 启停 ----------

export async function createIntegrationComponent(input: {
  key: string
  name: string
  type: ComponentType
  pipelineId: string
  projectId: string
  description?: string
  operator: string
}): Promise<IntegrationComponent> {
  await delay()
  const key = input.key.trim()
  const name = input.name.trim()
  if (!key) throw new RepositoryError("组件标识（key）不能为空", 400)
  if (!/^[a-z0-9-]+$/.test(key)) throw new RepositoryError("组件标识仅允许小写字母、数字与连字符", 400)
  if (!name) throw new RepositoryError("组件名称不能为空", 400)
  if (componentStore.some((c) => c.key === key)) throw new RepositoryError(`组件标识 ${key} 已存在`, 409)
  if (!input.pipelineId.trim()) throw new RepositoryError("请关联一条构建流水线", 400)

  const created: IntegrationComponent = {
    key,
    name,
    type: input.type,
    pipelineId: input.pipelineId,
    projectId: input.projectId,
    description: input.description?.trim() ?? "",
    status: "active",
  }
  componentStore.push(created)
  return created
}

export async function updateIntegrationComponent(
  key: string,
  patch: { name?: string; type?: ComponentType; pipelineId?: string; projectId?: string; description?: string },
): Promise<IntegrationComponent> {
  await delay()
  const component = componentStore.find((c) => c.key === key)
  if (!component) throw new RepositoryError(`组件 ${key} 不存在`, 404)
  if (patch.name !== undefined) {
    const name = patch.name.trim()
    if (!name) throw new RepositoryError("组件名称不能为空", 400)
    component.name = name
  }
  if (patch.type !== undefined) component.type = patch.type
  if (patch.pipelineId !== undefined) {
    if (!patch.pipelineId.trim()) throw new RepositoryError("请关联一条构建流水线", 400)
    component.pipelineId = patch.pipelineId
  }
  if (patch.projectId !== undefined) component.projectId = patch.projectId
  if (patch.description !== undefined) component.description = patch.description.trim()
  return component
}

export async function setIntegrationComponentStatus(key: string, status: ComponentStatus): Promise<IntegrationComponent> {
  await delay()
  const component = componentStore.find((c) => c.key === key)
  if (!component) throw new RepositoryError(`组件 ${key} 不存在`, 404)
  if (component.type === "shell" && status === "disabled") {
    throw new RepositoryError("壳子 App 为组版必需组件，不可停用", 409)
  }
  component.status = status
  return component
}

export async function listIntegrationBaselines(query: ListQuery = {}): Promise<Paginated<IntegrationBaseline>> {
  await delay()
  const { search, status, page = 1, pageSize = 20 } = query as ListQuery & { status?: string }
  const filtered = baselineStore.filter((b) => {
    if (!matches(b.version + (b.description ?? ""), search as string)) return false
    if (status && status !== "all" && b.status !== status) return false
    return true
  })
  const sorted = [...filtered].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return paginate(sorted, Number(page), Number(pageSize))
}

export async function getIntegrationBaseline(version: string): Promise<IntegrationBaselineDetail> {
  await delay()
  const baseline = findBaseline(version)
  if (!baseline) throw new RepositoryError(`基线版本 ${version} 不存在`, 404)
  return { ...baseline, resolvedComponents: resolveComponents(baseline) }
}

export async function createIntegrationBaseline(input: {
  version: string
  description?: string
  cloneFrom?: string
  operator: string
}): Promise<IntegrationBaseline> {
  await delay()
  const version = input.version.trim()
  if (!version) throw new RepositoryError("基线版本号不能为空", 400)
  if (findBaseline(version)) throw new RepositoryError(`基线版本 ${version} 已存在`, 409)

  let components: IntegrationBaseline["components"] = {}
  if (input.cloneFrom) {
    const source = findBaseline(input.cloneFrom)
    if (!source) throw new RepositoryError(`待克隆的基线 ${input.cloneFrom} 不存在`, 404)
    components = { ...source.components }
  }

  const now = new Date().toISOString().slice(0, 16).replace("T", " ")
  const created: IntegrationBaseline = {
    id: `baseline-${version.toLowerCase()}`,
    version,
    description: input.description,
    status: "draft",
    isDefault: false,
    components,
    createdAt: now,
    updatedAt: now,
    createdBy: input.operator,
  }
  baselineStore.unshift(created)
  return created
}

export async function publishIntegrationComponent(input: {
  baselineVersion: string
  componentKey: string
  version: string
  buildId?: string
  operator: string
}): Promise<IntegrationBaseline> {
  await delay()
  const baseline = findBaseline(input.baselineVersion)
  if (!baseline) throw new RepositoryError(`基线版本 ${input.baselineVersion} 不存在`, 404)
  if (baseline.status !== "draft") {
    throw new RepositoryError(`版本 ${baseline.version} 状态为「${BASELINE_STATUS_LABELS[baseline.status]}」，仅草稿状态可发布集成`, 409)
  }
  const component = componentStore.find((c) => c.key === input.componentKey)
  if (!component) throw new RepositoryError(`组件 ${input.componentKey} 不存在`, 404)
  if (component.status === "disabled") throw new RepositoryError(`组件 ${component.name} 已停用，不可发布集成`, 409)

  const version = input.version.trim()
  if (!version) throw new RepositoryError("发布版本号不能为空", 400)

  const ts = now()
  baseline.components[input.componentKey] = {
    version,
    publishedAt: ts,
    publishedBy: input.operator,
    buildId: input.buildId,
  }
  baseline.updatedAt = ts
  return baseline
}

// ---------- 版本发布：组版生命周期 ----------
// 草稿 → 冻结 → 组版构建中 → 构建成功 → 提测中 → 已发版
// mock 层将「冻结 → 组版构建」合并为同步完成，真实后端应异步推进 building → build_success。

/**
 * 冻结依赖配置清单并触发组版构建。
 * 生成一条壳子集成流水线的构建记录（同步 mock 为成功），并把版本状态推进到「构建成功」。
 */
export async function freezeBaseline(version: string, operator: string): Promise<IntegrationBaselineDetail> {
  await delay()
  const baseline = findBaseline(version)
  if (!baseline) throw new RepositoryError(`版本 ${version} 不存在`, 404)
  if (baseline.isDefault) throw new RepositoryError("默认兜底版本不可组版", 409)
  if (baseline.status !== "draft") {
    throw new RepositoryError(`仅草稿状态可冻结组版，当前状态：${BASELINE_STATUS_LABELS[baseline.status]}`, 409)
  }

  const resolved = resolveComponents(baseline)
  const shell = componentStore.find((c) => c.type === "shell")
  const ts = now()
  const buildId = `pack-${version.toLowerCase()}`
  const seq = packBuildSeq++

  const manifestLogs = [
    `[组版] 冻结依赖清单 baseline-${version}.json`,
    `[组版] 操作人 ${operator} 于 ${ts} 冻结`,
    `[组版] 解析 ${resolved.length} 个组件版本：`,
    ...resolved.map((r) => `        - ${r.component.name}: ${r.version} (${r.source === "published" ? "本版本发布集成" : "沿用基线"})`),
  ]

  const detail: BuildDetail = {
    id: buildId,
    number: seq,
    projectId: shell?.projectId ?? "qiyuan-app",
    project: "启源 App",
    pipelineId: shell?.pipelineId ?? "shell-app-pipeline",
    pipeline: "壳子 App 集成打包流水线",
    branch: `release/${version}`,
    commit: buildId.replace(/[^a-z0-9]/g, "").slice(0, 7),
    commitMessage: `组版 ${version} 依赖清单冻结构建`,
    status: "success",
    duration: "5m 12s",
    durationSeconds: 312,
    time: ts,
    user: operator,
    platform: "Both",
    artifacts: 2,
    componentKey: shell?.key,
    version,
    triggerReason: `版本 ${version} 冻结依赖清单后触发集成构建`,
    stages: [
      { name: "冻结与解析清单", type: "lint", status: "success", duration: "16s", logs: manifestLogs },
      { name: "下载组件产物", type: "build", status: "success", duration: "2m 20s" },
      { name: "壳子集成打包", type: "build", status: "success", duration: "2m 30s", logs: ["BUILD SUCCESSFUL", `产物: qiyuan-integration-${version}.apk`] },
      { name: "质量门禁", type: "quality-gate", status: "success", duration: "20s" },
      { name: "归档与通知", type: "notify", status: "success", duration: "6s" },
    ],
    artifactList: [
      { name: `qiyuan-integration-${version}.apk`, size: "53.2 MB", type: "APK" },
      { name: `qiyuan-integration-${version}.ipa`, size: "56.8 MB", type: "IPA" },
    ],
  }

  buildDetailStore[buildId] = detail
  buildStore.unshift(toBuildSummary(detail))

  baseline.buildId = buildId
  baseline.frozenAt = ts
  baseline.frozenBy = operator
  baseline.status = "build_success"
  baseline.updatedAt = ts
  return { ...baseline, resolvedComponents: resolveComponents(baseline) }
}

/** 组版构建成功后发起提测，生成扫码安装信息并推进到「提测中」 */
export async function submitBaselineForTest(input: {
  version: string
  operator: string
  note?: string
}): Promise<TestSubmission> {
  await delay()
  const baseline = findBaseline(input.version)
  if (!baseline) throw new RepositoryError(`版本 ${input.version} 不存在`, 404)
  if (baseline.status !== "build_success" && baseline.status !== "testing") {
    throw new RepositoryError(`仅组版构建成功后可提测，当前状态：${BASELINE_STATUS_LABELS[baseline.status]}`, 409)
  }
  if (!baseline.buildId) throw new RepositoryError("未找到组版构建产物，无法提测", 409)

  const ts = now()
  const submission: TestSubmission = {
    id: `ts-${input.version.toLowerCase()}-${testSubmissionStore.filter((t) => t.baselineVersion === baseline.version).length + 1}`,
    baselineVersion: baseline.version,
    buildId: baseline.buildId,
    buildVersion: baseline.version,
    submittedAt: ts,
    submittedBy: input.operator,
    note: input.note?.trim() || undefined,
    qrAndroidUrl: `https://pgyer.example.com/i/${input.version}-android`,
    qrIosUrl: `https://pgyer.example.com/i/${input.version}-ios`,
  }
  testSubmissionStore.unshift(submission)
  baseline.status = "testing"
  baseline.updatedAt = ts
  return submission
}

/** 正式发版：打上 git tag 并推进到「已发版」终态 */
export async function releaseBaseline(version: string, operator: string): Promise<IntegrationBaseline> {
  await delay()
  const baseline = findBaseline(version)
  if (!baseline) throw new RepositoryError(`版本 ${version} 不存在`, 404)
  if (baseline.isDefault) throw new RepositoryError("默认兜底版本不可发版", 409)
  if (baseline.status !== "testing") {
    throw new RepositoryError(`仅提测中的版本可正式发版，当前状态：${BASELINE_STATUS_LABELS[baseline.status]}`, 409)
  }
  const ts = now()
  baseline.tag = `release/${version}`
  baseline.releasedAt = ts
  baseline.releasedBy = operator
  baseline.status = "released"
  baseline.updatedAt = ts
  return baseline
}

/** 某版本的提测历史清单（按时间倒序） */
export async function listTestSubmissions(version: string): Promise<TestSubmission[]> {
  await delay()
  return testSubmissionStore
    .filter((t) => t.baselineVersion === version)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
}

/**
 * 某版本各组件的变更记录：统计距上一次成功组版 tag 之间的 git 提交。
 * mock 层根据 fixtures 的提交列表，按上一基线的 releasedAt 时间截断。
 */
export async function getBaselineChangesets(version: string): Promise<ComponentChangeset[]> {
  await delay()
  const baseline = findBaseline(version)
  if (!baseline) throw new RepositoryError(`版本 ${version} 不存在`, 404)
  const previous = baseline.previousVersion ? findBaseline(baseline.previousVersion) : undefined
  const sinceTime = previous?.releasedAt
  const resolved = resolveComponents(baseline)

  return resolved.map((r) => {
    const all = fx.componentCommits[r.component.key] ?? []
    const commits = sinceTime ? all.filter((c) => c.date.localeCompare(sinceTime) > 0) : all
    return {
      componentKey: r.component.key,
      componentName: r.component.name,
      componentType: r.component.type,
      currentVersion: r.version,
      sinceTag: previous?.tag,
      commits,
    }
  })
}
