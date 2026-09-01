import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";

type RouteContext = {
  params: {
    slug: string;
  };
};

function cleanString(value: unknown) {
  return String(value ?? "").trim();
}

function cleanPath(value: unknown) {
  return String(value ?? "")
    .trim()
    .replace(/^["']+/, "")
    .replace(/["']+$/, "");
}

async function fileExists(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJson(filePath: string) {
  const raw = await fs.readFile(filePath, "utf-8");
  return JSON.parse(raw);
}

async function writeJson(filePath: string, data: unknown) {
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf-8");
}

function getProfilePath(slug: string) {
  return path.join(
    process.cwd(),
    "ai-engine",
    "data",
    "players",
    slug,
    "profile.json",
  );
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const slug = context.params.slug;
    const profilePath = getProfilePath(slug);

    if (!(await fileExists(profilePath))) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    const profile = await readJson(profilePath);

    return NextResponse.json({
      status: "ok",
      player: profile,
    });
  } catch (error) {
    console.error("Failed to load player:", error);

    return NextResponse.json(
      { error: "Failed to load player" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const slug = context.params.slug;
    const profilePath = getProfilePath(slug);

    if (!(await fileExists(profilePath))) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    const currentProfile = await readJson(profilePath);
    const body = await request.json();

    const updatedProfile: Record<string, unknown> = {
      ...currentProfile,

      slug: currentProfile.slug || slug,
      name: cleanString(body.name ?? currentProfile.name),
      club: cleanString(body.club ?? currentProfile.club),
      position: cleanString(body.position ?? currentProfile.position),
      nationality: cleanString(body.nationality ?? currentProfile.nationality),
      gender: cleanString(body.gender ?? currentProfile.gender),
      league: cleanString(body.league ?? currentProfile.league),
      status: cleanString(body.status ?? currentProfile.status) || "active",

      photo: cleanPath(body.photo ?? currentProfile.photo),
      highlight_video: cleanPath(
        body.highlight_video ?? currentProfile.highlight_video,
      ),

      updated_at: new Date().toISOString(),
    };

    if (body.height_cm !== undefined) {
      updatedProfile.height_cm = body.height_cm ? Number(body.height_cm) : null;
    }

    await writeJson(profilePath, updatedProfile);

    return NextResponse.json({
      status: "ok",
      message: "Player saved",
      player: updatedProfile,
    });
  } catch (error) {
    console.error("Failed to save player:", error);

    return NextResponse.json(
      {
        error: "Failed to save player",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
