import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";

type PlayerSource = {
  source_id?: string;
  source_name?: string;
  status?: string;
  trust_level?: string;
  profile_url?: string;
  external_player_id?: string;
  last_checked_at?: string | null;
  notes?: string;
};

type SourceProfile = {
  player_slug?: string;
  player_name?: string;
  status?: string;
  sources?: PlayerSource[];
};

function getSourceProfilesDir() {
  return path.join(process.cwd(), "ai-engine", "data", "sources", "players");
}

function getReadinessStatus(source: PlayerSource) {
  if (source.status !== "active") {
    return "not_active";
  }

  if (!source.profile_url?.trim()) {
    return "missing_profile_url";
  }

  if (!source.external_player_id?.trim()) {
    return "missing_external_player_id";
  }

  return "ready";
}

async function readJsonFile(filePath: string) {
  const file = await fs.readFile(filePath, "utf-8");
  return JSON.parse(file) as SourceProfile;
}

export async function GET() {
  try {
    const sourceProfilesDir = getSourceProfilesDir();

    let files = [];

    try {
      files = await fs.readdir(sourceProfilesDir, { withFileTypes: true });
    } catch {
      return NextResponse.json({
        status: "ok",
        summary: {
          totalPlayers: 0,
          totalSources: 0,
          readySources: 0,
          notReadySources: 0,
        },
        players: [],
      });
    }

    const players = [];
    let totalSources = 0;
    let readySources = 0;
    let notReadySources = 0;

    for (const file of files) {
      if (!file.isFile() || !file.name.endsWith(".json")) continue;

      const filePath = path.join(sourceProfilesDir, file.name);

      try {
        const profile = await readJsonFile(filePath);
        const sources = profile.sources || [];

        const mappedSources = sources.map((source) => {
          const readiness = getReadinessStatus(source);

          totalSources += 1;

          if (readiness === "ready") {
            readySources += 1;
          } else {
            notReadySources += 1;
          }

          return {
            source_id: source.source_id || "unknown",
            source_name: source.source_name || "",
            status: source.status || "",
            trust_level: source.trust_level || "",
            profile_url: source.profile_url || "",
            external_player_id: source.external_player_id || "",
            readiness,
          };
        });

        players.push({
          player_slug: profile.player_slug || file.name.replace(".json", ""),
          player_name: profile.player_name || file.name.replace(".json", ""),
          status: profile.status || "unknown",
          sources: mappedSources,
        });
      } catch {
        players.push({
          player_slug: file.name.replace(".json", ""),
          player_name: file.name.replace(".json", ""),
          status: "invalid",
          sources: [],
          error: "Invalid source profile JSON",
        });
      }
    }

    return NextResponse.json({
      status: "ok",
      summary: {
        totalPlayers: players.length,
        totalSources,
        readySources,
        notReadySources,
      },
      players,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: "Could not load source readiness",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
