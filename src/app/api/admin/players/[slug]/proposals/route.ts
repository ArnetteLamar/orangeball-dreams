import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

export const runtime = "nodejs";

const execAsync = promisify(exec);

type Params = {
  params: {
    slug: string;
  };
};

type ReviewBody = {
  action?: string;
  decision?: string;
  proposal_id?: string;
  reviewed_by?: string;
  agent_output?: unknown;
};

type UpdateProposalBody = {
  proposal_id?: string;
  notes?: string;
  proposed_data?: {
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

type AgentNewsData = {
  category?: string;
  title?: string;
  summary?: string;
  content?: string;
  published_at?: string;
  source_name?: string;
};

type AgentProfileData = {
  profile_type?: string;
  name?: string;
  club?: string;
  position?: string;
  nationality?: string;
  gender?: string;
  league?: string;
  height_cm?: number | string | null;
  photo?: string;
  highlight_video?: string;
  instagram?: string;
  youtube?: string;
  bio?: string;
  agent_notes?: string;
  status?: string;
  tags?: string[];
};

type AgentOutput = {
  proposal_type?: string;
  player_slug?: string;
  source_id?: string;
  source_url?: string;
  confidence?: number;
  reason?: string;
  agent_notes?: string;
  data?: AgentStatData | AgentNewsData | AgentProfileData;
};

type ProposalRecord = {
  created_at?: string;
  [key: string]: unknown;
};

function isValidSlug(slug: string) {
  return /^[a-z0-9-]+$/.test(slug);
}

function isValidProposalId(value: string) {
  return /^proposal-[a-zA-Z0-9-]+$/.test(value);
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

function createAgentProposalId() {
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

function getReviewedProposalsDir(
  slug: string,
  decision: "approved" | "rejected",
) {
  return path.join(
    process.cwd(),
    "ai-engine",
    "data",
    "proposals",
    slug,
    decision,
  );
}

function getPlayerNewsDir(slug: string) {
  return path.join(process.cwd(), "ai-engine", "data", "players", slug, "news");
}

function getPlayerProfileFile(slug: string) {
  return path.join(
    process.cwd(),
    "ai-engine",
    "data",
    "players",
    slug,
    "profile.json",
  );
}

function createNewsId(title: string) {
  const safeTitle = safeFilePart(
    cleanText(title).toLowerCase().replace(/\s+/g, "-"),
  ).slice(0, 60);

  return `news-${timestampForFile()}-${safeTitle || "update"}`;
}

function getPendingProposalFile(slug: string, proposalId: string) {
  return path.join(
    process.cwd(),
    "ai-engine",
    "data",
    "proposals",
    slug,
    "pending",
    `${proposalId}.json`,
  );
}

function getRawSourcesDir() {
  return path.join(process.cwd(), "ai-engine", "data", "sources", "raw");
}

async function readJsonFile(filePath: string) {
  const file = await fs.readFile(filePath, "utf-8");
  return JSON.parse(file);
}

async function runGenerateTasks(slug: string) {
  const generateResult = await execAsync("npm run obd:generate", {
    cwd: process.cwd(),
    timeout: 60000,
    env: {
      ...process.env,
      PYTHONIOENCODING: "utf-8",
      PYTHONUTF8: "1",
    },
  });

  const aiReportResult = await execAsync(
    `python ai-engine/generate_player_ai_report.py --slug ${slug}`,
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

  return {
    generate_stdout: generateResult.stdout,
    generate_stderr: generateResult.stderr,
    ai_report_stdout: aiReportResult.stdout,
    ai_report_stderr: aiReportResult.stderr,
  };
}

function parseAgentOutput(value: unknown): AgentOutput {
  if (typeof value === "string") {
    let trimmed = value.trim();

    if (!trimmed) {
      throw new Error("AI output is empty");
    }

    if (trimmed.startsWith("```")) {
      trimmed = trimmed
        .replace(/^```json/i, "")
        .replace(/^```/i, "")
        .replace(/```$/i, "")
        .trim();
    }

    const firstBrace = trimmed.indexOf("{");
    const lastBrace = trimmed.lastIndexOf("}");

    if (firstBrace >= 0 && lastBrace > firstBrace) {
      trimmed = trimmed.slice(firstBrace, lastBrace + 1);
    }

    try {
      return JSON.parse(trimmed);
    } catch {
      throw new Error(
        "JSON inválido. Confirma se começa com {, termina com } e se todas as vírgulas estão corretas.",
      );
    }
  }

  if (value && typeof value === "object") {
    return value as AgentOutput;
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

  if (
    output.proposal_type !== "stat_update" &&
    output.proposal_type !== "news_update" &&
    output.proposal_type !== "profile_update"
  ) {
    errors.push(
      `Only stat_update, news_update and profile_update are supported for now. Received: ${output.proposal_type}`,
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

  if (output.proposal_type === "stat_update") {
    const statData = output.data as AgentStatData;

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
      if (!(field in statData)) {
        errors.push(`data is missing field: ${field}`);
      }
    }

    if (!cleanText(statData.opponent)) {
      errors.push("Opponent is required");
    }
  }

  if (output.proposal_type === "news_update") {
    const newsData = output.data as AgentNewsData;

    if (!cleanText(newsData.category)) {
      errors.push("News category is required");
    }

    if (!cleanText(newsData.title)) {
      errors.push("News title is required");
    }

    if (!cleanText(newsData.summary)) {
      errors.push("News summary is required");
    }
  }

  if (output.proposal_type === "profile_update") {
    const profileData = output.data as AgentProfileData;

    const editableFields: (keyof AgentProfileData)[] = [
      "profile_type",
      "name",
      "club",
      "position",
      "nationality",
      "gender",
      "league",
      "height_cm",
      "photo",
      "highlight_video",
      "instagram",
      "youtube",
      "bio",
      "agent_notes",
      "status",
      "tags",
    ];

    const changedFields = editableFields.filter((field) => {
      const value = profileData[field];

      if (Array.isArray(value)) {
        return value.length > 0;
      }

      return value !== undefined && value !== null && cleanText(value) !== "";
    });

    if (changedFields.length === 0) {
      errors.push("Profile update must include at least one editable field");
    }

    if (
      profileData.profile_type &&
      !["player", "coach"].includes(cleanText(profileData.profile_type))
    ) {
      errors.push("profile_type must be player or coach");
    }

    if (
      profileData.gender &&
      !["female", "male"].includes(cleanText(profileData.gender))
    ) {
      errors.push("gender must be female or male");
    }

    if (
      profileData.status &&
      !["active", "archived"].includes(cleanText(profileData.status))
    ) {
      errors.push("status must be active or archived");
    }
  }

  return errors;
}

async function writeRawSourceCopy(output: AgentOutput, slug: string) {
  const rawSourcesDir = getRawSourcesDir();

  await fs.mkdir(rawSourcesDir, { recursive: true });

  const sourceId = cleanText(output.source_id || "orangeball-agent");
  const safeSourceId = safeFilePart(sourceId);
  const fileName = `${slug}-${safeSourceId}-agent-${timestampForFile()}.json`;

  const rawPayload = {
    schema_version: "1.0",
    source_id: sourceId,
    player_slug: slug,
    collected_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    status: "raw_ready",
    source_url: cleanText(output.source_url),
    confidence: Number(output.confidence || 0),
    raw_data: output.data || {},
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

function buildProfileProposedData(data: AgentProfileData) {
  const proposedData: Record<string, unknown> = {};

  const textFields: (keyof AgentProfileData)[] = [
    "profile_type",
    "name",
    "club",
    "position",
    "nationality",
    "gender",
    "league",
    "photo",
    "highlight_video",
    "instagram",
    "youtube",
    "bio",
    "agent_notes",
    "status",
  ];

  for (const field of textFields) {
    const value = data[field];

    if (value !== undefined && value !== null && cleanText(value) !== "") {
      proposedData[field] = cleanText(value);
    }
  }

  if (
    data.height_cm !== undefined &&
    data.height_cm !== null &&
    cleanText(data.height_cm) !== ""
  ) {
    proposedData.height_cm = cleanNumber(data.height_cm);
  }

  if (Array.isArray(data.tags)) {
    const cleanTags = data.tags.map((tag) => cleanText(tag)).filter(Boolean);

    if (cleanTags.length > 0) {
      proposedData.tags = cleanTags;
    }
  }

  return proposedData;
}

function applyProfileUpdate(
  currentProfile: Record<string, unknown>,
  proposedData: Record<string, unknown>,
  slug: string,
) {
  const updatedProfile: Record<string, unknown> = {
    ...currentProfile,
    slug,
    schema_version: currentProfile.schema_version || "1.0",
  };

  const textFields = [
    "profile_type",
    "name",
    "club",
    "position",
    "nationality",
    "gender",
    "league",
    "photo",
    "highlight_video",
    "instagram",
    "youtube",
    "bio",
    "agent_notes",
    "status",
  ];

  for (const field of textFields) {
    if (field in proposedData) {
      updatedProfile[field] = cleanText(proposedData[field]);
    }
  }

  if ("height_cm" in proposedData) {
    const height = cleanNumber(proposedData.height_cm);

    updatedProfile.height_cm = height > 0 ? height : null;
  }

  if (Array.isArray(proposedData.tags)) {
    updatedProfile.tags = proposedData.tags
      .map((tag) => cleanText(tag))
      .filter(Boolean);
  }

  return updatedProfile;
}

async function createProposalFromAgentOutput(
  slug: string,
  agentOutput: unknown,
) {
  const output = parseAgentOutput(agentOutput);

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

  const proposalId = createAgentProposalId();
  const pendingDir = getPendingProposalsDir(slug);

  await fs.mkdir(pendingDir, { recursive: true });

  const rawSourceFile = await writeRawSourceCopy(output, slug);

  if (output.proposal_type === "news_update") {
    const newsData = output.data as AgentNewsData;

    const proposal = {
      proposal_id: proposalId,
      type: "news_update",
      source: cleanText(output.source_id || "orangeball-agent"),
      source_url: cleanText(output.source_url),
      confidence: Number(output.confidence || 0),
      status: "pending",
      created_at: new Date().toISOString(),
      notes:
        cleanText(output.agent_notes) ||
        "Proposta de notícia criada a partir do Orangeball Scouting Agent.",
      proposed_data: {
        category: cleanText(newsData.category),
        title: cleanText(newsData.title),
        summary: cleanText(newsData.summary),
        content: cleanText(newsData.content),
        published_at: cleanText(newsData.published_at),
        source_name: cleanText(newsData.source_name),
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
      message: "News output processed and proposal created",
      slug,
      proposal,
    });
  }

  if (output.proposal_type === "profile_update") {
    const profileData = output.data as AgentProfileData;

    const proposal = {
      proposal_id: proposalId,
      type: "profile_update",
      source: cleanText(output.source_id || "orangeball-agent"),
      source_url: cleanText(output.source_url),
      confidence: Number(output.confidence || 0),
      status: "pending",
      created_at: new Date().toISOString(),
      notes:
        cleanText(output.agent_notes) ||
        "Proposta de atualização de perfil criada a partir do Orangeball Scouting Agent.",
      proposed_data: buildProfileProposedData(profileData),
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
      message: "Profile output processed and proposal created",
      slug,
      proposal,
    });
  }

  const statData = output.data as AgentStatData;

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
      competition: cleanText(statData.competition),
      season: cleanText(statData.season),
      round: cleanText(statData.round),
      opponent: cleanText(statData.opponent),
      points: cleanNumber(statData.points),
      rebounds: cleanNumber(statData.rebounds),
      assists: cleanNumber(statData.assists),
      steals: cleanNumber(statData.steals),
      blocks: cleanNumber(statData.blocks),
      minutes: cleanNumber(statData.minutes),
    },
    audit: {
      created_by: "orangeball-scouting-agent",
      raw_source_file: rawSourceFile,
    },
  };

  const proposalFile = path.join(pendingDir, `${proposalId}.json`);

  await fs.writeFile(proposalFile, JSON.stringify(proposal, null, 2), "utf-8");

  return NextResponse.json({
    status: "ok",
    message: "Agent output processed and proposal created",
    slug,
    proposal,
  });
}

async function reviewProfileProposal(
  slug: string,
  proposalId: string,
  decision: "approved" | "rejected",
  reviewedBy: string,
) {
  const proposalFile = getPendingProposalFile(slug, proposalId);

  const currentFile = await fs.readFile(proposalFile, "utf-8");
  const proposal = JSON.parse(currentFile);

  if (proposal.type !== "profile_update") {
    return null;
  }

  if (proposal.status !== "pending") {
    return NextResponse.json(
      { error: "Only pending proposals can be reviewed" },
      { status: 400 },
    );
  }

  const reviewedAt = new Date().toISOString();

  const reviewedProposal = {
    ...proposal,
    status: decision,
    reviewed_at: reviewedAt,
    reviewed_by: reviewedBy,
  };

  let generationOutput = {
    generate_stdout: "",
    generate_stderr: "",
    ai_report_stdout: "",
    ai_report_stderr: "",
  };

  if (decision === "approved") {
    const profileFile = getPlayerProfileFile(slug);

    let currentProfile: Record<string, unknown>;

    try {
      currentProfile = await readJsonFile(profileFile);
    } catch {
      return NextResponse.json(
        { error: "Profile file not found" },
        { status: 404 },
      );
    }

    const proposedData = proposal.proposed_data || {};

    const updatedProfile = applyProfileUpdate(
      currentProfile,
      proposedData,
      slug,
    );

    await fs.writeFile(
      profileFile,
      JSON.stringify(updatedProfile, null, 2),
      "utf-8",
    );

    reviewedProposal.approved_profile_file = path.relative(
      process.cwd(),
      profileFile,
    );

    reviewedProposal.applied_profile_fields = Object.keys(proposedData);

    generationOutput = await runGenerateTasks(slug);
  }

  const reviewedDir = getReviewedProposalsDir(slug, decision);

  await fs.mkdir(reviewedDir, { recursive: true });

  const reviewedFile = path.join(reviewedDir, `${proposalId}.json`);

  await fs.writeFile(
    reviewedFile,
    JSON.stringify(reviewedProposal, null, 2),
    "utf-8",
  );

  await fs.unlink(proposalFile);

  return NextResponse.json({
    status: "ok",
    slug,
    decision,
    proposal_id: proposalId,
    message:
      decision === "approved"
        ? "Profile proposal approved, profile updated and website regenerated"
        : "Profile proposal rejected",
    proposal: reviewedProposal,
    ...generationOutput,
  });
}

async function reviewNewsProposal(
  slug: string,
  proposalId: string,
  decision: "approved" | "rejected",
  reviewedBy: string,
) {
  const proposalFile = getPendingProposalFile(slug, proposalId);

  const currentFile = await fs.readFile(proposalFile, "utf-8");
  const proposal = JSON.parse(currentFile);

  if (proposal.type !== "news_update") {
    return null;
  }

  if (proposal.status !== "pending") {
    return NextResponse.json(
      { error: "Only pending proposals can be reviewed" },
      { status: 400 },
    );
  }

  const reviewedAt = new Date().toISOString();

  const reviewedProposal = {
    ...proposal,
    status: decision,
    reviewed_at: reviewedAt,
    reviewed_by: reviewedBy,
  };

  let generationOutput = {
    generate_stdout: "",
    generate_stderr: "",
    ai_report_stdout: "",
    ai_report_stderr: "",
  };

  if (decision === "approved") {
    const newsDir = getPlayerNewsDir(slug);

    await fs.mkdir(newsDir, { recursive: true });

    const data = proposal.proposed_data || {};
    const newsId = createNewsId(data.title || proposalId);

    const newsRecord = {
      schema_version: "1.0",
      news_id: newsId,
      player_slug: slug,
      category: cleanText(data.category),
      title: cleanText(data.title),
      summary: cleanText(data.summary),
      content: cleanText(data.content),
      published_at: cleanText(data.published_at),
      source_name: cleanText(data.source_name || proposal.source),
      source_url: cleanText(proposal.source_url),
      confidence: Number(proposal.confidence || 0),
      created_at: reviewedAt,
      created_from_proposal_id: proposalId,
      created_by: reviewedBy,
      notes: cleanText(proposal.notes),
    };

    const newsFile = path.join(newsDir, `${newsId}.json`);

    await fs.writeFile(newsFile, JSON.stringify(newsRecord, null, 2), "utf-8");

    reviewedProposal.approved_news_file = path.relative(
      process.cwd(),
      newsFile,
    );

    generationOutput = await runGenerateTasks(slug);
  }

  const reviewedDir = getReviewedProposalsDir(slug, decision);

  await fs.mkdir(reviewedDir, { recursive: true });

  const reviewedFile = path.join(reviewedDir, `${proposalId}.json`);

  await fs.writeFile(
    reviewedFile,
    JSON.stringify(reviewedProposal, null, 2),
    "utf-8",
  );

  await fs.unlink(proposalFile);

  return NextResponse.json({
    status: "ok",
    slug,
    decision,
    proposal_id: proposalId,
    message:
      decision === "approved"
        ? "News proposal approved, saved and website regenerated"
        : "News proposal rejected",
    proposal: reviewedProposal,
    ...generationOutput,
  });
}

export async function GET(_request: Request, { params }: Params) {
  const slug = params.slug;

  if (!isValidSlug(slug)) {
    return NextResponse.json({ error: "Invalid player slug" }, { status: 400 });
  }

  try {
    const pendingDir = getPendingProposalsDir(slug);

    await fs.mkdir(pendingDir, { recursive: true });

    const files = await fs.readdir(pendingDir);

    const proposals: ProposalRecord[] = [];

    for (const file of files) {
      if (!file.endsWith(".json")) continue;

      try {
        const filePath = path.join(pendingDir, file);
        const proposal = await readJsonFile(filePath);

        proposals.push(proposal);
      } catch {
        // Ignore invalid proposal files
      }
    }

    proposals.sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();

      return dateB - dateA;
    });

    return NextResponse.json({
      status: "ok",
      slug,
      count: proposals.length,
      proposals,
    });
  } catch {
    return NextResponse.json(
      { error: "Could not load proposals" },
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
    const body = (await request.json()) as ReviewBody;

    if (body.action === "agent_output") {
      try {
        return await createProposalFromAgentOutput(slug, body.agent_output);
      } catch (error) {
        return NextResponse.json(
          {
            status: "error",
            message: "Could not process agent output",
            error: error instanceof Error ? error.message : "Unknown error",
          },
          { status: 400 },
        );
      }
    }

    const decision = body.decision;
    const proposalId = body.proposal_id;
    const reviewedBy = cleanText(body.reviewed_by || "admin");

    if (decision !== "approved" && decision !== "rejected") {
      return NextResponse.json(
        { error: "Decision must be approved or rejected" },
        { status: 400 },
      );
    }

    if (proposalId && !isValidProposalId(proposalId)) {
      return NextResponse.json(
        { error: "Invalid proposal id" },
        { status: 400 },
      );
    }

    if (proposalId) {
      const profileReviewResponse = await reviewProfileProposal(
        slug,
        proposalId,
        decision,
        reviewedBy,
      );

      if (profileReviewResponse) {
        return profileReviewResponse;
      }

      const newsReviewResponse = await reviewNewsProposal(
        slug,
        proposalId,
        decision,
        reviewedBy,
      );

      if (newsReviewResponse) {
        return newsReviewResponse;
      }
    }

    const proposalArg = proposalId ? ` --proposal-id ${proposalId}` : "";

    const reviewCommand =
      `python ai-engine/actions/review_proposal.py` +
      ` --slug ${slug}` +
      ` --decision ${decision}` +
      proposalArg +
      ` --reviewed-by ${reviewedBy}`;

    const reviewResult = await execAsync(reviewCommand, {
      cwd: process.cwd(),
      timeout: 60000,
      env: {
        ...process.env,
        PYTHONIOENCODING: "utf-8",
        PYTHONUTF8: "1",
      },
    });

    let generationOutput = {
      generate_stdout: "",
      generate_stderr: "",
      ai_report_stdout: "",
      ai_report_stderr: "",
    };

    if (decision === "approved") {
      generationOutput = await runGenerateTasks(slug);
    }

    return NextResponse.json({
      status: "ok",
      slug,
      decision,
      message:
        decision === "approved"
          ? "Proposal approved, stats updated and website regenerated"
          : "Proposal rejected",
      review_stdout: reviewResult.stdout,
      review_stderr: reviewResult.stderr,
      ...generationOutput,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: "Could not review proposal",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request, { params }: Params) {
  const slug = params.slug;

  if (!isValidSlug(slug)) {
    return NextResponse.json({ error: "Invalid player slug" }, { status: 400 });
  }

  try {
    const body = (await request.json()) as UpdateProposalBody;

    const proposalId = body.proposal_id;

    if (!proposalId || !isValidProposalId(proposalId)) {
      return NextResponse.json(
        { error: "Invalid proposal id" },
        { status: 400 },
      );
    }

    const proposalFile = getPendingProposalFile(slug, proposalId);

    const currentFile = await fs.readFile(proposalFile, "utf-8");
    const proposal = JSON.parse(currentFile);

    if (proposal.status !== "pending") {
      return NextResponse.json(
        { error: "Only pending proposals can be edited" },
        { status: 400 },
      );
    }

    const currentData = proposal.proposed_data || {};
    const newData = body.proposed_data || {};

    const updatedProposal = {
      ...proposal,
      notes:
        body.notes !== undefined ? cleanText(body.notes) : proposal.notes || "",
      updated_at: new Date().toISOString(),
      proposed_data: {
        ...currentData,
        competition:
          newData.competition !== undefined
            ? cleanText(newData.competition)
            : currentData.competition || "",
        season:
          newData.season !== undefined
            ? cleanText(newData.season)
            : currentData.season || "",
        round:
          newData.round !== undefined
            ? cleanText(newData.round)
            : currentData.round || "",
        opponent:
          newData.opponent !== undefined
            ? cleanText(newData.opponent)
            : currentData.opponent || "",
        points:
          newData.points !== undefined
            ? cleanNumber(newData.points)
            : cleanNumber(currentData.points),
        rebounds:
          newData.rebounds !== undefined
            ? cleanNumber(newData.rebounds)
            : cleanNumber(currentData.rebounds),
        assists:
          newData.assists !== undefined
            ? cleanNumber(newData.assists)
            : cleanNumber(currentData.assists),
        steals:
          newData.steals !== undefined
            ? cleanNumber(newData.steals)
            : cleanNumber(currentData.steals),
        blocks:
          newData.blocks !== undefined
            ? cleanNumber(newData.blocks)
            : cleanNumber(currentData.blocks),
        minutes:
          newData.minutes !== undefined
            ? cleanNumber(newData.minutes)
            : cleanNumber(currentData.minutes),
      },
    };

    if (!updatedProposal.proposed_data.opponent) {
      return NextResponse.json(
        { error: "Opponent is required" },
        { status: 400 },
      );
    }

    await fs.writeFile(
      proposalFile,
      JSON.stringify(updatedProposal, null, 2),
      "utf-8",
    );

    return NextResponse.json({
      status: "ok",
      message: "Proposal updated successfully",
      slug,
      proposal: updatedProposal,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: "Could not update proposal",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
