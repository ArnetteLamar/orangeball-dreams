import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";

type SourceHistoryEntry = {
  logged_at?: string;
  action?: string;
  proposal_id?: string | null;
  proposal_status?: string | null;
  player_slug?: string;
  source_id?: string;
  source_url?: string;
  source_file?: string;
  confidence?: number | null;
  duplicate_reason?: string;
  competition?: string;
  season?: string;
  round?: string;
  opponent?: string;
  points?: number;
  rebounds?: number;
  assists?: number;
  steals?: number;
  blocks?: number;
  minutes?: number;
};

function getSourceLogPath() {
  return path.join(
    process.cwd(),
    "ai-engine",
    "data",
    "sources",
    "logs",
    "source_proposals.jsonl",
  );
}

function parseJsonLine(line: string): SourceHistoryEntry | null {
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const logPath = getSourceLogPath();
    const file = await fs.readFile(logPath, "utf-8");

    const entries = file
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map(parseJsonLine)
      .filter((entry): entry is SourceHistoryEntry => entry !== null)
      .reverse()
      .slice(0, 20);

    return NextResponse.json({
      status: "ok",
      count: entries.length,
      entries,
    });
  } catch {
    return NextResponse.json({
      status: "ok",
      count: 0,
      entries: [],
      message: "No source history found yet",
    });
  }
}
