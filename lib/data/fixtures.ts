/**
 * Mock 数据源
 *
 * 对接企业 API 后本文件可整体删除，仅需修改 repository.ts 中的取数实现。
 * 这里的数据形状严格遵循 lib/types.ts 的契约。
 */

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
  IntegrationComponent,
  IntegrationBaseline,
  TestSubmission,
  ComponentCommit,
} from "@/lib/types"

export const projects: Project[] = [
  { id: "qiyuan-app", name: "启源 App", brand: "Qiyuan", desc: "启源主应用，覆盖 iOS 与 Android 双端", platforms: ["Android", "iOS"], owner: "张伟", members: 12, pipelines: 4, successRate: 96.5, lastBuild: "2 分钟前", status: "active", repoUrl: "https://git.example.com/qiyuan/app.git", createdAt: "2025-03-12" },
  { id: "gravity-app", name: "引力 App", brand: "Gravity", desc: "引力品牌移动端应用", platforms: ["Android", "iOS", "H5"], owner: "李娜", members: 8, pipelines: 3, successRate: 93.2, lastBuild: "15 分钟前", status: "active", repoUrl: "https://git.example.com/gravity/app.git", createdAt: "2025-05-20" },
  { id: "deepblue-app", name: "深蓝 App", brand: "DeepBlue", desc: "深蓝汽车车主伴侣应用", platforms: ["Android", "iOS"], owner: "王磊", members: 15, pipelines: 5, successRate: 91.8, lastBuild: "1 小时前", status: "active", repoUrl: "https://git.example.com/deepblue/app.git", createdAt: "2024-11-08" },
  { id: "topspace-h5", name: "TopSpace H5", brand: "TopSpace", desc: "TopSpace H5 微前端应用集", platforms: ["H5"], owner: "陈晓", members: 6, pipelines: 2, successRate: 98.1, lastBuild: "30 分钟前", status: "active", createdAt: "2025-07-01" },
  { id: "mall-module", name: "商城模块", brand: "Qiyuan", desc: "电商 H5 微应用模块", platforms: ["H5"], owner: "刘洋", members: 4, pipelines: 1, successRate: 97.3, lastBuild: "2 小时前", status: "active", createdAt: "2025-09-15" },
  { id: "customer-service", name: "客服模块", brand: "Gravity", desc: "客服会话 H5 模块", platforms: ["H5"], owner: "赵敏", members: 3, pipelines: 1, successRate: 99.0, lastBuild: "5 小时前", status: "archived", createdAt: "2024-06-30" },
]

export const pipelines: Pipeline[] = [
  { id: "qiyuan-test", name: "启源测试流水线", projectId: "qiyuan-app", project: "启源 App", env: "test", status: "enabled", lastStatus: "success", lastRun: "2 分钟前", duration: "6m 32s", builds: 156, successRate: 96.5 },
  { id: "qiyuan-prod", name: "启源生产流水线", projectId: "qiyuan-app", project: "启源 App", env: "prod", status: "enabled", lastStatus: "success", lastRun: "1 小时前", duration: "8m 15s", builds: 45, successRate: 97.8 },
  { id: "gravity-ci", name: "引力 CI", projectId: "gravity-app", project: "引力 App", env: "test", status: "enabled", lastStatus: "running", lastRun: "5 分钟前", duration: "3m 12s", builds: 132, successRate: 93.2 },
  { id: "deepblue-nightly", name: "深蓝每夜构建", projectId: "deepblue-app", project: "深蓝 App", env: "test", status: "enabled", lastStatus: "failed", lastRun: "8 小时前", duration: "12m 08s", builds: 230, successRate: 91.8 },
  { id: "h5-build", name: "H5 构建流水线", projectId: "topspace-h5", project: "TopSpace H5", env: "test", status: "enabled", lastStatus: "success", lastRun: "30 分钟前", duration: "4m 18s", builds: 98, successRate: 98.1 },
  { id: "release-pipeline", name: "发布流水线", projectId: "qiyuan-app", project: "启源 App", env: "prod", status: "pending_approval", lastStatus: "success", lastRun: "2 天前", duration: "9m 44s", builds: 12, successRate: 100 },
  { id: "shell-app-pipeline", name: "壳子 App 打包流水线", projectId: "qiyuan-app", project: "启源 App", env: "test", status: "enabled", lastStatus: "success", lastRun: "10 分钟前", duration: "7m 20s", builds: 64, successRate: 97.1, componentKey: "shell-app" },
  { id: "user-center-sdk-pipeline", name: "用户中心 SDK 流水线", projectId: "qiyuan-app", project: "启源 App", env: "test", status: "enabled", lastStatus: "success", lastRun: "22 分钟前", duration: "3m 40s", builds: 88, successRate: 98.5, componentKey: "user-center-sdk" },
  { id: "payment-sdk-pipeline", name: "支付模块 SDK 流水线", projectId: "qiyuan-app", project: "启源 App", env: "test", status: "enabled", lastStatus: "success", lastRun: "45 分钟前", duration: "4m 05s", builds: 72, successRate: 96.8, componentKey: "payment-sdk" },
  { id: "mall-sdk-pipeline", name: "数字商城 SDK 流水线", projectId: "qiyuan-app", project: "启源 App", env: "test", status: "enabled", lastStatus: "success", lastRun: "1 小时前", duration: "3m 55s", builds: 51, successRate: 95.4, componentKey: "mall-sdk" },
  { id: "network-foundation-pipeline", name: "基础网络组件流水线", projectId: "qiyuan-app", project: "启源 App", env: "test", status: "enabled", lastStatus: "success", lastRun: "3 小时前", duration: "2m 18s", builds: 40, successRate: 99.2, componentKey: "network-foundation" },
]

export const builds: Build[] = [
  { id: "1284", number: 1284, projectId: "qiyuan-app", project: "启源 App", pipelineId: "qiyuan-test", pipeline: "启源测试流水线", branch: "release/v2.3", commit: "a1b2c3d", commitMessage: "修复登录页面在低版本安卓上的崩溃", status: "success", duration: "6m 32s", durationSeconds: 392, time: "2026-02-12 14:32", user: "张伟", platform: "Android", artifacts: 4 },
  { id: "1283", number: 1283, projectId: "gravity-app", project: "引力 App", pipelineId: "gravity-ci", pipeline: "引力 CI", branch: "develop", commit: "e5f6g7h", commitMessage: "接入新版埋点 SDK", status: "running", duration: "3m 12s", durationSeconds: 192, time: "2026-02-12 14:28", user: "李娜", platform: "iOS", artifacts: 0 },
  { id: "1282", number: 1282, projectId: "deepblue-app", project: "深蓝 App", pipelineId: "deepblue-nightly", pipeline: "深蓝每夜构建", branch: "hotfix/login", commit: "i9j0k1l", commitMessage: "紧急修复 OAuth 回调失败", status: "failed", duration: "8m 45s", durationSeconds: 525, time: "2026-02-12 14:15", user: "王磊", platform: "Android", artifacts: 2 },
  { id: "1281", number: 1281, projectId: "topspace-h5", project: "TopSpace H5", pipelineId: "h5-build", pipeline: "H5 构建流水线", branch: "feature/cart", commit: "m2n3o4p", commitMessage: "购物车结算流程重构", status: "success", duration: "4m 18s", durationSeconds: 258, time: "2026-02-12 13:58", user: "陈晓", platform: "H5", artifacts: 3 },
  { id: "1280", number: 1280, projectId: "mall-module", project: "商城模块", pipelineId: "h5-build", pipeline: "H5 构建流水线", branch: "develop", commit: "q5r6s7t", commitMessage: "商品详情页性能优化", status: "success", duration: "5m 55s", durationSeconds: 355, time: "2026-02-12 13:42", user: "刘洋", platform: "H5", artifacts: 2 },
  { id: "1279", number: 1279, projectId: "qiyuan-app", project: "启源 App", pipelineId: "qiyuan-test", pipeline: "启源测试流水线", branch: "develop", commit: "u8v9w0x", commitMessage: "调整首页布局间距", status: "cancelled", duration: "1m 02s", durationSeconds: 62, time: "2026-02-12 13:30", user: "张伟", platform: "iOS", artifacts: 0 },
  { id: "1278", number: 1278, projectId: "gravity-app", project: "引力 App", pipelineId: "gravity-ci", pipeline: "引力 CI", branch: "feature/newui", commit: "y1z2a3b", commitMessage: "新版 UI 组件库接入", status: "success", duration: "7m 22s", durationSeconds: 442, time: "2026-02-12 12:55", user: "李娜", platform: "Android", artifacts: 4 },
  { id: "1277", number: 1277, projectId: "deepblue-app", project: "深蓝 App", pipelineId: "release-pipeline", pipeline: "发布流水线", branch: "release/v3.2", commit: "c4d5e6f", commitMessage: "v3.2 版本发布候选", status: "success", duration: "9m 44s", durationSeconds: 584, time: "2026-02-12 12:40", user: "王磊", platform: "Android", artifacts: 5 },
  { id: "1276", number: 1276, projectId: "qiyuan-app", project: "启源 App", pipelineId: "qiyuan-prod", pipeline: "启源生产流水线", branch: "main", commit: "g7h8i9j", commitMessage: "合并 v2.2 修复补丁", status: "success", duration: "8m 15s", durationSeconds: 495, time: "2026-02-12 12:22", user: "张伟", platform: "Both", artifacts: 6 },
  { id: "1275", number: 1275, projectId: "topspace-h5", project: "TopSpace H5", pipelineId: "h5-build", pipeline: "H5 构建流水线", branch: "develop", commit: "k0l1m2n", commitMessage: "修复列表页无限滚动异常", status: "failed", duration: "3m 08s", durationSeconds: 188, time: "2026-02-12 11:58", user: "陈晓", platform: "H5", artifacts: 1 },
  { id: "1274", number: 1274, projectId: "qiyuan-app", project: "启源 App", pipelineId: "qiyuan-test", pipeline: "启源测试流水线", branch: "feature/pay", commit: "o3p4q5r", commitMessage: "支付通道灰度接入", status: "success", duration: "6m 05s", durationSeconds: 365, time: "2026-02-12 11:30", user: "刘洋", platform: "Android", artifacts: 3 },
  { id: "1273", number: 1273, projectId: "gravity-app", project: "引力 App", pipelineId: "gravity-ci", pipeline: "引力 CI", branch: "develop", commit: "s6t7u8v", commitMessage: "升级 Kotlin 版本至 2.0", status: "failed", duration: "11m 20s", durationSeconds: 680, time: "2026-02-12 10:55", user: "李娜", platform: "Android", artifacts: 0 },
  { id: "2001", number: 42, projectId: "qiyuan-app", project: "启源 App", pipelineId: "shell-app-pipeline", pipeline: "壳子 App 打包流水线", branch: "release/shell-v1.2", commit: "sh11a2b", commitMessage: "壳子容器升级路由引擎", status: "success", duration: "7m 20s", durationSeconds: 440, time: "2026-02-12 14:20", user: "张伟", platform: "Android", artifacts: 3, componentKey: "shell-app", version: "1.2.0" },
  { id: "2002", number: 31, projectId: "qiyuan-app", project: "启源 App", pipelineId: "user-center-sdk-pipeline", pipeline: "用户中心 SDK 流水线", branch: "release/uc-v3.1", commit: "uc22c3d", commitMessage: "用户中心 SDK 支持免密登录", status: "success", duration: "3m 40s", durationSeconds: 220, time: "2026-02-12 13:58", user: "刘洋", platform: "Android", artifacts: 2, componentKey: "user-center-sdk", version: "3.1.0" },
  { id: "2003", number: 27, projectId: "qiyuan-app", project: "启源 App", pipelineId: "payment-sdk-pipeline", pipeline: "支付模块 SDK 流水线", branch: "release/pay-v2.4", commit: "pa33d4e", commitMessage: "支付 SDK 新增分期付款能力", status: "success", duration: "4m 05s", durationSeconds: 245, time: "2026-02-12 13:30", user: "王磊", platform: "Android", artifacts: 2, componentKey: "payment-sdk", version: "2.4.0" },
  { id: "2004", number: 19, projectId: "qiyuan-app", project: "启源 App", pipelineId: "mall-sdk-pipeline", pipeline: "数字商城 SDK 流水线", branch: "release/mall-v1.6", commit: "ma44e5f", commitMessage: "商城 SDK 直播带货入口", status: "success", duration: "3m 55s", durationSeconds: 235, time: "2026-02-12 12:45", user: "陈晓", platform: "Android", artifacts: 2, componentKey: "mall-sdk", version: "1.6.0" },
  { id: "2005", number: 15, projectId: "qiyuan-app", project: "启源 App", pipelineId: "network-foundation-pipeline", pipeline: "基础网络组件流水线", branch: "release/net-v1.0", commit: "nt55f6g", commitMessage: "基础网络库接入 HTTP/3", status: "success", duration: "2m 18s", durationSeconds: 138, time: "2026-02-12 11:50", user: "赵敏", platform: "Android", artifacts: 1, componentKey: "network-foundation", version: "1.0.3" },
]

const successLogs = [
  "[14:32:01] 开始拉取代码仓库 release/v2.3",
  "[14:32:04] 检出提交 a1b2c3d",
  "[14:32:06] 缓存命中，跳过依赖下载",
  "[14:32:08] 执行 ./gradlew assembleRelease",
  "[14:34:52] BUILD SUCCESSFUL in 2m 44s",
  "[14:34:53] 产物已生成: app-release.apk (48.2 MB)",
]

export const buildDetails: Record<string, BuildDetail> = Object.fromEntries(
  builds.map((b) => [
    b.id,
    {
      ...b,
      triggerReason: b.status === "cancelled" ? "由 " + b.user + " 手动取消" : "推送到 " + b.branch + " 分支自动触发",
      stages: [
        { name: "代码检查", type: "lint" as const, status: "success" as const, duration: "42s" },
        { name: "单元测试", type: "test" as const, status: "success" as const, duration: "1m 18s" },
        {
          name: "构建打包",
          type: "build" as const,
          status: b.status === "failed" ? ("failed" as const) : ("success" as const),
          duration: "2m 44s",
          logs: successLogs,
        },
        {
          name: "质量门禁",
          type: "quality-gate" as const,
          status: b.status === "failed" ? ("cancelled" as const) : ("success" as const),
          duration: "38s",
        },
        {
          name: "部署发布",
          type: "deploy" as const,
          status: b.status === "failed" ? ("cancelled" as const) : b.status === "running" ? ("running" as const) : ("success" as const),
          duration: "1m 10s",
        },
      ],
      artifactList:
        b.artifacts > 0
          ? [
              { name: "app-release.apk", size: "48.2 MB", type: "APK" },
              { name: "mapping.txt", size: "2.1 MB", type: "Mapping" },
              { name: "test-report.html", size: "512 KB", type: "Report" },
              { name: "lint-results.xml", size: "128 KB", type: "Report" },
            ].slice(0, b.artifacts)
          : [],
    },
  ]),
)

export const releases: Release[] = [
  { id: "r-1", version: "v2.3.0", projectId: "qiyuan-app", project: "启源 App", platform: "Android", status: "released", channel: "应用宝 / 华为 / 小米", releasedAt: "2026-02-10 18:00", operator: "张伟", rolloutPercent: 100, notes: "新增车控快捷入口，修复若干已知问题" },
  { id: "r-2", version: "v2.3.0", projectId: "qiyuan-app", project: "启源 App", platform: "iOS", status: "in_review", channel: "App Store", releasedAt: "2026-02-11 09:20", operator: "张伟", rolloutPercent: 0, notes: "等待苹果审核" },
  { id: "r-3", version: "v1.8.2", projectId: "gravity-app", project: "引力 App", platform: "Android", status: "released", channel: "全渠道", releasedAt: "2026-02-08 15:30", operator: "李娜", rolloutPercent: 50, notes: "灰度放量 50%" },
  { id: "r-4", version: "v3.2.0", projectId: "deepblue-app", project: "深蓝 App", platform: "Android", status: "rejected", channel: "华为", releasedAt: "2026-02-07 11:00", operator: "王磊", rolloutPercent: 0, notes: "隐私协议描述不符合要求，需修改后重提" },
  { id: "r-5", version: "v1.2.0", projectId: "topspace-h5", project: "TopSpace H5", platform: "H5", status: "released", channel: "CDN", releasedAt: "2026-02-12 10:00", operator: "陈晓", rolloutPercent: 100 },
  { id: "r-6", version: "v2.2.9", projectId: "qiyuan-app", project: "启源 App", platform: "Android", status: "rolled_back", channel: "全渠道", releasedAt: "2026-02-05 20:15", operator: "张伟", rolloutPercent: 0, notes: "线上崩溃率异常，已回滚至 v2.2.8" },
]

export const qualityGateRules: QualityGateRule[] = [
  { id: "g-1", name: "单元测试覆盖率", metric: "coverage", operator: ">=", threshold: 70, unit: "%", blocking: true, enabled: true },
  { id: "g-2", name: "严重漏洞数", metric: "critical_vulnerabilities", operator: "==", threshold: 0, unit: "个", blocking: true, enabled: true },
  { id: "g-3", name: "代码重复率", metric: "duplication", operator: "<=", threshold: 5, unit: "%", blocking: false, enabled: true },
  { id: "g-4", name: "Lint 错误数", metric: "lint_errors", operator: "==", threshold: 0, unit: "个", blocking: true, enabled: true },
  { id: "g-5", name: "包体积增量", metric: "size_delta", operator: "<=", threshold: 2, unit: "MB", blocking: false, enabled: true },
  { id: "g-6", name: "技术债务比率", metric: "tech_debt", operator: "<=", threshold: 8, unit: "%", blocking: false, enabled: false },
]

export const qualityGateRuns: QualityGateRun[] = [
  { id: "gr-1", buildId: "1284", project: "启源 App", result: "passed", checkedAt: "2026-02-12 14:34", passedCount: 5, totalCount: 5 },
  { id: "gr-2", buildId: "1282", project: "深蓝 App", result: "failed", checkedAt: "2026-02-12 14:20", passedCount: 3, totalCount: 5 },
  { id: "gr-3", buildId: "1281", project: "TopSpace H5", result: "passed", checkedAt: "2026-02-12 14:02", passedCount: 5, totalCount: 5 },
  { id: "gr-4", buildId: "1280", project: "商城模块", result: "warning", checkedAt: "2026-02-12 13:46", passedCount: 4, totalCount: 5 },
  { id: "gr-5", buildId: "1278", project: "引力 App", result: "passed", checkedAt: "2026-02-12 12:59", passedCount: 5, totalCount: 5 },
]

export const auditLogs: AuditLogEntry[] = [
  { id: "a-1", actor: "张伟", action: "触发构建", target: "启源测试流水线 #1284", targetType: "pipeline", result: "success", ip: "10.20.31.55", timestamp: "2026-02-12 14:32:01", detail: "分支 release/v2.3" },
  { id: "a-2", actor: "李娜", action: "修改流水线配置", target: "引力 CI", targetType: "pipeline", result: "success", ip: "10.20.31.78", timestamp: "2026-02-12 14:10:44", detail: "新增质量门禁阶段" },
  { id: "a-3", actor: "王磊", action: "发布审批", target: "深蓝 App v3.2.0", targetType: "release", result: "failed", ip: "10.20.30.12", timestamp: "2026-02-12 13:55:20", detail: "审批被驳回：隐私协议不符合要求" },
  { id: "a-4", actor: "admin", action: "变更质量门禁", target: "单元测试覆盖率", targetType: "quality_gate", result: "success", ip: "10.20.30.2", timestamp: "2026-02-12 13:20:10", detail: "阈值 65% → 70%" },
  { id: "a-5", actor: "陈晓", action: "下载产物", target: "TopSpace H5 #1281", targetType: "artifact", result: "success", ip: "10.20.32.41", timestamp: "2026-02-12 13:05:33" },
  { id: "a-6", actor: "刘洋", action: "创建项目", target: "商城模块", targetType: "project", result: "success", ip: "10.20.32.19", timestamp: "2026-02-12 11:48:02" },
  { id: "a-7", actor: "赵敏", action: "登录", target: "智能构建平台", targetType: "auth", result: "failed", ip: "10.20.33.87", timestamp: "2026-02-12 10:31:55", detail: "密码错误，连续第 2 次" },
  { id: "a-8", actor: "张伟", action: "回滚发布", target: "启源 App v2.2.9", targetType: "release", result: "success", ip: "10.20.31.55", timestamp: "2026-02-05 20:15:00", detail: "回滚至 v2.2.8" },
]

export const templates: PipelineTemplate[] = [
  { id: "t-1", name: "Android 标准构建", desc: "适用于 Gradle 项目的标准构建流程，含 Lint、单测、打包与产物归档", platform: "Android", stages: 5, usedBy: 12, author: "平台团队", updatedAt: "2026-01-20", official: true },
  { id: "t-2", name: "iOS 标准构建", desc: "适用于 Xcode 项目，含证书管理、归档与 TestFlight 上传", platform: "iOS", stages: 6, usedBy: 8, author: "平台团队", updatedAt: "2026-01-18", official: true },
  { id: "t-3", name: "H5 微前端构建", desc: "Node 构建 + CDN 发布 + 版本灰度", platform: "H5", stages: 4, usedBy: 6, author: "平台团队", updatedAt: "2026-02-01", official: true },
  { id: "t-4", name: "全平台发布流水线", desc: "多平台并行构建，统一质量门禁与审批发布", platform: "All", stages: 8, usedBy: 4, author: "张伟", updatedAt: "2026-02-05", official: false },
  { id: "t-5", name: "每夜回归构建", desc: "定时触发的全量回归测试与报告推送", platform: "All", stages: 5, usedBy: 3, author: "王磊", updatedAt: "2026-01-28", official: false },
  { id: "t-6", name: "鸿蒙原生构建", desc: "HarmonyOS Next 应用构建与上架流程", platform: "HarmonyOS", stages: 5, usedBy: 1, author: "平台团队", updatedAt: "2026-02-10", official: true },
]

export const integrationPacks: IntegrationPack[] = [
  { id: "i-1", name: "SonarQube", category: "代码质量", desc: "静态代码分析与技术债务追踪", version: "9.9.2", installed: true, icon: "shield" },
  { id: "i-2", name: "Jira", category: "项目管理", desc: "构建结果自动回写需求与缺陷单", version: "8.20", installed: true, icon: "layout" },
  { id: "i-3", name: "企业微信", category: "通知", desc: "构建与发布结果推送到企微群", version: "4.1", installed: true, icon: "message" },
  { id: "i-4", name: "Firebase Crashlytics", category: "监控", desc: "崩溃日志采集与符号表自动上传", version: "18.6", installed: true, icon: "activity" },
  { id: "i-5", name: "蒲公英内测分发", category: "分发", desc: "构建产物自动上传至内测分发平台", version: "2.3", installed: false, icon: "upload" },
  { id: "i-6", name: "Nexus 制品库", category: "制品管理", desc: "构建产物归档与版本管理", version: "3.41", installed: true, icon: "package" },
  { id: "i-7", name: "Kubernetes", category: "部署", desc: "H5 应用容器化部署编排", version: "1.29", installed: false, icon: "server" },
  { id: "i-8", name: "LDAP / AD", category: "认证", desc: "企业统一身份认证对接", version: "3.0", installed: true, icon: "users" },
]

// ---------- 集成打包 / 基线依赖配置 ----------

export const integrationComponents: IntegrationComponent[] = [
  { key: "shell-app", name: "壳子 App", type: "shell", pipelineId: "shell-app-pipeline", projectId: "qiyuan-app", description: "承载所有业务 SDK 的基础容器应用，提供路由、启动与容器化能力", status: "active" },
  { key: "user-center-sdk", name: "用户中心 SDK", type: "business", pipelineId: "user-center-sdk-pipeline", projectId: "qiyuan-app", description: "账号、登录、个人中心相关能力封装", status: "active" },
  { key: "payment-sdk", name: "支付模块 SDK", type: "business", pipelineId: "payment-sdk-pipeline", projectId: "qiyuan-app", description: "收银台、支付通道与分期能力封装", status: "active" },
  { key: "mall-sdk", name: "数字商城 SDK", type: "business", pipelineId: "mall-sdk-pipeline", projectId: "qiyuan-app", description: "商品、购物车、直播带货等电商能力封装", status: "active" },
  { key: "network-foundation", name: "基础网络组件", type: "foundation", pipelineId: "network-foundation-pipeline", projectId: "qiyuan-app", description: "统一网络请求、缓存与协议适配基础库", status: "active" },
  { key: "legacy-im-sdk", name: "旧版 IM SDK", type: "business", pipelineId: "user-center-sdk-pipeline", projectId: "qiyuan-app", description: "已被用户中心 SDK 内聚替代的旧版即时通讯组件，暂停集成", status: "disabled" },
]

export const integrationBaselines: IntegrationBaseline[] = [
  {
    id: "baseline-v1.0.0",
    version: "V1.0.0",
    description: "壳子仓库内置的初始化依赖清单，作为所有组件未显式发布集成时的兜底版本",
    status: "released",
    isDefault: true,
    components: {
      "shell-app": { version: "1.0.0", publishedAt: "2025-12-01 10:00", publishedBy: "系统内置" },
      "user-center-sdk": { version: "1.0.0", publishedAt: "2025-12-01 10:00", publishedBy: "系统内置" },
      "payment-sdk": { version: "1.0.0", publishedAt: "2025-12-01 10:00", publishedBy: "系统内置" },
      "mall-sdk": { version: "1.0.0", publishedAt: "2025-12-01 10:00", publishedBy: "系统内置" },
      "network-foundation": { version: "1.0.0", publishedAt: "2025-12-01 10:00", publishedBy: "系统内置" },
    },
    createdAt: "2025-12-01 10:00",
    updatedAt: "2025-12-01 10:00",
    createdBy: "系统内置",
  },
  {
    id: "baseline-v3.0.0",
    version: "V3.0.0",
    description: "上一已发版基线，作为 V4.0.0 组版的依赖来源",
    status: "released",
    isDefault: false,
    previousVersion: "V1.0.0",
    components: {
      "shell-app": { version: "1.1.0", publishedAt: "2026-01-20 10:00", publishedBy: "张伟" },
      "user-center-sdk": { version: "3.0.0", publishedAt: "2026-01-20 10:00", publishedBy: "刘洋" },
      "payment-sdk": { version: "2.3.0", publishedAt: "2026-01-20 10:00", publishedBy: "王磊" },
      "mall-sdk": { version: "1.5.0", publishedAt: "2026-01-20 10:00", publishedBy: "陈晓" },
      "network-foundation": { version: "1.0.2", publishedAt: "2026-01-20 10:00", publishedBy: "赵敏" },
    },
    buildId: "pack-v3.0.0",
    frozenAt: "2026-01-20 12:00",
    frozenBy: "张伟",
    tag: "release/V3.0.0",
    releasedAt: "2026-01-22 18:00",
    releasedBy: "张伟",
    createdAt: "2026-01-18 09:00",
    updatedAt: "2026-01-22 18:00",
    createdBy: "张伟",
  },
  {
    id: "baseline-v4.0.0",
    version: "V4.0.0",
    description: "当前迭代组版版本，基于 V3.0.0 生成依赖清单，壳子与支付、用户中心已发布集成",
    status: "draft",
    isDefault: false,
    previousVersion: "V3.0.0",
    components: {
      "shell-app": { version: "1.2.0", publishedAt: "2026-02-12 14:22", publishedBy: "张伟", buildId: "2001" },
      "user-center-sdk": { version: "3.1.0", publishedAt: "2026-02-12 13:58", publishedBy: "刘洋", buildId: "2002" },
      "payment-sdk": { version: "2.4.0", publishedAt: "2026-02-12 13:32", publishedBy: "王磊", buildId: "2003" },
    },
    createdAt: "2026-02-10 09:00",
    updatedAt: "2026-02-12 14:22",
    createdBy: "张伟",
  },
]

// ---------- 组版构建（集成总流水线）详情 ----------
// 冻结依赖清单后触发的组版构建。运行时由 repository 的 buildDetailStore 承接，
// 新建的组版构建会追加进去，并同时出现在「构建记录」列表与详情页。

const packStageLogs = [
  "[18:00:01] 拉取壳子仓库 shell-app @ release/V3.0.0",
  "[18:00:06] 读取依赖清单 baseline-V3.0.0.json",
  "[18:00:09] 解析 5 个组件版本，全部命中",
  "[18:00:12] 下载各组件 SDK 产物...",
  "[18:02:40] 执行壳子集成打包 ./gradlew assembleIntegration",
  "[18:05:20] BUILD SUCCESSFUL in 2m 40s",
  "[18:05:22] 集成产物已生成: qiyuan-integration-V3.0.0.apk (52.6 MB)",
]

export const integrationPackBuildDetails: BuildDetail[] = [
  {
    id: "pack-v3.0.0",
    number: 300,
    projectId: "qiyuan-app",
    project: "启源 App",
    pipelineId: "shell-app-pipeline",
    pipeline: "壳子 App 集成打包流水线",
    branch: "release/V3.0.0",
    commit: "pk30v00",
    commitMessage: "组版 V3.0.0 依赖清单冻结构建",
    status: "success",
    duration: "5m 21s",
    durationSeconds: 321,
    time: "2026-01-20 18:00",
    user: "张伟",
    platform: "Both",
    artifacts: 2,
    componentKey: "shell-app",
    version: "V3.0.0",
    triggerReason: "组版 V3.0.0 冻结依赖清单后触发集成构建",
    stages: [
      { name: "拉取与解析清单", type: "lint", status: "success", duration: "18s", logs: packStageLogs.slice(0, 3) },
      { name: "下载组件产物", type: "build", status: "success", duration: "2m 28s", logs: packStageLogs.slice(3, 4) },
      { name: "集成打包", type: "build", status: "success", duration: "2m 40s", logs: packStageLogs.slice(4) },
      { name: "质量门禁", type: "quality-gate", status: "success", duration: "24s" },
      { name: "归档与通知", type: "notify", status: "success", duration: "11s" },
    ],
    artifactList: [
      { name: "qiyuan-integration-V3.0.0.apk", size: "52.6 MB", type: "APK" },
      { name: "qiyuan-integration-V3.0.0.ipa", size: "56.1 MB", type: "IPA" },
    ],
  },
]

// ---------- 提测记录 ----------

export const testSubmissions: TestSubmission[] = [
  {
    id: "ts-v3.0.0-1",
    baselineVersion: "V3.0.0",
    buildId: "pack-v3.0.0",
    buildVersion: "V3.0.0",
    submittedAt: "2026-01-21 09:30",
    submittedBy: "赵敏",
    note: "V3.0.0 首轮提测，覆盖登录、支付、商城主流程",
    qrAndroidUrl: "https://pgyer.example.com/i/V3.0.0-android",
    qrIosUrl: "https://pgyer.example.com/i/V3.0.0-ios",
  },
]

// ---------- 组件 git 提交记录 ----------
// 键为组件 key，值为按时间倒序的提交列表。变更记录按「距上次成功组版 tag」截断统计。

export const componentCommits: Record<string, ComponentCommit[]> = {
  "shell-app": [
    { hash: "sh1a2b3", message: "feat: 壳子容器升级路由引擎至 v2", author: "张伟", date: "2026-02-12 14:10" },
    { hash: "sh4c5d6", message: "fix: 修复冷启动白屏问题", author: "张伟", date: "2026-02-11 16:40" },
    { hash: "sh7e8f9", message: "chore: 升级 Gradle 至 8.5", author: "刘洋", date: "2026-02-09 11:20" },
  ],
  "user-center-sdk": [
    { hash: "uc1a2b3", message: "feat: 支持免密登录与一键登录", author: "刘洋", date: "2026-02-12 13:50" },
    { hash: "uc4c5d6", message: "refactor: 内聚旧版 IM 能力，下线 legacy-im-sdk", author: "刘洋", date: "2026-02-10 10:05" },
  ],
  "payment-sdk": [
    { hash: "pa1a2b3", message: "feat: 新增分期付款能力", author: "王磊", date: "2026-02-12 13:20" },
    { hash: "pa4c5d6", message: "fix: 修复支付回调偶发超时", author: "王磊", date: "2026-02-11 09:15" },
  ],
  "mall-sdk": [
    { hash: "ma1a2b3", message: "feat: 直播带货入口灰度", author: "陈晓", date: "2026-02-08 15:30" },
  ],
  "network-foundation": [
    { hash: "nt1a2b3", message: "perf: 接入 HTTP/3 提升弱网表现", author: "赵敏", date: "2026-02-07 14:00" },
  ],
}

export const dashboard: DashboardData = {
  metrics: [
    { label: "今日构建", value: "48", delta: 12.5, trend: "up" },
    { label: "成功率", value: "94.2", delta: 2.1, trend: "up", unit: "%" },
    { label: "平均耗时", value: "6.8", delta: -8.3, trend: "down", unit: "min" },
    { label: "活跃项目", value: "5", delta: 0, trend: "flat" },
  ],
  trend: [
    { date: "02-06", success: 38, failed: 4 },
    { date: "02-07", success: 42, failed: 6 },
    { date: "02-08", success: 35, failed: 3 },
    { date: "02-09", success: 48, failed: 2 },
    { date: "02-10", success: 51, failed: 5 },
    { date: "02-11", success: 45, failed: 4 },
    { date: "02-12", success: 44, failed: 3 },
  ],
  rankings: [
    { rank: 1, project: "启源 App", builds: 156, successRate: 96.5 },
    { rank: 2, project: "深蓝 App", builds: 230, successRate: 91.8 },
    { rank: 3, project: "引力 App", builds: 132, successRate: 93.2 },
    { rank: 4, project: "TopSpace H5", builds: 98, successRate: 98.1 },
    { rank: 5, project: "商城模块", builds: 64, successRate: 97.3 },
  ],
  recentBuilds: builds.slice(0, 6),
  packageSizeTrend: [
    { ver: "v5.1.0", android: 38.2, ios: 41.5 },
    { ver: "v5.2.0", android: 39.6, ios: 42.1 },
    { ver: "v5.3.0", android: 40.1, ios: 43.4 },
    { ver: "v5.4.0", android: 39.2, ios: 42.8 },
    { ver: "v5.5.0", android: 41.7, ios: 44.6 },
    { ver: "v5.6.0", android: 40.8, ios: 43.9 },
  ],
  pendingItems: [
    { type: "质量门禁", desc: "深蓝 App 单元测试覆盖率 68%，低于阈值 75%", severity: "error" },
    { type: "发布审批", desc: "启源 App v5.6.0 生产发布待审批", severity: "warning" },
    { type: "证书告警", desc: "iOS 发布证书将于 18 天后过期", severity: "warning" },
    { type: "构建队列", desc: "当前有 3 个任务排队，最长等待 4 分钟", severity: "info" },
  ],
}
