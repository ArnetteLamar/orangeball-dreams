import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

type Params = {
  params: {
    slug: string;
  };
};

function isValidSlug(slug: string) {
  return /^[a-z0-9-]+$/.test(slug);
}

export async function GET(_request: Request, { params }: Params) {
  const slug = params.slug;

  if (!isValidSlug(slug)) {
    return NextResponse.json({ error: "Invalid player slug" }, { status: 400 });
  }

  const profilePath = path.join(
    process.cwd(),
    "ai-engine",
    "data",
    "players",
    slug,
    "profile.json",
  );

  try {
    const file = await fs.readFile(profilePath, "utf-8");
    const profile = JSON.parse(file);

    return NextResponse.json({
      status: "ok",
      source: "ai-engine",
      profile,
    });
  } catch {
    return NextResponse.json(
      { error: "Player source profile not found" },
      { status: 404 },
    );
  }
}
