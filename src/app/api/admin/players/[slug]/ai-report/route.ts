import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";

const execAsync = promisify(exec);

type Params = {
  params: {
    slug: string;
  };
};

function isValidSlug(slug: string) {
  return /^[a-z0-9-]+$/.test(slug);
}

function getAiReportPath(slug: string) {
  return path.join(
    process.cwd(),
    "public",
    "generated",
    "reports",
    "players",
    `${slug}-ai-report.json`,
  );
}

export async function GET(_request: Request, { params }: Params) {
  const slug = params.slug;

  if (!isValidSlug(slug)) {
    return NextResponse.json({ error: "Invalid player slug" }, { status: 400 });
  }

  try {
    const reportPath = getAiReportPath(slug);
    const file = await fs.readFile(reportPath, "utf-8");
    const report = JSON.parse(file);

    return NextResponse.json({
      status: "ok",
      slug,
      report,
    });
  } catch {
    return NextResponse.json(
      {
        status: "not_found",
        message: "AI report not found for this player",
        slug,
        report: null,
      },
      { status: 404 },
    );
  }
}

export async function POST(_request: Request, { params }: Params) {
  const slug = params.slug;

  if (!isValidSlug(slug)) {
    return NextResponse.json({ error: "Invalid player slug" }, { status: 400 });
  }

  try {
    const { stdout, stderr } = await execAsync(
      `python ai-engine/generate_player_ai_report.py --slug ${slug}`,
      {
        cwd: process.cwd(),
        timeout: 60000,
        env: {
          ...process.env,
          PYTHONIOENCODING: "utf-8",
          PYTHONUTF8: "1",
        },
      },
    );

    return NextResponse.json({
      status: "ok",
      message: "AI report generated successfully",
      slug,
      stdout,
      stderr,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to generate AI report",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
