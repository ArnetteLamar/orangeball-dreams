import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROOT = process.cwd();

const PENDING_DIR = path.join(ROOT, "ai-engine", "data", "news", "pending");
const APPROVED_DIR = path.join(ROOT, "ai-engine", "data", "news", "approved");
const REJECTED_DIR = path.join(ROOT, "ai-engine", "data", "news", "rejected");
const HOME_NEWS_DIR = path.join(ROOT, "ai-engine", "data", "news", "home");
const PUBLIC_NEWS_DIR = path.join(ROOT, "public", "generated", "news");
const PUBLIC_HOME_NEWS_FILE = path.join(PUBLIC_NEWS_DIR, "home.json");

type NewsProposal = {
  status: string;
  created_at?: string;
  proposal_type: string;
  target: "homepage" | "player_profile" | "both";
  confidence: number;
  data: {
    id: string;
    date: string;
    homepage?: boolean;
    category: unknown;
    title: unknown;
    summary: unknown;
    image?: string;
    player_slug?: string;
    href: string;
    source: string;
  };
  evidence?: Record<string, unknown>;
};

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

function safeJsonParse(text: string) {
  return JSON.parse(text.replace(/^\uFEFF/, ""));
}

async function readJsonFile<T>(filePath: string): Promise<T> {
  const text = await fs.readFile(filePath, "utf-8");
  return safeJsonParse(text) as T;
}

async function writeJsonFile(filePath: string, data: unknown) {
  await ensureDir(path.dirname(filePath));

  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

function sanitizeFileName(fileName: string) {
  return path.basename(fileName);
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function getPendingProposalPath(fileName: string) {
  const safeName = sanitizeFileName(fileName);
  const filePath = path.join(PENDING_DIR, safeName);

  await fs.access(filePath);

  return filePath;
}

async function generateHomeNewsJson() {
  await ensureDir(HOME_NEWS_DIR);
  await ensureDir(PUBLIC_NEWS_DIR);

  const fileNames = await fs.readdir(HOME_NEWS_DIR).catch(() => [] as string[]);

  const items = [];

  for (const fileName of fileNames) {
    if (!fileName.endsWith(".json")) continue;

    const filePath = path.join(HOME_NEWS_DIR, fileName);

    try {
      const item = await readJsonFile<Record<string, unknown>>(filePath);

      if (item.homepage !== false) {
        items.push(item);
      }
    } catch {
      // Ignora ficheiros inválidos sem partir o Admin.
    }
  }

  items.sort((a, b) =>
    String(b.date || "").localeCompare(String(a.date || "")),
  );

  await writeJsonFile(PUBLIC_HOME_NEWS_FILE, items);

  return items.length;
}

async function listPendingNewsProposals() {
  await ensureDir(PENDING_DIR);

  const fileNames = await fs.readdir(PENDING_DIR).catch(() => [] as string[]);

  const proposals = [];

  for (const fileName of fileNames) {
    if (!fileName.endsWith(".json")) continue;

    const filePath = path.join(PENDING_DIR, fileName);

    try {
      const proposal = await readJsonFile<NewsProposal>(filePath);

      if (proposal.proposal_type === "news_update") {
        proposals.push({
          file_name: fileName,
          ...proposal,
        });
      }
    } catch {
      proposals.push({
        file_name: fileName,
        status: "invalid",
        proposal_type: "news_update",
        target: "homepage",
        confidence: 0,
        data: {
          id: fileName,
          date: "",
          category: "Invalid",
          title: "Invalid JSON proposal",
          summary: "This pending proposal could not be read.",
          href: "",
          source: "Unknown",
        },
      });
    }
  }

  proposals.sort((a, b) =>
    String(b.created_at || b.data?.date || "").localeCompare(
      String(a.created_at || a.data?.date || ""),
    ),
  );

  return proposals;
}

async function approveProposal(fileName: string) {
  const pendingPath = await getPendingProposalPath(fileName);
  const proposal = await readJsonFile<NewsProposal>(pendingPath);

  if (proposal.proposal_type !== "news_update") {
    throw new Error("Only news_update proposals can be approved here.");
  }

  if (proposal.status !== "pending") {
    throw new Error("Only pending proposals can be approved.");
  }

  if (proposal.target !== "homepage" && proposal.target !== "both") {
    throw new Error(
      "This Admin approval currently supports only homepage or both targets.",
    );
  }

  const data = proposal.data;
  const newsId = slugify(data.id);

  if (!newsId) {
    throw new Error("News proposal is missing a valid id.");
  }

  const newsItem = {
    id: newsId,
    date: data.date,
    homepage: data.homepage ?? true,
    category: data.category,
    title: data.title,
    summary: data.summary,
    image: data.image || "",
    player_slug: data.player_slug || "",
    href: data.href,
    source: data.source,
  };

  const newsPath = path.join(HOME_NEWS_DIR, `${newsId}.json`);

  await writeJsonFile(newsPath, newsItem);

  const approvedProposal = {
    ...proposal,
    status: "approved",
    approved_at: new Date().toISOString(),
  };

  await writeJsonFile(
    path.join(APPROVED_DIR, sanitizeFileName(fileName)),
    approvedProposal,
  );

  await fs.unlink(pendingPath);

  const totalNews = await generateHomeNewsJson();

  return {
    newsPath,
    totalNews,
  };
}

async function rejectProposal(fileName: string) {
  const pendingPath = await getPendingProposalPath(fileName);
  const proposal = await readJsonFile<NewsProposal>(pendingPath);

  if (proposal.proposal_type !== "news_update") {
    throw new Error("Only news_update proposals can be rejected here.");
  }

  if (proposal.status !== "pending") {
    throw new Error("Only pending proposals can be rejected.");
  }

  const rejectedProposal = {
    ...proposal,
    status: "rejected",
    rejected_at: new Date().toISOString(),
  };

  await writeJsonFile(
    path.join(REJECTED_DIR, sanitizeFileName(fileName)),
    rejectedProposal,
  );

  await fs.unlink(pendingPath);
}

export async function GET() {
  try {
    const proposals = await listPendingNewsProposals();

    return NextResponse.json({
      status: "ok",
      count: proposals.length,
      proposals,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        error:
          error instanceof Error
            ? error.message
            : "Failed to load news proposals.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const action = body?.action;
    const fileName = body?.file_name;

    if (!fileName || typeof fileName !== "string") {
      return NextResponse.json(
        {
          status: "error",
          error: "file_name is required.",
        },
        { status: 400 },
      );
    }

    if (action === "approve") {
      const result = await approveProposal(fileName);

      return NextResponse.json({
        status: "approved",
        file_name: fileName,
        ...result,
      });
    }

    if (action === "reject") {
      await rejectProposal(fileName);

      return NextResponse.json({
        status: "rejected",
        file_name: fileName,
      });
    }

    return NextResponse.json(
      {
        status: "error",
        error: "Invalid action. Use approve or reject.",
      },
      { status: 400 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        error:
          error instanceof Error
            ? error.message
            : "Failed to process news proposal.",
      },
      { status: 500 },
    );
  }
}
