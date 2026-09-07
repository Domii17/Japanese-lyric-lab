import { NextResponse } from "next/server";
import { getAiConfig, getRepositoryUrl } from "@/lib/ai-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const ai = getAiConfig();
  return NextResponse.json(
    {
      aiConfigured: Boolean(ai),
      aiProvider: ai?.providerLabel || null,
      repositoryUrl: getRepositoryUrl(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
