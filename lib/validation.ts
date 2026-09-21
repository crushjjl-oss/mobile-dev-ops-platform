/**
 * API 请求体校验（zod）
 *
 * 在到达仓储层之前对客户端输入做结构化校验：类型、必填、长度、枚举、格式。
 * 校验失败抛出 RepositoryError(400)，由 handleRoute 统一转成 400 响应，
 * 避免脏数据进入业务逻辑，也给前端明确的字段级错误信息。
 */

import { z } from "zod"
import { RepositoryError } from "@/lib/data/repository"

/** 解析并校验 JSON 请求体，失败抛出 400 */
export async function parseBody<T>(request: Request, schema: z.ZodType<T>): Promise<T> {
  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    throw new RepositoryError("请求体不是合法的 JSON", 400)
  }

  const result = schema.safeParse(raw)
  if (!result.success) {
    const first = result.error.issues[0]
    const path = first?.path.join(".")
    const message = path ? `字段「${path}」${first.message}` : (first?.message ?? "请求参数不合法")
    throw new RepositoryError(message, 400)
  }
  return result.data
}

const versionPattern = /^V\d+\.\d+\.\d+$/

/** 登录 */
export const loginSchema = z.object({
  username: z.string().trim().min(1, "不能为空").max(64, "过长"),
  password: z.string().min(1, "不能为空").max(128, "过长"),
})

/** 新建版本（基线） */
export const createBaselineSchema = z.object({
  version: z
    .string()
    .trim()
    .regex(versionPattern, "格式应为 V主.次.修，例如 V4.0.0"),
  sourceVersion: z.string().trim().min(1).optional(),
  description: z.string().trim().max(500, "不超过 500 字").optional(),
})

/** 注册组件 */
export const createComponentSchema = z.object({
  key: z
    .string()
    .trim()
    .min(1, "不能为空")
    .max(64, "过长")
    .regex(/^[a-zA-Z0-9._-]+$/, "只能包含字母、数字、点、下划线与连字符"),
  name: z.string().trim().min(1, "不能为空").max(64, "过长"),
  type: z.enum(["shell", "business", "foundation"]),
  pipelineId: z.string().trim().min(1, "请选择关联流水线"),
  projectId: z.string().trim().min(1).optional(),
  description: z.string().trim().max(500, "不超过 500 字").optional(),
})

/** 编辑组件（字段编辑与启停共用，字段均可选） */
export const updateComponentSchema = z.object({
  name: z.string().trim().min(1).max(64).optional(),
  type: z.enum(["shell", "business", "foundation"]).optional(),
  pipelineId: z.string().trim().min(1).optional(),
  projectId: z.string().trim().min(1).optional(),
  description: z.string().trim().max(500).optional(),
  status: z.enum(["active", "disabled"]).optional(),
})

/** 提测 */
export const testSubmissionSchema = z.object({
  note: z.string().trim().max(500, "不超过 500 字").optional(),
})
