export type PlayerAverages = {
  games_played: number;
  ppg: number;
  rpg: number;
  apg: number;
  spg: number;
  bpg: number;
  mpg: number;
  performance_index: number;
};

export type LatestGame = {
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
  performance_index: number;
};

export type PlayerIndexItem = {
  slug: string;
  name: string;
  club: string;
  position: string;
  nationality: string;
  gender?: string;
  league?: string;
  photo: string;
  status?: string;
  summary?: string;
  averages: PlayerAverages;
  generated_at?: string;
};

export type PlayerProfile = PlayerIndexItem & {
  schema_version?: string;
  content_type?: string;
  highlight_video: string;
  latest_game: LatestGame;
  source?: {
    profile?: string;
    stats?: string;
  };
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

export async function getPlayers(): Promise<PlayerIndexItem[]> {
  return fetchJson<PlayerIndexItem[]>("/generated/players/index.json");
}

export async function getPlayerBySlug(
  slug: string,
): Promise<PlayerProfile | null> {
  try {
    return await fetchJson<PlayerProfile>(`/generated/players/${slug}.json`);
  } catch {
    return null;
  }
}

export function searchPlayers(
  players: PlayerIndexItem[],
  search: string,
): PlayerIndexItem[] {
  const query = search.trim().toLowerCase();

  if (!query) {
    return players;
  }

  return players.filter((player) => {
    return (
      player.name.toLowerCase().includes(query) ||
      player.club.toLowerCase().includes(query) ||
      player.position.toLowerCase().includes(query) ||
      player.nationality.toLowerCase().includes(query) ||
      player.league?.toLowerCase().includes(query)
    );
  });
}

export function formatStat(value: number | undefined): string {
  if (typeof value !== "number") {
    return "0";
  }

  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
