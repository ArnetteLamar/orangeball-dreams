import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isValidBody(body: unknown): body is Record<string, string> {
  return typeof body === "object" && body !== null && !Array.isArray(body);
}

function getPlayersDir() {
  return path.join(process.cwd(), "ai-engine", "data", "players");
}
function getSourceProfilesDir() {
  return path.join(process.cwd(), "ai-engine", "data", "sources", "players");
}

function getSourceProfilePath(slug: string) {
  return path.join(getSourceProfilesDir(), `${slug}.json`);
}

function buildDefaultSourceProfile(slug: string, name: string) {
  return {
    schema_version: "1.0",
    player_slug: slug,
    player_name: name,
    status: "active",
    sources: [
      {
        source_id: "fpb",
        source_name: "Federação Portuguesa de Basquetebol",
        status: "planned",
        trust_level: "high",
        profile_url: "",
        external_player_id: "",
        last_checked_at: null,
        notes:
          "Fonte criada automaticamente. Ainda falta associar URL ou ID externo.",
      },
    ],
  };
}

async function createDefaultSourceProfile(slug: string, name: string) {
  const sourceProfilesDir = getSourceProfilesDir();
  const sourceProfilePath = getSourceProfilePath(slug);

  await fs.mkdir(sourceProfilesDir, { recursive: true });

  try {
    const existingFile = await fs.readFile(sourceProfilePath, "utf-8");
    const existingProfile = JSON.parse(existingFile);

    if (
      existingProfile?.player_slug === slug &&
      Array.isArray(existingProfile?.sources)
    ) {
      return;
    }
  } catch {
    // Se não existe, está vazio ou tem JSON inválido, vamos criar/corrigir.
  }

  const sourceProfile = buildDefaultSourceProfile(slug, name);

  await fs.writeFile(
    sourceProfilePath,
    JSON.stringify(sourceProfile, null, 2),
    "utf-8",
  );
}

export async function GET() {
  try {
    const playersDir = getPlayersDir();
    const folders = await fs.readdir(playersDir, { withFileTypes: true });

    const players = [];

    for (const folder of folders) {
      if (!folder.isDirectory()) continue;

      const profilePath = path.join(playersDir, folder.name, "profile.json");

      try {
        const file = await fs.readFile(profilePath, "utf-8");
        const profile = JSON.parse(file);

        players.push({
          slug: profile.slug || folder.name,
          name: profile.name || folder.name,
          club: profile.club || "",
          position: profile.position || "",
          nationality: profile.nationality || "",
          league: profile.league || "",
          photo: profile.photo || "",
          status: profile.status || "active",
          featured: profile.featured || false,
        });
      } catch {
        // Ignore folders without valid profile.json
      }
    }

    players.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({
      status: "ok",
      source: "ai-engine",
      count: players.length,
      players,
    });
  } catch {
    return NextResponse.json(
      { error: "Could not load players from AI Engine" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!isValidBody(body)) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const name = body.name?.trim();

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const slug = slugify(name);

    const playerDir = path.join(getPlayersDir(), slug);

    try {
      await fs.access(playerDir);

      return NextResponse.json(
        { error: "Player already exists", slug },
        { status: 409 },
      );
    } catch {
      // Player does not exist yet
    }

    await fs.mkdir(playerDir, { recursive: true });
    await fs.mkdir(path.join(playerDir, "photos"), { recursive: true });
    await fs.mkdir(path.join(playerDir, "videos"), { recursive: true });
    await fs.mkdir(path.join(playerDir, "news"), { recursive: true });

   const profile = {
     schema_version: "1.0",
     slug,
     name,
     profile_type: body.profile_type || "player",
     club: body.club || "",
     position: body.position || "",
     nationality: body.nationality || "",
     gender: body.gender || "",
     birth_date: "",
     height_cm: body.height_cm ? Number(body.height_cm) : null,
     league: body.league || "",
     photo: body.photo || `/images/players/${slug}.jpg`,
     highlight_video: body.highlight_video || "",
     status: "active",
     featured: false,
     tags: [],
     bio: body.bio || "",
     instagram: body.instagram || "",
     youtube: body.youtube || "",
     agent_notes: body.agent_notes || "",
   };

    const statsHeader =
      "competition,season,round,opponent,points,rebounds,assists,steals,blocks,minutes\n";

    await fs.writeFile(
      path.join(playerDir, "profile.json"),
      JSON.stringify(profile, null, 2),
      "utf-8",
    );

    await createDefaultSourceProfile(slug, name);

    await fs.writeFile(path.join(playerDir, "stats.csv"), statsHeader, "utf-8");

    return NextResponse.json({
      status: "ok",
      message: "Player created",
      slug,
      profile,
    });
  } catch {
    return NextResponse.json(
      { error: "Could not create player" },
      { status: 500 },
    );
  }
}
