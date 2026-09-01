import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";

export async function DELETE(request: Request, { params }: Params) {
  const slug = params.slug;

  if (!isValidSlug(slug)) {
    return NextResponse.json({ error: "Invalid player slug" }, { status: 400 });
  }

  try {
    const url = new URL(request.url);
    const gameId = Number(url.searchParams.get("gameId"));

    if (!gameId || gameId < 1) {
      return NextResponse.json({ error: "Invalid game id" }, { status: 400 });
    }

    const statsPath = getStatsPath(slug);

    await ensureStatsFile(statsPath);

    const file = await fs.readFile(statsPath, "utf-8");

    const lines = file
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const header = lines[0] || STATS_HEADER.trim();
    const games = lines.slice(1);

    const gameIndex = gameId - 1;

    if (!games[gameIndex]) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    const deletedGame = games[gameIndex];

    const updatedGames = games.filter((_, index) => index !== gameIndex);

    const updatedFile = [header, ...updatedGames].join("\n") + "\n";

    await fs.writeFile(statsPath, updatedFile, "utf-8");

    return NextResponse.json({
      status: "ok",
      message: "Game deleted",
      slug,
      gameId,
      deletedGame,
    });
      
      
      
  } catch {
    return NextResponse.json(
      { error: "Could not delete player stats" },
      { status: 500 },
    );
  }
}

type Params = {
  params: {
    slug: string;
  };
};

type GameStatsBody = {
  competition?: string;
  season?: string;
  round?: string;
  opponent?: string;
  points?: string | number;
  rebounds?: string | number;
  assists?: string | number;
  steals?: string | number;
  blocks?: string | number;
  minutes?: string | number;
};

const STATS_HEADER =
  "competition,season,round,opponent,points,rebounds,assists,steals,blocks,minutes\n";

function isValidSlug(slug: string) {
  return /^[a-z0-9-]+$/.test(slug);
}

function getPlayerDir(slug: string) {
  return path.join(process.cwd(), "ai-engine", "data", "players", slug);
}

function getStatsPath(slug: string) {
  return path.join(getPlayerDir(slug), "stats.csv");
}

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

function cleanNumber(value: unknown) {
  const number = Number(value);

  if (Number.isNaN(number) || number < 0) {
    return 0;
  }

  return number;
}

function escapeCsv(value: string | number) {
  const text = String(value);

  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

function buildCsvLine(body: GameStatsBody) {
  const row = [
    cleanText(body.competition),
    cleanText(body.season),
    cleanText(body.round),
    cleanText(body.opponent),
    cleanNumber(body.points),
    cleanNumber(body.rebounds),
    cleanNumber(body.assists),
    cleanNumber(body.steals),
    cleanNumber(body.blocks),
    cleanNumber(body.minutes),
  ];

  return row.map(escapeCsv).join(",") + "\n";
}

async function ensureStatsFile(statsPath: string) {
  try {
    await fs.access(statsPath);
  } catch {
    await fs.writeFile(statsPath, STATS_HEADER, "utf-8");
  }
}

export async function PUT(request: Request, { params }: Params) {
  const slug = params.slug;

  if (!isValidSlug(slug)) {
    return NextResponse.json({ error: "Invalid player slug" }, { status: 400 });
  }

  try {
    const url = new URL(request.url);
    const gameId = Number(url.searchParams.get("gameId"));

    if (!gameId || gameId < 1) {
      return NextResponse.json({ error: "Invalid game id" }, { status: 400 });
    }

    const statsPath = getStatsPath(slug);

    await ensureStatsFile(statsPath);

    const file = await fs.readFile(statsPath, "utf-8");

    const lines = file
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const header = lines[0] || STATS_HEADER.trim();
    const games = lines.slice(1);

    const gameIndex = gameId - 1;

    if (!games[gameIndex]) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    const body = (await request.json()) as GameStatsBody;
    const updatedLine = buildCsvLine(body).trim();

    const updatedGames = games.map((game, index) =>
      index === gameIndex ? updatedLine : game,
    );

    const updatedFile = [header, ...updatedGames].join("\n") + "\n";

    await fs.writeFile(statsPath, updatedFile, "utf-8");

    return NextResponse.json({
      status: "ok",
      message: "Game updated",
      slug,
      gameId,
      game: {
        id: gameId,
        competition: cleanText(body.competition),
        season: cleanText(body.season),
        round: cleanText(body.round),
        opponent: cleanText(body.opponent),
        points: cleanNumber(body.points),
        rebounds: cleanNumber(body.rebounds),
        assists: cleanNumber(body.assists),
        steals: cleanNumber(body.steals),
        blocks: cleanNumber(body.blocks),
        minutes: cleanNumber(body.minutes),
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Could not update player stats" },
      { status: 500 },
    );
  }
}

export async function GET(_request: Request, { params }: Params) {
  const slug = params.slug;

  if (!isValidSlug(slug)) {
    return NextResponse.json({ error: "Invalid player slug" }, { status: 400 });
  }

  try {
    const statsPath = getStatsPath(slug);

    await ensureStatsFile(statsPath);

    const file = await fs.readFile(statsPath, "utf-8");
    const lines = file
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const games = lines.slice(1).map((line, index) => {
      const [
        competition,
        season,
        round,
        opponent,
        points,
        rebounds,
        assists,
        steals,
        blocks,
        minutes,
      ] = line.split(",");

      return {
        id: index + 1,
        competition,
        season,
        round,
        opponent,
        points: Number(points) || 0,
        rebounds: Number(rebounds) || 0,
        assists: Number(assists) || 0,
        steals: Number(steals) || 0,
        blocks: Number(blocks) || 0,
        minutes: Number(minutes) || 0,
      };
    });

    return NextResponse.json({
      status: "ok",
      source: "ai-engine",
      slug,
      count: games.length,
      games,
    });
  } catch {
    return NextResponse.json(
      { error: "Could not load player stats" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, { params }: Params) {
  const slug = params.slug;

  if (!isValidSlug(slug)) {
    return NextResponse.json({ error: "Invalid player slug" }, { status: 400 });
  }

  try {
    const playerDir = getPlayerDir(slug);
    const statsPath = getStatsPath(slug);

    await fs.access(playerDir);
    await ensureStatsFile(statsPath);

    const body = (await request.json()) as GameStatsBody;

    if (!cleanText(body.opponent)) {
      return NextResponse.json(
        { error: "Opponent is required" },
        { status: 400 },
      );
    }

    const csvLine = buildCsvLine(body);

    await fs.appendFile(statsPath, csvLine, "utf-8");

    return NextResponse.json({
      status: "ok",
      message: "Game stats added",
      slug,
      game: {
        competition: cleanText(body.competition),
        season: cleanText(body.season),
        round: cleanText(body.round),
        opponent: cleanText(body.opponent),
        points: cleanNumber(body.points),
        rebounds: cleanNumber(body.rebounds),
        assists: cleanNumber(body.assists),
        steals: cleanNumber(body.steals),
        blocks: cleanNumber(body.blocks),
        minutes: cleanNumber(body.minutes),
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Could not add player stats" },
      { status: 500 },
    );
  }
}
