import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

export const runtime = "nodejs";

const execAsync = promisify(exec);

export async function POST() {
  try {
  const { stdout, stderr } = await execAsync("npm run obd:generate", {
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
      message: "Website regenerated successfully",
      stdout,
      stderr,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to regenerate website",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
