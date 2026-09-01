import { NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";

export const runtime = "nodejs";

const execFileAsync = promisify(execFile);

type Params = {
  params: {
    slug: string;
  };
};

function isValidSlug(slug: string) {
  return /^[a-z0-9-]+$/.test(slug);
}

export async function POST(_request: Request, { params }: Params) {
  const slug = params.slug;

  if (!isValidSlug(slug)) {
    return NextResponse.json({ error: "Invalid player slug" }, { status: 400 });
  }

  try {
    const { stdout, stderr } = await execFileAsync(
      "python",
      [
        "ai-engine/actions/create_proposal.py",
        "--slug",
        slug,
        "--type",
        "add_game",
        "--source",
        "admin_test",
        "--confidence",
        "0.87",
        "--competition",
        "Liga Betclic",
        "--season",
        "2026/27",
        "--round",
        "Jornada Teste",
        "--opponent",
        "Teste Admin",
        "--points",
        "15",
        "--rebounds",
        "4",
        "--assists",
        "6",
        "--steals",
        "2",
        "--blocks",
        "0",
        "--minutes",
        "30",
        "--notes",
        "Proposta de teste criada diretamente no Admin.",
      ],
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
      message: "Test proposal created successfully",
      slug,
      stdout,
      stderr,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: "Could not create test proposal",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
