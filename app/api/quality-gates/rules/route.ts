import { handleRoute } from "@/lib/api-helpers"
import { listQualityGateRules } from "@/lib/data/repository"

export async function GET() {
  return handleRoute(() => listQualityGateRules())
}
