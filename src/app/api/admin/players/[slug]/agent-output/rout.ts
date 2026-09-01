import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";

type Params = {
  params: {
    slug: string;
  };
};

type AgentStatData = {
  competition?: string;
  season?: string;
  round?: string;
  opponent?: string;
  points?: number | string;
  rebounds?: number | string;
  assists?: number | string;
  steals?: number | string;
  blocks?: number | string;
  minutes?: number | string;
};

type AgentOutput = {
  proposal_type?: string;
  player_slug?: string;
  source_id?: string;
  source_url?: string;
  confidence?: number;
  reason?: string;
  agent_notes?: string;
  data?: AgentStatData;
};

function isValidSlug(slug: string) {
  return /^[a-z0-9-]+$/.test(slug);
}

function cleanText(value: unknown) {
  return String(value || "").trim();
}

function cleanNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return 0;

  const number = Number(value);

  if (Number.isNaN(number)) return 0;

  return number;
}

function safeFilePart(value: string) {
  return value.replace(/[^a-zA-Z0-9-_]/g, "-");
}

function timestampForFile() {
  const now = new Date();

  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  const hour = String(now.getUTCHours()).padStart(2, "0");
  const minute = String(now.getUTCMinutes()).padStart(2, "0");
  const second = String(now.getUTCSeconds()).padStart(2, "0");

  return `${year}${month}${day}${hour}${minute}${second}`;
}

function createProposalId() {
  const random = Math.random().toString(36).slice(2, 8);

  return `proposal-agent-${timestampForFile()}-${random}`;
}

function getPendingProposalsDir(slug: string) {
  return path.join(
    process.cwd(),
    "ai-engine",
    "data",
    "proposals",
    slug,
    "pending",
  );
}

function getRawSourcesDir() {
  return path.join(process.cwd(), "ai-engine", "data", "sources", "raw");
}

function parseAgentOutput(body: unknown): AgentOutput {
  const possibleBody = body as { agent_output?: unknown };

  const candidate =
    possibleBody && possibleBody.agent_output !== undefined
      ? possibleBody.agent_output
      : body;

  if (typeof candidate === "string") {
    const trimmed = candidate.trim();

    if (!trimmed) {
      throw new Error("AI output is empty");
    }

    return JSON.parse(trimmed);
  }

  if (candidate && typeof candidate === "object") {
    return candidate as AgentOutput;
  }

  throw new Error("Invalid AI output format");
}

function validateAgentOutput(output: AgentOutput, slug: string) {
  const errors: string[] = [];

  if (!output.proposal_type) {
    errors.push("Missing proposal_type");
    return errors;
  }

  if (output.proposal_type === "ignored") {
    return errors;
  }

  if (output.proposal_type !== "stat_update") {
    errors.push(
      `Only stat_update is supported for now. Received: ${output.proposal_type}`,
    );
  }

  if (!output.player_slug) {
    errors.push("Missing player_slug");
  }

  if (output.player_slug && output.player_slug !== slug) {
    errors.push(
      `player_slug does not match URL slug. Received ${output.player_slug}, expected ${slug}`,
    );
  }

  if (!output.source_id) {
    errors.push("Missing source_id");
  }

  if (output.source_url === undefined || output.source_url === null) {
    errors.push("Missing source_url");
  }

  const confidence = Number(output.confidence);

  if (Number.isNaN(confidence)) {
    errors.push("confidence must be a number");
  } else if (confidence < 0.75) {
    errors.push("confidence must be at least 0.75");
  }

  if (!output.data || typeof output.data !== "object") {
    errors.push("Missing data object");
    return errors;
  }

  const requiredDataFields = [
    "competition",
    "season",
    "round",
    "opponent",
    "points",
    "rebounds",
    "assists",
    "steals",
    "blocks",
    "minutes",
  ];

  for (const field of requiredDataFields) {
    if (!(field in output.data)) {
      errors.push(`data is missing field: ${field}`);
    }
  }

  if (!cleanText(output.data.opponent)) {
    errors.push("Opponent is required");
  }

  return errors;
}

async function writeRawSourceCopy(output: AgentOutput, slug: string) {
  const rawSourcesDir = getRawSourcesDir();

  await fs.mkdir(rawSourcesDir, { recursive: true });

  const sourceId = cleanText(output.source_id || "orangeball-agent");
  const safeSourceId = safeFilePart(sourceId);
  const fileName = `${slug}-${safeSourceId}-agent-${timestampForFile()}.json`;

  const data = output.data || {};

  const rawPayload = {
    schema_version: "1.0",
    source_id: sourceId,
    player_slug: slug,
    collected_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    status: "raw_ready",
    source_url: cleanText(output.source_url),
    confidence: Number(output.confidence || 0),
    raw_data: {
      competition: cleanText(data.competition),
      season: cleanText(data.season),
      round: cleanText(data.round),
      opponent: cleanText(data.opponent),
      points: cleanNumber(data.points),
      rebounds: cleanNumber(data.rebounds),
      assists: cleanNumber(data.assists),
      steals: cleanNumber(data.steals),
      blocks: cleanNumber(data.blocks),
      minutes: cleanNumber(data.minutes),
    },
    agent: {
      agent_id: "orangeball-scouting-agent",
      proposal_type: output.proposal_type,
      agent_notes: cleanText(output.agent_notes),
    },
    notes: "Raw source criado a partir de AI Output colado no Admin.",
  };

  const rawPath = path.join(rawSourcesDir, fileName);

  await fs.writeFile(rawPath, JSON.stringify(rawPayload, null, 2), "utf-8");

  return path.relative(process.cwd(), rawPath);
}

export async function POST(request: Request, { params }: Params) {
  const slug = params.slug;

  if (!isValidSlug(slug)) {
    return NextResponse.json({ error: "Invalid player slug" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const output = parseAgentOutput(body);

    if (output.proposal_type === "ignored") {
      return NextResponse.json({
        status: "ignored",
        slug,
        message: "Agent output ignored",
        reason: cleanText(output.reason),
        agent_notes: cleanText(output.agent_notes),
      });
    }

    const errors = validateAgentOutput(output, slug);

    if (errors.length > 0) {
      return NextResponse.json(
        {
          status: "error",
          message: "Invalid agent output",
          errors,
        },
        { status: 400 },
      );
    }

    const data = output.data || {};
    const proposalId = createProposalId();
    const pendingDir = getPendingProposalsDir(slug);

    await fs.mkdir(pendingDir, { recursive: true });

    const rawSourceFile = await writeRawSourceCopy(output, slug);

    const proposal = {
      proposal_id: proposalId,
      type: "add_game",
      source: cleanText(output.source_id || "orangeball-agent"),
      source_url: cleanText(output.source_url),
      confidence: Number(output.confidence || 0),
      status: "pending",
      created_at: new Date().toISOString(),
      notes:
        cleanText(output.agent_notes) ||
        "Proposta criada a partir do Orangeball Scouting Agent.",
      proposed_data: {
        competition: cleanText(data.competition),
        season: cleanText(data.season),
        round: cleanText(data.round),
        opponent: cleanText(data.opponent),
        points: cleanNumber(data.points),
        rebounds: cleanNumber(data.rebounds),
        assists: cleanNumber(data.assists),
        steals: cleanNumber(data.steals),
        blocks: cleanNumber(data.blocks),
        minutes: cleanNumber(data.minutes),
      },
      audit: {
        created_by: "orangeball-scouting-agent",
        raw_source_file: rawSourceFile,
      },
    };

    const proposalFile = path.join(pendingDir, `${proposalId}.json`);

    await fs.writeFile(
      proposalFile,
      JSON.stringify(proposal, null, 2),
      "utf-8",
    );

    return NextResponse.json({
      status: "ok",
      message: "Agent output processed and proposal created",
      slug,
      proposal,
    });
  } catch (error) {
    console.error("Agent output route error:", error);

    return NextResponse.json(
      {
        status: "error",
        message: "Could not process agent output",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
