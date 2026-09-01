import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";

type PendingCounts = Record<string, number>;

function getProposalsDir() {
  return path.join(process.cwd(), "ai-engine", "data", "proposals");
}

async function countPendingForPlayer(playerSlug: string) {
  const pendingDir = path.join(getProposalsDir(), playerSlug, "pending");

  try {
    const files = await fs.readdir(pendingDir, { withFileTypes: true });

    return files.filter((file) => file.isFile() && file.name.endsWith(".json"))
      .length;
  } catch {
    return 0;
  }
}

export async function GET() {
  try {
    const proposalsDir = getProposalsDir();

    let folders = [];

    try {
      folders = await fs.readdir(proposalsDir, { withFileTypes: true });
    } catch {
      return NextResponse.json({
        status: "ok",
        counts: {},
      });
    }

    const counts: PendingCounts = {};

    for (const folder of folders) {
      if (!folder.isDirectory()) continue;

      counts[folder.name] = await countPendingForPlayer(folder.name);
    }

    return NextResponse.json({
      status: "ok",
      counts,
    });
  } catch {
    return NextResponse.json(
      {
        status: "error",
        message: "Could not load pending proposal counts",
        counts: {},
      },
      { status: 500 },
    );
  }
}
