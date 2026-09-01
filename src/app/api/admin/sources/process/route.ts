import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

export const runtime = "nodejs";

const execAsync = promisify(exec);

function extractMetric(stdout: string, label: string) {
  const regex = new RegExp(`${label}:\\s*(\\d+)`, "i");
  const match = stdout.match(regex);

  if (!match) {
    return null;
  }

  return Number(match[1]);
}

function buildSummary(stdout: string) {
  return {
    totalFiles: extractMetric(stdout, "Total files"),
    created: extractMetric(stdout, "Created proposals"),
    skipped: extractMetric(stdout, "Skipped duplicates"),
    failed: extractMetric(stdout, "Failed"),
  };
}

export async function POST() {
  try {
    const { stdout, stderr } = await execAsync("npm run obd:sources", {
      cwd: process.cwd(),
      timeout: 60000,
      env: {
        ...process.env,
        PYTHONIOENCODING: "utf-8",
        PYTHONUTF8: "1",
      },
    });

    return NextResponse.json({
      status: "ok",
      message: "External sources processed successfully",
      summary: buildSummary(stdout),
      stdout,
      stderr,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to process external sources",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
