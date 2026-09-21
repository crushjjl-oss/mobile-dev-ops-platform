"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTheme } from "next-themes"
import { Compartment, EditorState } from "@codemirror/state"
import {
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
} from "@codemirror/view"
import {
  bracketMatching,
  foldGutter,
  foldKeymap,
  indentOnInput,
  indentUnit,
  syntaxHighlighting,
  HighlightStyle,
} from "@codemirror/language"
import { yaml as yamlLang } from "@codemirror/lang-yaml"
import { linter, lintGutter, type Diagnostic } from "@codemirror/lint"
import {
  autocompletion,
  closeBrackets,
  closeBracketsKeymap,
  completionKeymap,
  type Completion,
  type CompletionContext,
  type CompletionResult,
} from "@codemirror/autocomplete"
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from "@codemirror/commands"
import {
  highlightSelectionMatches,
  openSearchPanel,
  search,
  searchKeymap,
} from "@codemirror/search"
import { tags as t } from "@lezer/highlight"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  Download,
  RotateCcw,
  Save,
  Search,
  Sparkles,
  XCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  FIELDS_BY_SECTION,
  formatYaml,
  parseStageNames,
  validateYaml,
  type FieldDef,
  type Issue,
  type SchemaSection,
} from "@/lib/pipeline-yaml"

// 保持既有导入路径可用
export { validateYaml } from "@/lib/pipeline-yaml"
export type { Issue } from "@/lib/pipeline-yaml"

/* ------------------------------------------------------------------ *
 * 主题：完全走设计 token，随浅色/深色自动切换
 * ------------------------------------------------------------------ */

/**
 * 等宽字体栈必须带 CJK 回退，否则阶段名等中文内容会渲染成豆腐块。
 * 与 tailwind.config.ts 的 fontFamily.mono 保持一致。
 */
const MONO_STACK = [
  "var(--font-jetbrains)",
  "var(--font-noto-sc)",
  '"PingFang SC"',
  '"Microsoft YaHei"',
  "ui-monospace",
  "SFMono-Regular",
  "Menlo",
  "monospace",
].join(", ")

/**
 * 无衬线字体栈，用于浮层与面板（诊断提示、查找栏、补全说明）。
 * 注意：项目并未定义 --font-sans 这个 CSS 变量（实际为 --font-inter
 * 与 --font-noto-sc），直接写 var(--font-sans) 会回退到无 CJK 字形的
 * 默认字体，导致中文渲染成豆腐块。
 */
const SANS_STACK = [
  "var(--font-inter)",
  "var(--font-noto-sc)",
  '"PingFang SC"',
  '"Microsoft YaHei"',
  "ui-sans-serif",
  "system-ui",
  "sans-serif",
].join(", ")

/**
 * 折叠箭头用 SVG 绘制。CodeMirror 默认使用 "⌄" / "›" 字符，
 * 等宽字体缺少该字形时会渲染成豆腐块。
 */
function foldMarkerDOM(open: boolean): HTMLElement {
  const wrap = document.createElement("span")
  wrap.setAttribute("aria-hidden", "true")
  wrap.style.display = "inline-flex"
  wrap.style.alignItems = "center"
  wrap.style.justifyContent = "center"
  wrap.style.width = "12px"
  wrap.style.height = "100%"
  wrap.style.opacity = open ? "0.45" : "0.9"
  wrap.innerHTML =
    `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" ` +
    `stroke-width="3" stroke-linecap="round" stroke-linejoin="round" ` +
    `style="transform: rotate(${open ? 0 : -90}deg); transition: transform 120ms">` +
    `<polyline points="6 9 12 15 18 9" /></svg>`
  return wrap
}

function buildTheme(dark: boolean) {
  return EditorView.theme(
    {
      "&": {
        height: "100%",
        backgroundColor: "transparent",
        color: "hsl(var(--foreground))",
        fontSize: "13px",
      },
      "&.cm-focused": { outline: "none" },
      ".cm-scroller": {
        fontFamily: MONO_STACK,
        lineHeight: "1.7",
      },
      ".cm-content": { padding: "12px 0", caretColor: "hsl(199 89% 48%)" },
      ".cm-cursor, .cm-dropCursor": {
        borderLeftColor: "hsl(199 89% 48%)",
        borderLeftWidth: "2px",
      },
      ".cm-gutters": {
        backgroundColor: "hsl(var(--muted) / 0.4)",
        color: "hsl(var(--muted-foreground) / 0.65)",
        border: "none",
        borderRight: "1px solid hsl(var(--border))",
        fontVariantNumeric: "tabular-nums",
      },
      ".cm-lineNumbers .cm-gutterElement": { padding: "0 10px 0 16px" },
      ".cm-activeLineGutter": {
        backgroundColor: "hsl(var(--muted) / 0.75)",
        color: "hsl(var(--foreground))",
      },
      ".cm-activeLine": { backgroundColor: "hsl(var(--muted) / 0.3)" },
      ".cm-selectionBackground, ::selection": {
        backgroundColor: "hsl(199 89% 48% / 0.22)",
      },
      "&.cm-focused .cm-selectionBackground": {
        backgroundColor: "hsl(199 89% 48% / 0.3)",
      },
      ".cm-selectionMatch": { backgroundColor: "hsl(38 92% 50% / 0.22)" },
      ".cm-matchingBracket, &.cm-focused .cm-matchingBracket": {
        backgroundColor: "hsl(199 89% 48% / 0.2)",
        outline: "1px solid hsl(199 89% 48% / 0.5)",
        color: "inherit",
      },
      ".cm-foldGutter .cm-gutterElement": { padding: "0 4px", cursor: "pointer" },
      // 提示与自动补全浮层
      ".cm-tooltip": {
        backgroundColor: "hsl(var(--popover))",
        color: "hsl(var(--popover-foreground))",
        border: "1px solid hsl(var(--border))",
        borderRadius: "8px",
        boxShadow: "0 8px 24px hsl(0 0% 0% / 0.18)",
        overflow: "hidden",
      },
      ".cm-tooltip.cm-tooltip-autocomplete > ul": {
        fontFamily: MONO_STACK,
        fontSize: "12px",
        maxHeight: "220px",
      },
      ".cm-tooltip.cm-tooltip-autocomplete > ul > li": {
        padding: "5px 10px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
      },
      ".cm-tooltip-autocomplete ul li[aria-selected]": {
        backgroundColor: "hsl(199 89% 48%)",
        color: "hsl(0 0% 100%)",
      },
      ".cm-completionLabel": { flex: "none" },
      ".cm-completionDetail": {
        marginLeft: "auto",
        fontStyle: "normal",
        opacity: 0.7,
        fontSize: "11px",
      },
      ".cm-diagnostic": {
        fontFamily: SANS_STACK,
        fontSize: "12px",
        padding: "6px 10px",
        borderLeftWidth: "3px",
      },
      ".cm-diagnostic-error": { borderLeftColor: "hsl(var(--status-danger))" },
      ".cm-diagnostic-warning": { borderLeftColor: "hsl(var(--status-warning))" },
      ".cm-lintRange-error": {
        backgroundImage: "none",
        borderBottom: "2px wavy hsl(var(--status-danger))",
        textDecoration: "underline wavy hsl(var(--status-danger))",
        textDecorationSkipInk: "none",
      },
      ".cm-lintRange-warning": {
        backgroundImage: "none",
        textDecoration: "underline wavy hsl(var(--status-warning))",
        textDecorationSkipInk: "none",
      },
      // 查找面板
      ".cm-panels": {
        backgroundColor: "hsl(var(--card))",
        color: "hsl(var(--card-foreground))",
        borderBottom: "1px solid hsl(var(--border))",
      },
      ".cm-panel.cm-search": { padding: "8px 10px", fontFamily: SANS_STACK },
      ".cm-panel.cm-search input, .cm-panel.cm-search button": {
        fontFamily: SANS_STACK,
        fontSize: "12px",
      },
      ".cm-panel.cm-search input": {
        backgroundColor: "hsl(var(--background))",
        color: "hsl(var(--foreground))",
        border: "1px solid hsl(var(--border))",
        borderRadius: "4px",
        padding: "3px 6px",
      },
      ".cm-panel.cm-search button": {
        backgroundColor: "hsl(var(--secondary))",
        color: "hsl(var(--secondary-foreground))",
        border: "1px solid hsl(var(--border))",
        borderRadius: "4px",
        padding: "3px 8px",
        marginLeft: "4px",
        cursor: "pointer",
      },
    },
    { dark },
  )
}

/** 语法高亮：浅色模式压暗、深色模式提亮，保证两边都有足够对比度 */
function buildHighlight(dark: boolean) {
  const key = dark ? "hsl(199 89% 62%)" : "hsl(199 89% 38%)"
  const str = dark ? "hsl(145 63% 58%)" : "hsl(145 63% 32%)"
  const num = dark ? "hsl(38 92% 62%)" : "hsl(30 90% 38%)"
  const atom = dark ? "hsl(280 70% 72%)" : "hsl(280 60% 45%)"
  const comment = "hsl(var(--muted-foreground) / 0.75)"

  return HighlightStyle.define([
    { tag: [t.definition(t.propertyName), t.propertyName], color: key, fontWeight: "500" },
    { tag: [t.keyword, t.tagName], color: key },
    { tag: [t.string, t.special(t.string)], color: str },
    { tag: [t.number, t.integer, t.float], color: num },
    { tag: [t.bool, t.atom, t.null], color: atom },
    { tag: [t.comment, t.lineComment, t.blockComment], color: comment, fontStyle: "italic" },
    { tag: [t.meta, t.processingInstruction], color: atom },
    { tag: [t.punctuation, t.separator], color: "hsl(var(--muted-foreground))" },
    { tag: t.invalid, color: "hsl(var(--status-danger))" },
  ])
}

/* ------------------------------------------------------------------ *
 * 基于 Schema 的智能提示
 * ------------------------------------------------------------------ */

function toOptions(fields: FieldDef[]): Completion[] {
  return fields.map((f) => ({
    label: f.key,
    apply: `${f.key}: `,
    type: "property",
    detail: f.label,
    info: f.detail,
  }))
}

/** 向上回溯，判断光标所处的 Schema 层级 */
function detectSection(
  state: EditorState,
  lineNumber: number,
  indent: number,
): SchemaSection {
  if (indent === 0) return "root"

  for (let n = lineNumber - 1; n >= 1; n--) {
    const text = state.doc.line(n).text
    if (!text.trim() || text.trim().startsWith("#")) continue

    const lineIndent = text.length - text.trimStart().length
    if (lineIndent >= indent) continue

    const key = text.trim().replace(/^-\s*/, "").match(/^([\w.-]+):/)?.[1]
    if (!key) continue

    if (key === "stages") return "stage"
    if (key === "tasks") return "task"
    if (key === "pipeline") return "pipeline"
    if (key === "triggers") return "triggers"
    // 命中的是更外层的普通键，继续向上找
    if (lineIndent === 0) return "root"
  }
  return "root"
}

function completeSchema(context: CompletionContext): CompletionResult | null {
  const line = context.state.doc.lineAt(context.pos)
  const before = line.text.slice(0, context.pos - line.from)

  // 1) `key: ` 之后 —— 提示候选值
  const valueMatch = before.match(/^\s*(?:-\s+)?([\w.-]+):\s+(\S*)$/)
  if (valueMatch) {
    const [, key, typed] = valueMatch
    const indent = line.text.length - line.text.trimStart().length
    const section = detectSection(context.state, line.number, indent)
    const field =
      FIELDS_BY_SECTION[section].find((f) => f.key === key) ??
      Object.values(FIELDS_BY_SECTION)
        .flat()
        .find((f) => f.key === key)
    if (!field?.values?.length) return null
    return {
      from: context.pos - typed.length,
      options: field.values.map((v) => ({
        label: v.value,
        type: "enum",
        detail: v.label,
      })),
      validFor: /^\S*$/,
    }
  }

  // 2) 行首 —— 提示当前层级的字段名
  const keyMatch = before.match(/^(\s*)(?:-\s+)?([\w.-]*)$/)
  if (!keyMatch) return null
  const [, ws, typed] = keyMatch
  if (!context.explicit && typed.length === 0) return null

  const section = detectSection(context.state, line.number, ws.length)
  return {
    from: context.pos - typed.length,
    options: toOptions(FIELDS_BY_SECTION[section]),
    validFor: /^[\w.-]*$/,
  }
}

/* ------------------------------------------------------------------ *
 * 组件
 * ------------------------------------------------------------------ */

export function YamlEditor({
  value,
  issues,
  onChange,
  onSave,
  onReset,
  dirty,
}: {
  value: string
  issues: Issue[]
  onChange: (next: string) => void
  onSave: () => void
  onReset: () => void
  dirty: boolean
}) {
  const hostRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const themeComp = useRef(new Compartment())

  const [cursor, setCursor] = useState({ line: 1, col: 1 })
  const [copied, setCopied] = useState(false)

  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  const errorCount = issues.filter((i) => i.severity === "error").length
  const warningCount = issues.filter((i) => i.severity === "warning").length
  const stageNames = useMemo(() => parseStageNames(value), [value])
  const lineCount = useMemo(() => value.split("\n").length, [value])

  // 用 ref 持有最新回调，避免因回调变化而重建编辑器（会丢失撤销栈与光标）
  const onChangeRef = useRef(onChange)
  const onSaveRef = useRef(onSave)
  const canSaveRef = useRef(false)
  onChangeRef.current = onChange
  onSaveRef.current = onSave
  canSaveRef.current = dirty && errorCount === 0

  /* 创建编辑器：仅一次 */
  useEffect(() => {
    if (!hostRef.current) return

    const lintSource = (view: EditorView): Diagnostic[] => {
      const doc = view.state.doc
      // 直接对当前文档求值，保证提示与内容严格同步
      return validateYaml(doc.toString()).map((issue) => {
        const lineNo = Math.min(Math.max(issue.line, 1), doc.lines)
        const line = doc.line(lineNo)
        const from = Math.min(issue.from ?? line.from, doc.length)
        const to = Math.min(Math.max(issue.to ?? line.to, from + 1), doc.length)
        return {
          from,
          to,
          severity: issue.severity,
          message: issue.message,
        }
      })
    }

    const view = new EditorView({
      parent: hostRef.current,
      state: EditorState.create({
        doc: value,
        extensions: [
          lineNumbers(),
          lintGutter(),
          foldGutter({ markerDOM: foldMarkerDOM }),
          highlightActiveLine(),
          highlightActiveLineGutter(),
          highlightSelectionMatches(),
          history(),
          bracketMatching(),
          closeBrackets(),
          indentOnInput(),
          indentUnit.of("  "),
          EditorState.tabSize.of(2),
          EditorView.lineWrapping,
          yamlLang(),
          linter(lintSource, { delay: 300 }),
          autocompletion({ override: [completeSchema], icons: false }),
          search({ top: true }),
          themeComp.current.of([buildTheme(isDark), syntaxHighlighting(buildHighlight(isDark))]),
          keymap.of([
            {
              key: "Mod-s",
              preventDefault: true,
              run: () => {
                if (canSaveRef.current) onSaveRef.current()
                return true
              },
            },
            indentWithTab,
            ...closeBracketsKeymap,
            ...completionKeymap,
            ...searchKeymap,
            ...historyKeymap,
            ...foldKeymap,
            ...defaultKeymap,
          ]),
          EditorView.updateListener.of((u) => {
            if (u.docChanged) onChangeRef.current(u.state.doc.toString())
            if (u.docChanged || u.selectionSet) {
              const head = u.state.selection.main.head
              const line = u.state.doc.lineAt(head)
              setCursor({ line: line.number, col: head - line.from + 1 })
            }
          }),
          EditorView.contentAttributes.of({
            "aria-label": "流水线 YAML 配置编辑器",
            spellcheck: "false",
          }),
        ],
      }),
    })
    viewRef.current = view
    return () => {
      view.destroy()
      viewRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* 主题切换：仅重配置，不重建 */
  useEffect(() => {
    viewRef.current?.dispatch({
      effects: themeComp.current.reconfigure([
        buildTheme(isDark),
        syntaxHighlighting(buildHighlight(isDark)),
      ]),
    })
  }, [isDark])

  /* 外部值变化（还原、格式化）同步进编辑器 */
  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    const current = view.state.doc.toString()
    if (current === value) return
    view.dispatch({
      changes: { from: 0, to: current.length, insert: value },
    })
  }, [value])

  const goToLine = useCallback((lineNo: number) => {
    const view = viewRef.current
    if (!view) return
    const line = view.state.doc.line(Math.min(lineNo, view.state.doc.lines))
    view.dispatch({
      selection: { anchor: line.from, head: line.to },
      effects: EditorView.scrollIntoView(line.from, { y: "center" }),
    })
    view.focus()
  }, [])

  const handleFormat = useCallback(() => {
    onChange(formatYaml(value))
  }, [onChange, value])

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }, [value])

  const handleDownload = useCallback(() => {
    const blob = new Blob([value], { type: "text/yaml;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "pipeline.yaml"
    a.click()
    URL.revokeObjectURL(url)
  }, [value])

  const openSearch = useCallback(() => {
    const view = viewRef.current
    if (!view) return
    openSearchPanel(view)
    view.focus()
  }, [])

  return (
    <div className="space-y-3">
      {/* 工具栏 */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 mr-auto">
          {errorCount > 0 ? (
            <Badge variant="outline" className="gap-1 border-accent-danger text-status-danger">
              <XCircle className="w-3 h-3" />
              {errorCount} 个错误
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1 border-accent-success text-status-success">
              <CheckCircle2 className="w-3 h-3" />
              校验通过
            </Badge>
          )}
          {warningCount > 0 && (
            <Badge variant="outline" className="gap-1 border-accent-warning text-status-warning">
              <AlertTriangle className="w-3 h-3" />
              {warningCount} 个提示
            </Badge>
          )}
          {dirty && (
            <span className="flex items-center gap-1.5 text-xs text-status-warning">
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              未保存
            </span>
          )}
        </div>

        <Button size="sm" variant="ghost" onClick={openSearch} className="h-8 text-xs">
          <Search className="w-3.5 h-3.5 mr-1.5" />
          查找
        </Button>
        <Button size="sm" variant="ghost" onClick={handleFormat} className="h-8 text-xs">
          <Sparkles className="w-3.5 h-3.5 mr-1.5" />
          格式化
        </Button>
        <Button size="sm" variant="ghost" onClick={handleCopy} className="h-8 text-xs">
          {copied ? (
            <Check className="w-3.5 h-3.5 mr-1.5 text-status-success" />
          ) : (
            <Copy className="w-3.5 h-3.5 mr-1.5" />
          )}
          {copied ? "已复制" : "复制"}
        </Button>
        <Button size="sm" variant="ghost" onClick={handleDownload} className="h-8 text-xs">
          <Download className="w-3.5 h-3.5 mr-1.5" />
          下载
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onReset}
          disabled={!dirty}
          className="h-8 text-xs"
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
          还原
        </Button>
        <Button
          size="sm"
          onClick={onSave}
          disabled={!dirty || errorCount > 0}
          className="h-8 text-xs bg-[hsl(199,89%,48%)] hover:bg-[hsl(199,89%,42%)] text-white disabled:opacity-50"
        >
          <Save className="w-3.5 h-3.5 mr-1.5" />
          保存
        </Button>
      </div>

      {/* 编辑区 */}
      <div className="rounded-lg border border-border overflow-hidden bg-secondary/20">
        <div ref={hostRef} className="h-[480px] overflow-hidden" />

        {/* 状态栏 */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border bg-secondary/40 px-4 py-2 text-xs text-muted-foreground">
          <span className="font-mono tabular-nums">
            行 {cursor.line}，列 {cursor.col}
          </span>
          <span className="font-mono tabular-nums">{lineCount} 行</span>
          <span className="font-mono tabular-nums">{value.length} 字符</span>
          <span className="hidden lg:inline text-muted-foreground/70">
            Ctrl/⌘+S 保存 · Ctrl/⌘+F 查找 · Ctrl/⌘+Z 撤销 · Ctrl+空格 提示
          </span>
          <span className="ml-auto">
            {stageNames.length} 个阶段
            {stageNames.length > 0 && (
              <span className="text-foreground/70">：{stageNames.join(" → ")}</span>
            )}
          </span>
        </div>
      </div>

      {/* 问题列表 */}
      {issues.length > 0 && (
        <div className="rounded-lg border border-border divide-y divide-border overflow-hidden">
          {issues.slice(0, 8).map((issue, i) => (
            <button
              key={`${issue.line}-${i}`}
              onClick={() => goToLine(issue.line)}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-secondary/50"
            >
              {issue.severity === "error" ? (
                <XCircle className="w-3.5 h-3.5 flex-shrink-0 text-status-danger" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-status-warning" />
              )}
              <span className="font-mono text-xs text-muted-foreground tabular-nums">
                第 {issue.line} 行
              </span>
              <span className="text-sm text-foreground">{issue.message}</span>
            </button>
          ))}
          {issues.length > 8 && (
            <div className="px-4 py-2 text-xs text-muted-foreground">
              另有 {issues.length - 8} 条问题未显示
            </div>
          )}
        </div>
      )}
    </div>
  )
}
