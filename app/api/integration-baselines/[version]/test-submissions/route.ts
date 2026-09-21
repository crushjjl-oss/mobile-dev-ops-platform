import { handleRoute, requireSession } from "@/lib/api-helpers"
import { listTestSubmissions, submitBaselineForTest } from "@/lib/data/repository"
import { parseBody, testSubmissionSchema } from "@/lib/validation"

export async function GET(_request: Request, { params }: { params: Promise<{ version: string }> }) {
  const { version } = await params
  return handleRoute(() => listTestSubmissions(decodeURIComponent(version)))
}

export async function POST(request: Request, { params }: { params: Promise<{ version: string }> }) {
  const { version } = await params
  return handleRoute(async () => {
    const session = await requireSession()
    const body = await parseBody(request, testSubmissionSchema)
    return submitBaselineForTest({
      version: decodeURIComponent(version),
      operator: session.displayName,
      note: body.note,
    })
  })
}
