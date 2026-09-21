/**
 * 平台领域模型定义
 *
 * 这里是前后端的契约层。对接企业 API 时，保持这些类型不变，
 * 仅需在 lib/data/repository.ts 中把 mock 实现替换为真实请求。
 */

// ---------- 枚举 ----------

export type Platform = "Android" | "iOS" | "H5" | "HarmonyOS"

export type BuildStatus = "success" | "failed" | "running" | "cancelled" | "pending"

export type PipelineEnv = "dev" | "test" | "staging" | "prod"

export type PipelineStatus = "enabled" | "disabled" | "pending_approval"

export type ProjectStatus = "active" | "archived"

export type StageType = "lint" | "test" | "build" | "quality-gate" | "deploy" | "notify"

export type ReleaseStatus = "released" | "in_review" | "rejected" | "draft" | "rolled_back"

export type GateResult = "passed" | "failed" | "warning"

export type Brand = "Qiyuan" | "Gravity" | "DeepBlue" | "TopSpace"

// ---------- 枚举展示标签 ----------
// 键为稳定的英文标识（用于 API 传参与筛选），值为界面展示的中文名。
// 二者分离，避免中文文案变更影响数据契约。

export const BRAND_LABELS: { value: Brand; label: string }[] = [
  { value: "Qiyuan", label: "启源" },
  { value: "Gravity", label: "引力" },
  { value: "DeepBlue", label: "深蓝" },
  { value: "TopSpace", label: "天穹" },
]

export const PLATFORM_LABELS: Record<Platform, string> = {
  Android: "Android",
  iOS: "iOS",
  H5: "H5",
  HarmonyOS: "鸿蒙",
}

export const BUILD_STATUS_LABELS: Record<BuildStatus, string> = {
  success: "成功",
  failed: "失败",
  running: "运行中",
  cancelled: "已取消",
  pending: "排队中",
}

export const PIPELINE_ENV_LABELS: Record<PipelineEnv, string> = {
  dev: "开发",
  test: "测试",
  staging: "预发",
  prod: "生产",
}

export const PIPELINE_STATUS_LABELS: Record<PipelineStatus, string> = {
  enabled: "已启用",
  disabled: "已停用",
  pending_approval: "待审批",
}

export function brandLabel(brand: Brand): string {
  return BRAND_LABELS.find((b) => b.value === brand)?.label ?? brand
}

export const RELEASE_STATUS_LABELS: Record<ReleaseStatus, string> = {
  released: "已发布",
  in_review: "审核中",
  rejected: "已拒绝",
  draft: "草稿",
  rolled_back: "已回滚",
}

export const GATE_RESULT_LABELS: Record<GateResult, string> = {
  passed: "通过",
  failed: "未通过",
  warning: "警告",
}

// ---------- 实体 ----------

export interface Project {
  id: string
  name: string
  brand: Brand
  desc: string
  platforms: Platform[]
  owner: string
  members: number
  pipelines: number
  successRate: number
  lastBuild: string
  status: ProjectStatus
  repoUrl?: string
  createdAt: string
}

export interface Pipeline {
  id: string
  name: string
  projectId: string
  project: string
  env: PipelineEnv
  status: PipelineStatus
  lastStatus: BuildStatus
  lastRun: string
  duration: string
  builds: number
  successRate: number
  /** 关联的集成组件标识；仅集成打包场景下的流水线设置此字段 */
  componentKey?: string
  /** 集成信息（只读，由仓储层按 componentKey 计算附加，不落库）：该流水线是否可发布集成、最新可发布的构建版本 */
  integration?: PipelineIntegrationInfo
}

/** 流水线可集成信息：附加在列表/详情响应上，供“流水线管理”呈现集成入口 */
export interface PipelineIntegrationInfo {
  componentKey: string
  componentName: string
  componentType: ComponentType
  /** 最近一次成功构建的产物版本；若尚无成功构建则为空 */
  latestVersion?: string
  latestBuildId?: string
}

export interface Build {
  id: string
  number: number
  projectId: string
  project: string
  pipelineId: string
  pipeline: string
  branch: string
  commit: string
  commitMessage?: string
  status: BuildStatus
  duration: string
  durationSeconds: number
  time: string
  user: string
  platform: Platform | "Both"
  artifacts: number
  /** 关联的集成组件标识与本次构建产出的版本号；仅集成打包场景下的构建设置 */
  componentKey?: string
  version?: string
}

export interface BuildStage {
  name: string
  type: StageType
  status: BuildStatus
  duration: string
  logs?: string[]
}

export interface BuildDetail extends Build {
  stages: BuildStage[]
  artifactList: Artifact[]
  triggerReason: string
}

export interface Artifact {
  name: string
  size: string
  type: string
  downloadUrl?: string
}

export interface Release {
  id: string
  version: string
  projectId: string
  project: string
  platform: Platform
  status: ReleaseStatus
  channel: string
  releasedAt: string
  operator: string
  rolloutPercent: number
  notes?: string
}

export interface QualityGateRule {
  id: string
  name: string
  metric: string
  operator: ">=" | "<=" | "==" | ">" | "<"
  threshold: number
  unit: string
  blocking: boolean
  enabled: boolean
}

export interface QualityGateRun {
  id: string
  buildId: string
  project: string
  result: GateResult
  checkedAt: string
  passedCount: number
  totalCount: number
}

export interface AuditLogEntry {
  id: string
  actor: string
  action: string
  target: string
  targetType: string
  result: "success" | "failed"
  ip: string
  timestamp: string
  detail?: string
}

export interface PipelineTemplate {
  id: string
  name: string
  desc: string
  platform: Platform | "All"
  stages: number
  usedBy: number
  author: string
  updatedAt: string
  official: boolean
}

export interface IntegrationPack {
  id: string
  name: string
  category: string
  desc: string
  version: string
  installed: boolean
  icon: string
}

// ---------- 集成打包 / 基线依赖配置 ----------
// 见《App组件集成打包方案》：每个组件（含壳子 App）各自流水线打包，
// 通过“发布集成”写入指定基线版本的依赖配置；集成总流水线按基线版本
// 加载各组件版本，未显式发布的组件回落到默认基线（初始兜底版本）。

export type ComponentType = "shell" | "business" | "foundation"

export type ComponentStatus = "active" | "disabled"

/**
 * 组版版本（基线）的生命周期：
 * 草稿 → 冻结 → 组版构建中 → 构建成功 → 提测中 → 已发版
 * 其中 frozen / building 为 mock 层瞬时过渡态（真实后端异步组版时才会持续可见）。
 */
export type BaselineStatus = "draft" | "frozen" | "building" | "build_success" | "testing" | "released"

export const COMPONENT_TYPE_LABELS: Record<ComponentType, string> = {
  shell: "壳子 App",
  business: "业务组件",
  foundation: "基础组件",
}

export const COMPONENT_STATUS_LABELS: Record<ComponentStatus, string> = {
  active: "启用",
  disabled: "停用",
}

export const BASELINE_STATUS_LABELS: Record<BaselineStatus, string> = {
  draft: "草稿",
  frozen: "已冻结",
  building: "组版构建中",
  build_success: "构建成功",
  testing: "提测中",
  released: "已发版",
}

export interface IntegrationComponent {
  key: string
  name: string
  type: ComponentType
  pipelineId: string
  projectId: string
  description: string
  status: ComponentStatus
}

export interface BaselineComponentEntry {
  version: string
  publishedAt: string
  publishedBy: string
  buildId?: string
}

export interface IntegrationBaseline {
  id: string
  version: string
  description?: string
  status: BaselineStatus
  isDefault: boolean
  components: Record<string, BaselineComponentEntry>
  createdAt: string
  updatedAt: string
  createdBy: string
  /** 克隆来源基线版本，用于变更记录中「距上一基线 tag」的 commit 统计 */
  previousVersion?: string
  /** 冻结并触发组版构建后关联的构建 ID */
  buildId?: string
  frozenAt?: string
  frozenBy?: string
  /** 正式发版后自动打上的 git tag，如 release/V4.0.0 */
  tag?: string
  releasedAt?: string
  releasedBy?: string
}

/** 提测记录：组版构建成功后由测试人员发起，携带扫码安装信息 */
export interface TestSubmission {
  id: string
  baselineVersion: string
  buildId: string
  buildVersion: string
  submittedAt: string
  submittedBy: string
  note?: string
  qrAndroidUrl?: string
  qrIosUrl?: string
}

/** 单条 git 提交记录 */
export interface ComponentCommit {
  hash: string
  message: string
  author: string
  date: string
}

/** 某组件在当前组版版本中距上次成功组版 tag 之间的提交变更集 */
export interface ComponentChangeset {
  componentKey: string
  componentName: string
  componentType: ComponentType
  currentVersion: string
  sinceTag?: string
  commits: ComponentCommit[]
}

/** 基线解析结果：合并显式发布记录与默认基线兜底版本，仅用于展示，不落库 */
export interface ResolvedComponentVersion {
  component: IntegrationComponent
  version: string
  source: "published" | "default"
  publishedAt?: string
  publishedBy?: string
  buildId?: string
}

export interface IntegrationBaselineDetail extends IntegrationBaseline {
  resolvedComponents: ResolvedComponentVersion[]
}

// ---------- 看板 ----------

export interface DashboardMetric {
  label: string
  value: string
  delta: number
  trend: "up" | "down" | "flat"
  unit?: string
}

export interface DashboardTrendPoint {
  date: string
  success: number
  failed: number
}

export interface ProjectRanking {
  rank: number
  project: string
  builds: number
  successRate: number
}

/** 包体积趋势：按版本号记录各端产物大小（MB） */
export interface PackageSizePoint {
  ver: string
  android: number
  ios: number
}

/** 待处理事项：需要人工介入的告警与审批 */
export interface PendingItem {
  type: string
  desc: string
  severity: "error" | "warning" | "info"
}

export interface DashboardData {
  metrics: DashboardMetric[]
  trend: DashboardTrendPoint[]
  rankings: ProjectRanking[]
  recentBuilds: Build[]
  packageSizeTrend: PackageSizePoint[]
  pendingItems: PendingItem[]
}

// ---------- 工作台（以“我”为中心的行动视角） ----------

/** 待处理事项来源模块 */
export type WorkbenchActionKind = "release_review" | "quality_gate" | "baseline" | "build_failed"

/** 工作台待办卡片：跨模块聚合的、需要当前用户跟进的行动项 */
export interface WorkbenchActionItem {
  id: string
  kind: WorkbenchActionKind
  /** 主对象，如「启源 App v2.3.0」 */
  title: string
  /** 一句话说明 */
  desc: string
  severity: "error" | "warning" | "info"
  /** 点击跳转的目标模块（深链） */
  href: string
  /** 行动按钮文案，如「去审批」 */
  cta: string
  time: string
}

/** 工作台顶部个人指标卡 */
export interface WorkbenchStat {
  key: string
  label: string
  value: number
  tone: "danger" | "warning" | "info" | "success"
  href: string
}

/** 我参与中的组版版本（未发版），用于展示生命周期进度 */
export interface WorkbenchActiveVersion {
  version: string
  description?: string
  status: BaselineStatus
  updatedAt: string
  componentCount: number
}

/** 我的近期动态（来自审计日志） */
export interface WorkbenchActivity {
  id: string
  action: string
  target: string
  targetType: string
  result: "success" | "failed"
  time: string
  actor: string
  /** 是否为当前登录用户本人的操作 */
  mine: boolean
}

export interface WorkbenchData {
  greetingName: string
  role: UserRole
  email: string
  stats: WorkbenchStat[]
  actionItems: WorkbenchActionItem[]
  activeVersions: WorkbenchActiveVersion[]
  activities: WorkbenchActivity[]
}

// ---------- 会话 / 身份 ----------

export type UserRole = "super_admin" | "admin" | "developer" | "viewer"

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "超级管理员",
  admin: "管理员",
  developer: "开发者",
  viewer: "只读用户",
}

export interface SessionUser {
  username: string
  displayName: string
  role: UserRole
  email: string
}

// ---------- 通用响应 ----------

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ApiError {
  message: string
  code?: string
}

/** 列表查询参数 */
export interface ListQuery {
  page?: number
  pageSize?: number
  search?: string
  [key: string]: string | number | undefined
}
