import { NextRequest, NextResponse } from "next/server";
import { analyzeText } from "@/lib/analyzer";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { text?: unknown };
  if (typeof body.text !== "string" || !body.text.trim()) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }
  if (body.text.length > 20_000) {
    return NextResponse.json({ error: "text is too long" }, { status: 413 });
  }
  try {
    return NextResponse.json({ lines: await analyzeText(body.text) });
  } catch (error) {
    console.error("Japanese analysis failed", error);
    return NextResponse.json({ error: "analysis failed" }, { status: 500 });
  }
}
