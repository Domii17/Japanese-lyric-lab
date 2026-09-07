import { NextRequest, NextResponse } from "next/server";
import { getAiConfig } from "@/lib/ai-config";

export const runtime = "nodejs";
export const maxDuration = 35;

type RequestBody = { line?: unknown; tokens?: unknown; mode?: unknown };
const requestLog = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 12;

function extractJson(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("Model did not return JSON");
  return JSON.parse(text.slice(start, end + 1));
}

export async function POST(request: NextRequest) {
  const ai = getAiConfig();
  if (!ai) {
    return NextResponse.json({ error: "当前部署未配置 AI；请按照开源文档自行部署并设置 API Key" }, { status: 503 });
  }
  const clientId = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const now = Date.now();
  const recent = (requestLog.get(clientId) || []).filter((time) => now - time < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
    return NextResponse.json({ error: "请求过于频繁，请稍后再试" }, { status: 429 });
  }
  recent.push(now);
  requestLog.set(clientId, recent);
  const body = (await request.json()) as RequestBody;
  if (typeof body.line !== "string" || body.line.length > 1_000 || !Array.isArray(body.tokens) || body.tokens.length > 80) {
    return NextResponse.json({ error: "Invalid lyric line" }, { status: 400 });
  }
  const prompt = [
    "你是面向中文初学者的日语老师。请同时完成逐词释义和整句讲解。",
    "只返回 JSON，不要 Markdown，不要复述整段歌词。",
    "JSON 字段必须是 glosses 和 explanation。glosses 必须与词元数组等长并保持顺序，每项包含 surface 和 meaning；符号 meaning 为空。",
    "explanation 包含 summary（初学者总结）, natural（自然翻译）, grammar（语法讲解数组）, notes（特殊表达数组）。不要输出 literal 字段。",
    "grammar 每项包含 pattern 和 explanation；请把复合词、接尾词和语法组合拆开说明，例如 入社後 写成 入社 - 後，并指出每一部分的含义或语法作用。",
    `歌词原句：${body.line}`,
    `词元数组：${JSON.stringify(body.tokens)}`,
  ].join("\n");
  const response = await fetch(ai.endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${ai.apiKey}` },
    body: JSON.stringify({
      model: ai.model,
      temperature: 0.2,
      messages: [{ role: "system", content: "你只输出合法 JSON。" }, { role: "user", content: prompt }],
      response_format: { type: "json_object" },
    }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) {
    const upstream = await response.text();
    console.error("AI upstream error", response.status, upstream.slice(0, 1000));
    let detail = "AI service request failed";
    try {
      const parsed = JSON.parse(upstream) as { error?: { message?: string } | string };
      const message = typeof parsed.error === "string" ? parsed.error : parsed.error?.message;
      if (message) detail = `AI service request failed: ${message}`;
    } catch {
      // Keep a generic message when the provider does not return JSON.
    }
    return NextResponse.json({ error: detail }, { status: 502 });
  }
  const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) return NextResponse.json({ error: "AI returned an empty response" }, { status: 502 });
  try {
    const result = extractJson(content);
    return NextResponse.json(result);
  }
  catch { return NextResponse.json({ error: "AI returned invalid JSON" }, { status: 502 }); }
}
