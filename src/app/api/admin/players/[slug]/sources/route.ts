import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";

type Params = {
  params: {
    slug: string;
  };
};

type PlayerSource = {
  source_id: string;
  source_name: string;
  status: string;
  trust_level: string;
  profile_url: string;
  external_player_id: string;
  last_checked_at: string | null;
  notes: string;
};

type PlayerSourceProfile = {
  schema_version: string;
  player_slug: string;
  player_name: string;
  status: string;
  sources: PlayerSource[];
};

function isValidSlug(slug: string) {
  return /^[a-z0-9-]+$/.test(slug);
}

function cleanText(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

function getSourceProfilePath(slug: string) {
  return path.join(
    process.cwd(),
    "ai-engine",
    "data",
    "sources",
    "players",
    `${slug}.json`,
  );
}

async function readSourceProfile(slug: string): Promise<PlayerSourceProfile> {
  const sourceProfilePath = getSourceProfilePath(slug);
  const file = await fs.readFile(sourceProfilePath, "utf-8");

  return JSON.parse(file);
}

async function writeSourceProfile(
  slug: string,
  sourceProfile: PlayerSourceProfile,
) {
  const sourceProfilePath = getSourceProfilePath(slug);

  await fs.writeFile(
    sourceProfilePath,
    JSON.stringify(sourceProfile, null, 2),
    "utf-8",
  );
}

function normalizeStatus(value: unknown, fallback: string) {
  const status = cleanText(value);

  if (["active", "planned", "disabled"].includes(status)) {
    return status;
  }

  return fallback;
}

function normalizeTrustLevel(value: unknown, fallback: string) {
  const trustLevel = cleanText(value);

  if (["high", "medium", "low", "verified_by_admin"].includes(trustLevel)) {
    return trustLevel;
  }

  return fallback;
}

export async function GET(_request: Request, { params }: Params) {
  const slug = params.slug;

  if (!isValidSlug(slug)) {
    return NextResponse.json({ error: "Invalid player slug" }, { status: 400 });
  }

  try {
    const sourceProfile = await readSourceProfile(slug);

    return NextResponse.json({
      status: "ok",
      slug,
      sourceProfile,
    });
  } catch {
    return NextResponse.json({
      status: "not_found",
      slug,
      sourceProfile: null,
      message: "No source profile found for this player",
    });
  }
}

export async function PUT(request: Request, { params }: Params) {
  const slug = params.slug;

  if (!isValidSlug(slug)) {
    return NextResponse.json({ error: "Invalid player slug" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const sourceId = cleanText(body.source_id);

    if (!sourceId) {
      return NextResponse.json(
        { error: "source_id is required" },
        { status: 400 },
      );
    }

    const sourceProfile = await readSourceProfile(slug);

    const sourceIndex = sourceProfile.sources.findIndex(
      (source) => source.source_id === sourceId,
    );

    if (sourceIndex === -1) {
      return NextResponse.json(
        { error: `Source not found: ${sourceId}` },
        { status: 404 },
      );
    }

    const currentSource = sourceProfile.sources[sourceIndex];

    const updatedSource: PlayerSource = {
      ...currentSource,
      source_name: cleanText(body.source_name) || currentSource.source_name,
      status: normalizeStatus(body.status, currentSource.status),
      trust_level: normalizeTrustLevel(
        body.trust_level,
        currentSource.trust_level,
      ),
      profile_url:
        body.profile_url !== undefined
          ? cleanText(body.profile_url)
          : currentSource.profile_url,
      external_player_id:
        body.external_player_id !== undefined
          ? cleanText(body.external_player_id)
          : currentSource.external_player_id,
      notes:
        body.notes !== undefined ? cleanText(body.notes) : currentSource.notes,
    };

    sourceProfile.sources[sourceIndex] = updatedSource;

    await writeSourceProfile(slug, sourceProfile);

    return NextResponse.json({
      status: "ok",
      message: "Source profile updated successfully",
      slug,
      source: updatedSource,
      sourceProfile,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: "Could not update source profile",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
