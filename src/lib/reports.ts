export type RankingItem = {
  player: string;
  team: string;
  opponent: string;
  points?: number;
  rebounds?: number;
  assists?: number;
  performance_index?: number;
};

export type ReportHighlight = {
  player: string;
  team: string;
  opponent?: string;
  points?: number;
  performance_index?: number;
};

export type StatsReport = {
  schema_version: string;
  content_type: "stats_report";
  title: string;
  source_file?: string;
  generated_at?: string;
  competition: string;
  season: string;
  round: string;
  summary: string;
  best_scorer: ReportHighlight;
  most_complete: ReportHighlight;
  top_points: RankingItem[];
  top_rebounds: RankingItem[];
  top_assists: RankingItem[];
  top_performance: RankingItem[];
};

export type GeneratedManifest = {
  schema_version: string;
  project: string;
  content_type: "generated_manifest";
  generated_at: string;
  generator: string;
  players: {
    count: number;
    index_file: string;
    files: string[];
  };
  reports: {
    count: number;
    files: string[];
  };
  status: string;
};

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(`${url}?t=${Date.now()}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}`);
  }

  return response.json();
}

export async function getGeneratedManifest(): Promise<GeneratedManifest> {
  return fetchJson<GeneratedManifest>("/generated/manifest.json");
}

export async function getReports(): Promise<StatsReport[]> {
  const manifest = await getGeneratedManifest();

  if (!manifest.reports?.files?.length) {
    return [];
  }

  const reports = await Promise.all(
    manifest.reports.files
      .filter((file) => file.endsWith(".json"))
      .map((file) => fetchJson<StatsReport>(`/generated/reports/${file}`)),
  );

  return reports.sort((a, b) => {
    const dateA = a.generated_at ? new Date(a.generated_at).getTime() : 0;
    const dateB = b.generated_at ? new Date(b.generated_at).getTime() : 0;

    return dateB - dateA;
  });
}

export async function getLatestReport(): Promise<StatsReport | null> {
  const reports = await getReports();

  return reports[0] ?? null;
}

export function formatNumber(value: number | undefined): string {
  if (typeof value !== "number") {
    return "0";
  }

  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function formatGeneratedDate(value?: string): string {
  if (!value) {
    return "";
  }

  try {
    return new Intl.DateTimeFormat("pt-PT", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}
