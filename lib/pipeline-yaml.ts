import {
  LineCounter,
  isMap,
  isScalar,
  isSeq,
  parseDocument,
  type Document,
  type Node,
} from "yaml"

/* ------------------------------------------------------------------ *
 * 平台流水线 Schema 定义
 * 同时用于语义校验与编辑器智能提示，保证两者永远一致。
 * ------------------------------------------------------------------ */

export type FieldDef = {
  key: string
  label: string
  detail?: string
  /** 该字段的候选值，用于 `key: ` 后的值提示 */
  values?: { value: string; label: string }[]
}

export const STAGE_TYPES = [
  { value: "checkout", label: "代码检出" },
  { value: "lint", label: "代码检查" },
  { value: "test", label: "单元测试" },
  { value: "build", label: "构建打包" },
  { value: "quality", label: "质量门禁" },
  { value: "sign", label: "签名加固" },
  { value: "deploy", label: "部署发布" },
  { value: "notify", label: "消息通知" },
] as const

export const ENVIRONMENTS = [
  { value: "dev", label: "开发环境" },
  { value: "staging", label: "预发环境" },
  { value: "production", label: "生产环境" },
] as const

export const PLATFORMS = [
  { value: "ios", label: "iOS" },
  { value: "android", label: "Android" },
  { value: "harmony", label: "HarmonyOS" },
  { value: "h5", label: "H5" },
] as const

const BOOLS = [
  { value: "true", label: "启用" },
  { value: "false", label: "禁用" },
]

/** 根级字段 */
export const ROOT_FIELDS: FieldDef[] = [
  { key: "pipeline", label: "流水线元信息", detail: "名称、环境等基础配置" },
  { key: "triggers", label: "触发条件", detail: "推送、定时、手动触发" },
  { key: "variables", label: "全局变量", detail: "在所有阶段中可引用" },
  { key: "stages", label: "阶段列表", detail: "流水线的执行阶段" },
]

export const PIPELINE_FIELDS: FieldDef[] = [
  { key: "name", label: "流水线名称", detail: "必填，唯一标识" },
  { key: "displayName", label: "展示名称" },
  {
    key: "environment",
    label: "目标环境",
    values: ENVIRONMENTS.map((e) => ({ value: e.value, label: e.label })),
  },
  {
    key: "platform",
    label: "目标平台",
    values: PLATFORMS.map((p) => ({ value: p.value, label: p.label })),
  },
  { key: "timeout", label: "整体超时", detail: "单位：分钟" },
  { key: "description", label: "描述说明" },
]

export const STAGE_FIELDS: FieldDef[] = [
  { key: "name", label: "阶段名称", detail: "必填" },
  {
    key: "type",
    label: "阶段类型",
    detail: "必填",
    values: STAGE_TYPES.map((s) => ({ value: s.value, label: s.label })),
  },
  { key: "enabled", label: "是否启用", values: BOOLS },
  { key: "timeout", label: "超时时间", detail: "单位：分钟" },
  { key: "continueOnError", label: "失败继续", values: BOOLS },
  { key: "condition", label: "执行条件", detail: "表达式，如 branch == 'main'" },
  { key: "tasks", label: "任务列表", detail: "该阶段下的具体任务" },
  { key: "artifacts", label: "产物路径" },
]

export const TASK_FIELDS: FieldDef[] = [
  { key: "name", label: "任务名称" },
  { key: "run", label: "执行命令", detail: "支持多行 shell（使用 |）" },
  { key: "uses", label: "引用插件", detail: "如 actions/gradle@v3" },
  { key: "with", label: "插件参数" },
  { key: "env", label: "环境变量" },
  { key: "workingDirectory", label: "工作目录" },
]

export const TRIGGER_FIELDS: FieldDef[] = [
  { key: "push", label: "推送触发" },
  { key: "pullRequest", label: "合并请求触发" },
  { key: "schedule", label: "定时触发", detail: "cron 表达式" },
  { key: "manual", label: "手动触发", values: BOOLS },
  { key: "branches", label: "分支过滤" },
]

export type SchemaSection = "root" | "pipeline" | "stage" | "task" | "triggers"

export const FIELDS_BY_SECTION: Record<SchemaSection, FieldDef[]> = {
  root: ROOT_FIELDS,
  pipeline: PIPELINE_FIELDS,
  stage: STAGE_FIELDS,
  task: TASK_FIELDS,
  triggers: TRIGGER_FIELDS,
}

/* ------------------------------------------------------------------ *
 * 校验
 * ------------------------------------------------------------------ */

export type Issue = {
  line: number
  message: string
  severity: "error" | "warning"
  col?: number
  /** 文档内字符偏移，供编辑器精确下划线定位 */
  from?: number
  to?: number
}

/** 将 yaml 解析器的错误码翻译为可读的中文提示 */
const ERROR_TEXT: Record<string, string> = {
  BAD_INDENT: "缩进不正确，YAML 依赖缩进表达层级",
  TAB_AS_INDENT: "不能使用 Tab 缩进，请改用空格",
  MISSING_CHAR: "缺少必要的字符（如引号或冒号）",
  UNEXPECTED_TOKEN: "出现无法识别的内容",
  DUPLICATE_KEY: "同一层级出现重复的键名",
  MULTILINE_IMPLICIT_KEY: "键名不能跨行，请检查是否缺少引号",
  BLOCK_AS_IMPLICIT_KEY: "此处不能使用块结构作为键名",
  BAD_SCALAR_START: "标量不能以该字符开头，请用引号包裹",
  MISSING_ANCHOR: "引用的锚点不存在",
  BAD_DIRECTIVE: "指令格式不正确",
  BAD_ALIAS: "别名格式不正确",
}

function describe(err: { code?: string; message: string }): string {
  const mapped = err.code ? ERROR_TEXT[err.code] : undefined
  return mapped ? mapped : err.message
}

type Loc = { line: number; col: number; from: number; to: number }

function locOf(
  range: [number, number, number] | null | undefined,
  lc: LineCounter,
  fallback: Loc,
): Loc {
  if (!range) return fallback
  const [from, valueEnd] = range
  const pos = lc.linePos(from)
  return { line: pos.line, col: pos.col, from, to: Math.max(valueEnd, from + 1) }
}

function scalarText(node: unknown): string | undefined {
  if (isScalar(node) && node.value != null) return String(node.value).trim()
  return undefined
}

/**
 * 基于真实 YAML 解析器的校验：先做语法解析，语法通过后再做平台 Schema 语义校验。
 * 语法有错时跳过语义校验，避免在半成品文本上产生大量噪音提示。
 */
export function validateYaml(src: string): Issue[] {
  if (!src.trim()) {
    return [{ line: 1, message: "配置内容为空", severity: "error" }]
  }

  const lc = new LineCounter()
  let doc: Document.Parsed
  try {
    doc = parseDocument(src, { lineCounter: lc, uniqueKeys: true, strict: false })
  } catch {
    return [{ line: 1, message: "无法解析该 YAML 文档", severity: "error" }]
  }

  const docEnd = Math.max(src.length, 1)
  const head: Loc = { line: 1, col: 1, from: 0, to: Math.min(1, docEnd) }
  const issues: Issue[] = []

  const pushAt = (
    loc: Loc,
    message: string,
    severity: "error" | "warning" = "error",
  ) => {
    issues.push({
      line: loc.line,
      col: loc.col,
      from: Math.min(loc.from, docEnd),
      to: Math.min(loc.to, docEnd),
      message,
      severity,
    })
  }

  for (const err of doc.errors) {
    const pos = lc.linePos(err.pos[0])
    pushAt(
      {
        line: pos.line,
        col: pos.col,
        from: err.pos[0],
        to: Math.max(err.pos[1], err.pos[0] + 1),
      },
      describe(err),
      "error",
    )
  }
  for (const warn of doc.warnings) {
    const pos = lc.linePos(warn.pos[0])
    pushAt(
      {
        line: pos.line,
        col: pos.col,
        from: warn.pos[0],
        to: Math.max(warn.pos[1], warn.pos[0] + 1),
      },
      describe(warn),
      "warning",
    )
  }

  // 语法错误优先修复，此时语义结构不可信
  if (doc.errors.length > 0) return issues

  const root = doc.contents as Node | null
  if (!isMap(root)) {
    pushAt(head, "配置根节点必须是键值映射结构", "error")
    return issues
  }

  const rootLoc = (key: string): Loc => {
    const node = doc.get(key, true) as Node | undefined
    return locOf(node?.range, lc, head)
  }

  // pipeline 元信息
  const pipeline = doc.get("pipeline", true)
  if (pipeline === undefined) {
    pushAt(head, "缺少 pipeline 配置块", "error")
  } else if (!isMap(pipeline)) {
    pushAt(rootLoc("pipeline"), "pipeline 必须是键值映射结构", "error")
  } else {
    const nameNode = pipeline.get("name", true) as Node | undefined
    const name = scalarText(nameNode)
    if (!name) {
      pushAt(
        locOf(pipeline.range, lc, head),
        "pipeline.name 为必填项",
        "error",
      )
    }

    const envNode = pipeline.get("environment", true) as Node | undefined
    const env = scalarText(envNode)
    if (env && !ENVIRONMENTS.some((e) => e.value === env)) {
      pushAt(
        locOf(envNode?.range, lc, head),
        `未知环境「${env}」，可选：${ENVIRONMENTS.map((e) => e.value).join(" / ")}`,
        "warning",
      )
    }

    const platNode = pipeline.get("platform", true) as Node | undefined
    const plat = scalarText(platNode)
    if (plat && !PLATFORMS.some((p) => p.value === plat)) {
      pushAt(
        locOf(platNode?.range, lc, head),
        `未知平台「${plat}」，可选：${PLATFORMS.map((p) => p.value).join(" / ")}`,
        "warning",
      )
    }
  }

  // stages 阶段列表
  const stages = doc.get("stages", true)
  if (stages === undefined) {
    pushAt(head, "缺少 stages 阶段列表", "error")
    return issues
  }
  if (!isSeq(stages)) {
    pushAt(rootLoc("stages"), "stages 必须是列表（每项以 - 开头）", "error")
    return issues
  }
  if (stages.items.length === 0) {
    pushAt(rootLoc("stages"), "stages 至少需要包含一个阶段", "warning")
    return issues
  }

  const knownStageKeys = new Set(STAGE_FIELDS.map((f) => f.key))
  const seenNames = new Map<string, number>()

  stages.items.forEach((item, index) => {
    const itemLoc = locOf((item as Node)?.range, lc, head)

    if (!isMap(item)) {
      pushAt(itemLoc, `第 ${index + 1} 个阶段必须是键值映射结构`, "error")
      return
    }

    const nameNode = item.get("name", true) as Node | undefined
    const name = scalarText(nameNode)
    if (!name) {
      pushAt(itemLoc, `第 ${index + 1} 个阶段缺少 name`, "error")
    } else {
      const prev = seenNames.get(name)
      if (prev !== undefined) {
        pushAt(
          locOf(nameNode?.range, lc, head),
          `阶段名「${name}」与第 ${prev} 个阶段重复`,
          "warning",
        )
      } else {
        seenNames.set(name, index + 1)
      }
    }

    const typeNode = item.get("type", true) as Node | undefined
    const type = scalarText(typeNode)
    if (!type) {
      pushAt(itemLoc, `阶段「${name ?? index + 1}」缺少 type`, "error")
    } else if (!STAGE_TYPES.some((s) => s.value === type)) {
      pushAt(
        locOf(typeNode?.range, lc, head),
        `未知阶段类型「${type}」，可选：${STAGE_TYPES.map((s) => s.value).join(" / ")}`,
        "error",
      )
    }

    const timeoutNode = item.get("timeout", true) as Node | undefined
    if (timeoutNode !== undefined) {
      const raw = isScalar(timeoutNode) ? timeoutNode.value : undefined
      if (typeof raw !== "number") {
        pushAt(
          locOf(timeoutNode.range, lc, head),
          "timeout 应为数字（单位：分钟）",
          "warning",
        )
      }
    }

    for (const pair of item.items) {
      const key = scalarText(pair.key)
      if (key && !knownStageKeys.has(key)) {
        pushAt(
          locOf((pair.key as Node)?.range, lc, head),
          `阶段中出现未知字段「${key}」`,
          "warning",
        )
      }
    }
  })

  return issues
}

/** 提取阶段名，用于状态栏实时反馈 */
export function parseStageNames(src: string): string[] {
  try {
    const doc = parseDocument(src, { strict: false })
    const stages = doc.get("stages", true)
    if (!isSeq(stages)) return []
    return stages.items
      .map((item) => (isMap(item) ? scalarText(item.get("name", true)) : undefined))
      .filter((n): n is string => Boolean(n))
  } catch {
    return []
  }
}

/**
 * 规范化格式。语法正确时用解析器重新序列化（真正的格式化），
 * 语法有误时退化为安全的空白清理，避免破坏用户正在编辑的内容。
 */
export function formatYaml(src: string): string {
  try {
    const doc = parseDocument(src, { strict: false })
    if (doc.errors.length === 0) {
      return doc.toString({ indent: 2, lineWidth: 0, nullStr: "" })
    }
  } catch {
    /* 落到下面的兜底清理 */
  }
  return src
    .replace(/\t/g, "  ")
    .split("\n")
    .map((l) => l.replace(/\s+$/, ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\s*$/, "\n")
}
