import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RawData = {
  competition: string;
  season: string;
  round: string;
  opponent: string;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  minutes: number;
};

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

const ALLOWED_RAW_STATUSES = new Set([
  "raw_placeholder",
  "draft",
  "incomplete",
  "raw_ready",
]);

function getRawSourcesDir() {
  return path.join(process.cwd(), "ai-engine", "data", "sources", "raw");
}

function getSourceProfilesDir() {
  return path.join(process.cwd(), "ai-engine", "data", "sources", "players");
}

function getSafeRawFilePath(fileName: string) {
  const safeFileName = path.basename(fileName);

  if (safeFileName !== fileName || !safeFileName.endsWith(".json")) {
    throw new Error("Invalid raw file name");
  }

  return path.join(getRawSourcesDir(), safeFileName);
}

async function readJsonFile<T>(filePath: string): Promise<T> {
  const file = await fs.readFile(filePath, "utf-8");
  return JSON.parse(file) as T;
}

async function writeJsonFile(filePath: string, data: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });

  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

function getString(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function getNumber(value: unknown, fallback = 0) {
  const number = Number(value);

  if (Number.isNaN(number)) {
    return fallback;
  }

  return number;
}

function buildEmptyRawData(): RawData {
  return {
    competition: "",
    season: "",
    round: "",
    opponent: "",
    points: 0,
    rebounds: 0,
    assists: 0,
    steals: 0,
    blocks: 0,
    minutes: 0,
  };
}

function normalizeRawData(rawData: Partial<RawData> | undefined): RawData {
  return {
    competition: getString(rawData?.competition),
    season: getString(rawData?.season),
    round: getString(rawData?.round),
    opponent: getString(rawData?.opponent),
    points: getNumber(rawData?.points),
    rebounds: getNumber(rawData?.rebounds),
    assists: getNumber(rawData?.assists),
    steals: getNumber(rawData?.steals),
    blocks: getNumber(rawData?.blocks),
    minutes: getNumber(rawData?.minutes),
  };
}

function validateReadyRawData(rawData: RawData) {
  const missingFields = [];

  if (!rawData.competition) missingFields.push("competition");
  if (!rawData.season) missingFields.push("season");
  if (!rawData.round) missingFields.push("round");
  if (!rawData.opponent) missingFields.push("opponent");
  if (!rawData.minutes) missingFields.push("minutes");

  if (missingFields.length > 0) {
    throw new Error(
      `Missing required fields for raw_ready: ${missingFields.join(", ")}`,
    );
  }
}

function isSourceReady(source: PlayerSource) {
  return (
    source.status === "active" &&
    Boolean(source.profile_url?.trim()) &&
    Boolean(source.external_player_id?.trim())
  );
}

function buildFileTimestamp() {
  return new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

function buildRawResponse(fileName: string, payload: Record<string, unknown>) {
  return {
    file_name: fileName,
    schema_version: payload.schema_version || "",
    source_id: payload.source_id || "",
    player_slug: payload.player_slug || "",
    player_name: payload.player_name || "",
    collected_at: payload.collected_at || "",
    updated_at: payload.updated_at || "",
    status: payload.status || "",
    source_url: payload.source_url || "",
    external_player_id: payload.external_player_id || "",
    confidence: payload.confidence ?? null,
    raw_data: payload.raw_data || buildEmptyRawData(),
    notes: payload.notes || "",
  };
}

export async function GET() {
  try {
    const rawSourcesDir = getRawSourcesDir();

    let files = [];

    try {
      files = await fs.readdir(rawSourcesDir, { withFileTypes: true });
    } catch {
      return NextResponse.json({
        status: "ok",
        count: 0,
        raw_sources: [],
      });
    }

    const rawSources = [];

    for (const file of files) {
      if (!file.isFile() || !file.name.endsWith(".json")) continue;

      try {
        const filePath = path.join(rawSourcesDir, file.name);
        const payload = await readJsonFile<Record<string, unknown>>(filePath);

        rawSources.push(buildRawResponse(file.name, payload));
      } catch {
        rawSources.push({
          file_name: file.name,
          status: "invalid",
          error: "Invalid raw JSON",
        });
      }
    }

    return NextResponse.json({
      status: "ok",
      count: rawSources.length,
      raw_sources: rawSources,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: "Could not load raw sources",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const playerSlug = getString(body.player_slug);
    const sourceId = getString(body.source_id || "fpb");

    if (!playerSlug) {
      return NextResponse.json(
        {
          status: "error",
          message: "player_slug is required",
        },
        { status: 400 },
      );
    }

    const sourceProfilePath = path.join(
      getSourceProfilesDir(),
      `${playerSlug}.json`,
    );

    const sourceProfile = await readJsonFile<SourceProfile>(sourceProfilePath);

    const source = (sourceProfile.sources || []).find(
      (item) => item.source_id === sourceId,
    );

    if (!source) {
      return NextResponse.json(
        {
          status: "error",
          message: `Source not found for player: ${sourceId}`,
        },
        { status: 404 },
      );
    }

    if (!isSourceReady(source)) {
      return NextResponse.json(
        {
          status: "error",
          message: "Source is not ready",
        },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();
    const timestamp = buildFileTimestamp();

    const fileName = `${playerSlug}-${sourceId}-${timestamp}-manual-raw.json`;
    const filePath = path.join(getRawSourcesDir(), fileName);

    const rawData = normalizeRawData(body.raw_data);
    const status = getString(body.status || "draft");

    if (!ALLOWED_RAW_STATUSES.has(status)) {
      return NextResponse.json(
        {
          status: "error",
          message: `Invalid raw status: ${status}`,
        },
        { status: 400 },
      );
    }

    if (status === "raw_ready") {
      validateReadyRawData(rawData);
    }

    const payload = {
      schema_version: "1.0",
      source_id: sourceId,
      player_slug: playerSlug,
      player_name: sourceProfile.player_name || playerSlug,
      collected_at: now,
      updated_at: now,
      status,
      source_url: source.profile_url || "",
      external_player_id: source.external_player_id || "",
      confidence: getNumber(body.confidence, 0.9),
      raw_data: rawData,
      notes:
        status === "raw_ready"
          ? "Raw criado manualmente via API e pronto para proposta."
          : "Raw draft criado manualmente via API.",
    };

    await writeJsonFile(filePath, payload);

    return NextResponse.json({
      status: "ok",
      message: "Raw source created",
      raw_source: buildRawResponse(fileName, payload),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: "Could not create raw source",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();

    const fileName = getString(body.file_name);

    if (!fileName) {
      return NextResponse.json(
        {
          status: "error",
          message: "file_name is required",
        },
        { status: 400 },
      );
    }

    const filePath = getSafeRawFilePath(fileName);
    const payload = await readJsonFile<Record<string, unknown>>(filePath);

    const status = getString(body.status || payload.status || "draft");

    if (!ALLOWED_RAW_STATUSES.has(status)) {
      return NextResponse.json(
        {
          status: "error",
          message: `Invalid raw status: ${status}`,
        },
        { status: 400 },
      );
    }

    const rawData = normalizeRawData(body.raw_data);

    if (status === "raw_ready") {
      validateReadyRawData(rawData);
    }

    const updatedPayload = {
      ...payload,
      status,
      updated_at: new Date().toISOString(),
      confidence: getNumber(body.confidence, payload.confidence as number),
      raw_data: rawData,
      notes:
        status === "raw_ready"
          ? "Raw atualizado manualmente via API e pronto para proposta."
          : "Raw atualizado manualmente via API.",
    };

    await writeJsonFile(filePath, updatedPayload);

    return NextResponse.json({
      status: "ok",
      message: "Raw source updated",
      raw_source: buildRawResponse(fileName, updatedPayload),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: "Could not update raw source",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
