"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useLocale } from "@/app/[locale]/I18nProvider";
import PlayerImage from "@/components/PlayerImage";
import { formatStat, getPlayerBySlug, type PlayerProfile } from "@/lib/players";
import { mediaVideos } from "@/lib/media";

type PlayerGame = {
  game_number: number;
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

type CompetitionAverage = {
  season: string;
  competition: string;
  games_played: number;
  ppg: number;
  rpg: number;
  apg: number;
  spg: number;
  bpg: number;
  mpg: number;
  performance_index: number;
};

type PlayerNews = {
  news_id: string;
  category: string;
  title: string;
  summary: string;
  content?: string;
  published_at?: string;
  source_name?: string;
  source_url?: string;
  confidence?: number;
  created_at?: string;
};

type EnhancedPlayerProfile = PlayerProfile & {
  profile_type?: string;
  category?: string;
  gender?: string;
  bio?: string;
  agent_notes?: string;
  tags?: string[];
  games?: PlayerGame[];
  latest_game?: PlayerGame;
  averages_by_competition?: CompetitionAverage[];
  news?: PlayerNews[];
};

type OverviewAverages = {
  games_played: number;
  ppg: number;
  rpg: number;
  apg: number;
  spg: number;
  bpg: number;
  mpg: number;
  performance_index: number;
};

function roundStat(value: number) {
  return Number(value.toFixed(1));
}

function normalizeValue(value?: string | null) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function isCoachProfile(player: EnhancedPlayerProfile | null) {
  if (!player) return false;

  const profileType = normalizeValue(player.profile_type || player.category);
  const position = normalizeValue(player.position);

  return (
    profileType === "coach" ||
    profileType === "treinador" ||
    profileType === "entrenador" ||
    position.includes("coach") ||
    position.includes("treinador") ||
    position.includes("treinadora") ||
    position.includes("entrenador") ||
    position.includes("entrenadora")
  );
}

function calculateAveragesFromGames(games: PlayerGame[]): OverviewAverages {
  if (games.length === 0) {
    return {
      games_played: 0,
      ppg: 0,
      rpg: 0,
      apg: 0,
      spg: 0,
      bpg: 0,
      mpg: 0,
      performance_index: 0,
    };
  }

  const totals = games.reduce(
    (acc, game) => {
      acc.points += Number(game.points || 0);
      acc.rebounds += Number(game.rebounds || 0);
      acc.assists += Number(game.assists || 0);
      acc.steals += Number(game.steals || 0);
      acc.blocks += Number(game.blocks || 0);
      acc.minutes += Number(game.minutes || 0);
      acc.performance_index += Number(game.performance_index || 0);

      return acc;
    },
    {
      points: 0,
      rebounds: 0,
      assists: 0,
      steals: 0,
      blocks: 0,
      minutes: 0,
      performance_index: 0,
    },
  );

  const gamesPlayed = games.length;

  return {
    games_played: gamesPlayed,
    ppg: roundStat(totals.points / gamesPlayed),
    rpg: roundStat(totals.rebounds / gamesPlayed),
    apg: roundStat(totals.assists / gamesPlayed),
    spg: roundStat(totals.steals / gamesPlayed),
    bpg: roundStat(totals.blocks / gamesPlayed),
    mpg: roundStat(totals.minutes / gamesPlayed),
    performance_index: roundStat(totals.performance_index / gamesPlayed),
  };
}

export default function DynamicPlayerPage() {
  const params = useParams();
  const locale = useLocale();
  const isES = locale === "es";
  const isPT = locale === "pt";

  const rawSlug = params?.slug;
  const slug = Array.isArray(rawSlug)
    ? rawSlug[0]
    : (rawSlug as string | undefined);

  const [player, setPlayer] = useState<EnhancedPlayerProfile | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState("all");
  const [selectedCompetition, setSelectedCompetition] = useState("all");

  const texts = {
    loading: isES
      ? "Cargando perfil..."
      : isPT
        ? "A carregar perfil..."
        : "Loading profile...",
    notFoundTitle: isES
      ? "Perfil no encontrado"
      : isPT
        ? "Perfil não encontrado"
        : "Profile not found",
    notFoundText: isES
      ? "Todavía no existe un perfil generado."
      : isPT
        ? "Ainda não existe um perfil gerado."
        : "No generated profile exists yet.",
    profileBadge: isES
      ? "Perfil Orangeball Dreams"
      : isPT
        ? "Perfil Orangeball Dreams"
        : "Orangeball Dreams Player Profile",
    coachProfileBadge: isES
      ? "Coach Profile"
      : isPT
        ? "Perfil de Treinador"
        : "Coach Profile",
    seasonOverview: isES
      ? "Resumen estadístico"
      : isPT
        ? "Resumo estatístico"
        : "Statistical overview",
    coachOverview: isES
      ? "Resumen técnico"
      : isPT
        ? "Resumo técnico"
        : "Technical overview",
    gamesPlayed: isES ? "Partidos" : isPT ? "Jogos" : "Games",
    competitionAverages: isES
      ? "Medias por competición"
      : isPT
        ? "Médias por competição"
        : "Averages by competition",
    latestGame: isES ? "Último partido" : isPT ? "Último jogo" : "Latest Game",
    gameHistory: isES
      ? "Historial de partidos"
      : isPT
        ? "Histórico de jogos"
        : "Game history",
    noGames: isES
      ? "Todavía no hay partidos registrados."
      : isPT
        ? "Ainda não existem jogos registados."
        : "No games registered yet.",
    highlightUnavailable: isES
      ? "Vídeo destacado aún no disponible"
      : isPT
        ? "Vídeo de destaque ainda não disponível"
        : "Highlight video not available yet",
    highlightVideo: isES
      ? "Vídeo destacado"
      : isPT
        ? "Vídeo de destaque"
        : "Highlight Video",
    playerHighlights: isES
      ? "Highlights del atleta"
      : isPT
        ? "Highlights do atleta"
        : "Player highlights",
    coachHighlights: isES
      ? "Vídeo del entrenador"
      : isPT
        ? "Vídeo do treinador"
        : "Coach video",
    highlightDescription: isES
      ? "Vídeo principal de presentación del perfil."
      : isPT
        ? "Vídeo principal de apresentação do perfil."
        : "Main showcase video for this profile.",
    statFilters: isES
      ? "Filtros estadísticos"
      : isPT
        ? "Filtros estatísticos"
        : "Stat filters",
    statFiltersDescription: isES
      ? "Filtra los partidos por temporada y competición."
      : isPT
        ? "Filtra os jogos por época e competição."
        : "Filter games by season and competition.",
    season: isES ? "Temporada" : isPT ? "Época" : "Season",
    competition: isES ? "Competición" : isPT ? "Competição" : "Competition",
    all: isES ? "Todas" : isPT ? "Todas" : "All",
    allSeasons: isES
      ? "Todas las temporadas"
      : isPT
        ? "Todas as épocas"
        : "All seasons",
    allCompetitions: isES
      ? "Todas las competiciones"
      : isPT
        ? "Todas as competições"
        : "All competitions",
    club: isES ? "Club" : isPT ? "Clube" : "Club",
    league: isES ? "Liga" : isPT ? "Liga" : "League",
    nationality: isES ? "Nacionalidad" : isPT ? "Nacionalidade" : "Nationality",
    status: isES ? "Estado" : isPT ? "Estado" : "Status",
    biography: isES ? "Biografía" : isPT ? "Biografia" : "Biography",
    experienceNotes: isES
      ? "Experiencia y notas"
      : isPT
        ? "Experiência e notas"
        : "Experience and notes",
    noBio: isES
      ? "Biografía aún no disponible."
      : isPT
        ? "Biografia ainda não disponível."
        : "Biography not available yet.",
    noNotes: isES
      ? "Notas técnicas aún no disponibles."
      : isPT
        ? "Notas técnicas ainda não disponíveis."
        : "Technical notes not available yet.",
    freeAgent: "Free Agent",
    latestUpdates: isES
      ? "Últimas actualizaciones"
      : isPT
        ? "Últimas atualizações"
        : "Latest updates",
    readSource: isES ? "Ver fuente" : isPT ? "Ver fonte" : "View source",
    sourceLabel: isES ? "Fuente" : isPT ? "Fonte" : "Source",
  };

  useEffect(() => {
    if (!slug) return;

    let isMounted = true;

    getPlayerBySlug(slug)
      .then((data) => {
        if (!isMounted) return;

        if (!data) {
          setNotFound(true);
          return;
        }

        setPlayer(data as EnhancedPlayerProfile);
      })
      .catch(() => {
        if (isMounted) {
          setNotFound(true);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  const isCoach = useMemo(() => isCoachProfile(player), [player]);

  const hasHighlightVideo = useMemo(() => {
    if (!player?.highlight_video) return false;
    return !player.highlight_video.includes("VIDEO_ID");
  }, [player]);

  const allGames = useMemo(() => {
    return [...(player?.games || [])].sort(
      (a, b) => (b.game_number || 0) - (a.game_number || 0),
    );
  }, [player]);

  const seasons = useMemo(() => {
    return Array.from(
      new Set(allGames.map((game) => game.season).filter(Boolean)),
    ).sort((a, b) => b.localeCompare(a));
  }, [allGames]);

  const competitions = useMemo(() => {
    const sourceGames =
      selectedSeason === "all"
        ? allGames
        : allGames.filter((game) => game.season === selectedSeason);

    return Array.from(
      new Set(sourceGames.map((game) => game.competition).filter(Boolean)),
    ).sort((a, b) => a.localeCompare(b));
  }, [allGames, selectedSeason]);

  const games = useMemo(() => {
    return allGames.filter((game) => {
      const matchesSeason =
        selectedSeason === "all" || game.season === selectedSeason;

      const matchesCompetition =
        selectedCompetition === "all" ||
        game.competition === selectedCompetition;

      return matchesSeason && matchesCompetition;
    });
  }, [allGames, selectedSeason, selectedCompetition]);

  const selectedAverages = useMemo(() => {
    return calculateAveragesFromGames(games);
  }, [games]);

  const selectedContextLabel = useMemo(() => {
    const seasonLabel =
      selectedSeason === "all" ? texts.allSeasons : selectedSeason;

    const competitionLabel =
      selectedCompetition === "all"
        ? texts.allCompetitions
        : selectedCompetition;

    return `${seasonLabel} · ${competitionLabel}`;
  }, [
    selectedSeason,
    selectedCompetition,
    texts.allSeasons,
    texts.allCompetitions,
  ]);

  const competitionAverages = useMemo(() => {
    const averages = player?.averages_by_competition || [];

    return averages.filter((item) => {
      const matchesSeason =
        selectedSeason === "all" || item.season === selectedSeason;

      const matchesCompetition =
        selectedCompetition === "all" ||
        item.competition === selectedCompetition;

      return matchesSeason && matchesCompetition;
    });
  }, [player, selectedSeason, selectedCompetition]);

  const latestNews = useMemo(() => {
    return [...(player?.news || [])].sort((a, b) => {
      const dateA = new Date(a.published_at || a.created_at || 0).getTime();
      const dateB = new Date(b.published_at || b.created_at || 0).getTime();

      return dateB - dateA;
    });
  }, [player]);

  if (loading) {
    return (
      <>
        <Navbar />
        <section className="section section--soft">
          <div className="container">{texts.loading}</div>
        </section>
        <Footer />
      </>
    );
  }

  if (notFound || !player) {
    return (
      <>
        <Navbar />
        <section className="section section--soft">
          <div className="container">
            <h1 className="h3 fw-bold">{texts.notFoundTitle}</h1>
            <p className="text-muted mb-0">{texts.notFoundText}</p>
          </div>
        </section>
        <Footer />
      </>
    );
  }

  const latestGame = player.latest_game;

  return (
    <>
      <Navbar />

      <section className="section player-hero player-profile-hero">
        <div className="container">
          <div className="row g-4 align-items-center">
            <div className="col-lg-5">
              <div className="player-photo-card player-photo-card-premium">
                <div className="player-profile-photo">
                  <PlayerImage src={player.photo} alt={player.name} />
                </div>
              </div>
            </div>

            <div className="col-lg-7">
              <span className="badge text-bg-dark mb-3">
                {isCoach ? texts.coachProfileBadge : texts.profileBadge}
              </span>

              <h1 className="display-4 fw-bold mb-3">{player.name}</h1>

              <div className="d-flex flex-wrap gap-2 mb-4 player-profile-meta">
                <span className="badge text-bg-light">
                  {player.club || texts.freeAgent}
                </span>

                <span className="badge text-bg-light">
                  {player.position || "—"}
                </span>

                <span className="badge text-bg-light">
                  {player.nationality || "—"}
                </span>

                {player.league ? (
                  <span className="badge text-bg-light">{player.league}</span>
                ) : null}
              </div>

              <p className="fs-5 player-summary-text">
                {player.summary || player.bio || texts.noBio}
              </p>

              <div className="mt-4 player-hero-overview">
                {isCoach ? (
                  <>
                    <h2 className="h5 fw-bold mb-2">{texts.coachOverview}</h2>

                    <p className="small-muted mb-3">
                      {player.position || texts.coachProfileBadge}
                    </p>

                    <div className="row g-3">
                      <CoachInfoCard
                        label={texts.club}
                        value={player.club || texts.freeAgent}
                      />

                      <CoachInfoCard
                        label={texts.league}
                        value={player.league || texts.freeAgent}
                      />

                      <CoachInfoCard
                        label={texts.nationality}
                        value={player.nationality || "—"}
                      />

                      <CoachInfoCard
                        label={texts.status}
                        value={player.status || "active"}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <h2 className="h5 fw-bold mb-2">{texts.seasonOverview}</h2>

                    <p className="small-muted mb-3">{selectedContextLabel}</p>

                    <div className="row g-3">
                      <MainStat
                        label={texts.gamesPlayed}
                        value={selectedAverages.games_played}
                      />

                      <MainStat label="PPG" value={selectedAverages.ppg} />
                      <MainStat label="RPG" value={selectedAverages.rpg} />
                      <MainStat label="APG" value={selectedAverages.apg} />

                      <MainStat
                        label="OBD Index"
                        value={selectedAverages.performance_index}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {latestNews.length > 0 ? (
        <PlayerNewsSection
          news={latestNews}
          texts={{
            latestUpdates: texts.latestUpdates,
            readSource: texts.readSource,
            sourceLabel: texts.sourceLabel,
          }}
        />
      ) : null}

      {isCoach ? (
        <section className="section pt-0">
          <div className="container">
            <div className="row g-4">
              <div className="col-lg-7">
                <div className="card shadow-soft h-100">
                  <div className="card-body p-4">
                    <h2 className="h4 fw-bold mb-3 title-accent">
                      {texts.biography}
                    </h2>

                    <p className="text-muted mb-4">
                      {player.bio || player.summary || texts.noBio}
                    </p>

                    <h3 className="h5 fw-bold mb-3">{texts.experienceNotes}</h3>

                    <p className="text-muted mb-0">
                      {player.agent_notes || texts.noNotes}
                    </p>

                    {player.tags && player.tags.length > 0 ? (
                      <div className="d-flex flex-wrap gap-2 mt-4">
                        {player.tags.map((tag) => (
                          <span className="badge text-bg-light" key={tag}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="col-lg-5">
                <div className="card shadow-soft h-100 overflow-hidden">
                  {hasHighlightVideo ? (
                    <div className="ratio ratio-16x9 bg-dark">
                      <iframe
                        src={player.highlight_video}
                        title={`${player.name} video`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <div className="ratio ratio-16x9 bg-dark d-flex align-items-center justify-content-center text-white">
                      <div className="text-center px-4">
                        {texts.highlightUnavailable}
                      </div>
                    </div>
                  )}

                  <div className="card-body p-4">
                    <span className="badge text-bg-dark mb-2">
                      {texts.highlightVideo}
                    </span>

                    <h2 className="h4 fw-bold mb-2">{texts.coachHighlights}</h2>

                    <p className="small-muted mb-0">
                      {texts.highlightDescription}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="section pt-0">
          <div className="container">
            <div className="card shadow-soft mb-4">
              <div className="card-body p-4">
                <div className="d-flex flex-column flex-md-row justify-content-between gap-3 align-items-md-end">
                  <div>
                    <h2 className="h4 fw-bold mb-1 title-accent">
                      {texts.statFilters}
                    </h2>

                    <p className="small-muted mb-0">
                      {texts.statFiltersDescription}
                    </p>
                  </div>

                  <div className="d-flex flex-column flex-sm-row gap-3">
                    <div>
                      <label className="form-label small-muted mb-1">
                        {texts.season}
                      </label>

                      <select
                        className="form-select"
                        value={selectedSeason}
                        onChange={(event) => {
                          setSelectedSeason(event.target.value);
                          setSelectedCompetition("all");
                        }}
                      >
                        <option value="all">{texts.all}</option>

                        {seasons.map((season) => (
                          <option key={season} value={season}>
                            {season}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="form-label small-muted mb-1">
                        {texts.competition}
                      </label>

                      <select
                        className="form-select"
                        value={selectedCompetition}
                        onChange={(event) =>
                          setSelectedCompetition(event.target.value)
                        }
                      >
                        <option value="all">{texts.all}</option>

                        {competitions.map((competition) => (
                          <option key={competition} value={competition}>
                            {competition}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {competitionAverages.length > 0 ? (
              <div className="card shadow-soft mb-4">
                <div className="card-body p-4">
                  <h2 className="h4 fw-bold mb-3 title-accent">
                    {texts.competitionAverages}
                  </h2>

                  <div className="table-responsive">
                    <table className="table align-middle mb-0">
                      <thead>
                        <tr>
                          <th>Season</th>
                          <th>Competition</th>
                          <th className="text-end">GP</th>
                          <th className="text-end">PPG</th>
                          <th className="text-end">RPG</th>
                          <th className="text-end">APG</th>
                          <th className="text-end">STL</th>
                          <th className="text-end">BLK</th>
                          <th className="text-end">MIN</th>
                          <th className="text-end">OBD</th>
                        </tr>
                      </thead>

                      <tbody>
                        {competitionAverages.map((item) => (
                          <tr key={`${item.season}-${item.competition}`}>
                            <td>{item.season || "—"}</td>
                            <td>
                              <strong>{item.competition || "—"}</strong>
                            </td>
                            <td className="text-end">
                              {formatStat(item.games_played)}
                            </td>
                            <td className="text-end">{formatStat(item.ppg)}</td>
                            <td className="text-end">{formatStat(item.rpg)}</td>
                            <td className="text-end">{formatStat(item.apg)}</td>
                            <td className="text-end">{formatStat(item.spg)}</td>
                            <td className="text-end">{formatStat(item.bpg)}</td>
                            <td className="text-end">{formatStat(item.mpg)}</td>
                            <td className="text-end">
                              {formatStat(item.performance_index)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="row g-4">
              <div className="col-lg-7">
                <div className="card shadow-soft h-100 overflow-hidden">
                  {hasHighlightVideo ? (
                    <div className="ratio ratio-16x9 bg-dark">
                      <iframe
                        src={player.highlight_video}
                        title={`${player.name} highlights`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <div className="ratio ratio-16x9 bg-dark d-flex align-items-center justify-content-center text-white">
                      <div className="text-center px-4">
                        {texts.highlightUnavailable}
                      </div>
                    </div>
                  )}

                  <div className="card-body p-4">
                    <span className="badge text-bg-dark mb-2">
                      {texts.highlightVideo}
                    </span>

                    <h2 className="h4 fw-bold mb-2">
                      {texts.playerHighlights}
                    </h2>

                    <p className="small-muted mb-0">
                      {texts.highlightDescription}
                    </p>
                  </div>
                </div>
              </div>

              <div className="col-lg-5">
                <div className="card shadow-soft h-100">
                  <div className="card-body p-4">
                    <h2 className="h4 fw-bold mb-3 title-accent">
                      {texts.latestGame}
                    </h2>

                    {latestGame ? (
                      <>
                        <p className="small-muted mb-2">
                          {latestGame.competition} • {latestGame.season} •{" "}
                          {latestGame.round}
                        </p>

                        <h3 className="h5 fw-bold mb-4">
                          vs {latestGame.opponent || "—"}
                        </h3>

                        <div className="row g-3">
                          <StatCard label="PTS" value={latestGame.points} />
                          <StatCard label="REB" value={latestGame.rebounds} />
                          <StatCard label="AST" value={latestGame.assists} />
                          <StatCard label="STL" value={latestGame.steals} />
                          <StatCard label="BLK" value={latestGame.blocks} />
                          <StatCard label="MIN" value={latestGame.minutes} />
                        </div>
                      </>
                    ) : (
                      <p className="text-muted mb-0">{texts.noGames}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="card shadow-soft mt-4">
              <div className="card-body p-4">
                <h2 className="h4 fw-bold mb-3 title-accent">
                  {texts.gameHistory}
                </h2>

                {games.length === 0 ? (
                  <p className="text-muted mb-0">{texts.noGames}</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table align-middle mb-0">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Season</th>
                          <th>Competition</th>
                          <th>Round</th>
                          <th>Opponent</th>
                          <th className="text-end">PTS</th>
                          <th className="text-end">REB</th>
                          <th className="text-end">AST</th>
                          <th className="text-end">STL</th>
                          <th className="text-end">BLK</th>
                          <th className="text-end">MIN</th>
                          <th className="text-end">OBD</th>
                        </tr>
                      </thead>

                      <tbody>
                        {games.map((game) => (
                          <tr key={game.game_number}>
                            <td>{game.game_number}</td>
                            <td>{game.season || "—"}</td>
                            <td>{game.competition || "—"}</td>
                            <td>{game.round || "—"}</td>
                            <td>
                              <strong>{game.opponent || "—"}</strong>
                            </td>
                            <td className="text-end">
                              {formatStat(game.points)}
                            </td>
                            <td className="text-end">
                              {formatStat(game.rebounds)}
                            </td>
                            <td className="text-end">
                              {formatStat(game.assists)}
                            </td>
                            <td className="text-end">
                              {formatStat(game.steals)}
                            </td>
                            <td className="text-end">
                              {formatStat(game.blocks)}
                            </td>
                            <td className="text-end">
                              {formatStat(game.minutes)}
                            </td>
                            <td className="text-end">
                              {formatStat(game.performance_index)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      <Footer />
    </>
  );
}

function PlayerNewsSection({
  news,
  texts,
}: {
  news: PlayerNews[];
  texts: {
    latestUpdates: string;
    readSource: string;
    sourceLabel: string;
  };
}) {
  return (
    <section className="section player-news-section">
      <div className="container">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end gap-3 mb-4">
          <div>
            <span className="badge text-bg-dark mb-2">Orangeball News</span>

            <h2 className="h4 fw-bold mb-1 title-accent">
              {texts.latestUpdates}
            </h2>
          </div>
        </div>

        <div className="row g-4">
          {news.map((item) => (
            <div className="col-md-6 col-xl-4" key={item.news_id || item.title}>
              <PlayerNewsCard item={item} texts={texts} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PlayerNewsCard({
  item,
  texts,
}: {
  item: PlayerNews;
  texts: {
    readSource: string;
    sourceLabel: string;
  };
}) {
  const date = item.published_at || item.created_at;

  return (
    <article className="player-news-card h-100">
      <div className="d-flex flex-wrap gap-2 mb-3">
        {item.category ? (
          <span className="badge text-bg-dark">{item.category}</span>
        ) : null}

        {date ? <span className="badge text-bg-light">{date}</span> : null}
      </div>

      <h3 className="h5 fw-bold mb-2">{item.title || "Update"}</h3>

      <p className="text-muted mb-3">{item.summary || item.content || "—"}</p>

      {item.source_name ? (
        <div className="small-muted mb-3">
          {texts.sourceLabel}: {item.source_name}
        </div>
      ) : null}

      {item.source_url ? (
        <a
          href={item.source_url}
          target="_blank"
          rel="noreferrer"
          className="btn btn-sm btn-outline-dark"
        >
          {texts.readSource}
        </a>
      ) : null}
    </article>
  );
}

function MainStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="col-6 col-md-3">
      <div className="main-stat-card">
        <div className="main-stat-value">{formatStat(value)}</div>
        <div className="main-stat-label">{label}</div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="col-6 col-md-4">
      <div className="card shadow-soft h-100">
        <div className="card-body text-center p-3">
          <div className="display-6 fw-bold">{formatStat(value)}</div>
          <div className="small-muted">{label}</div>
        </div>
      </div>
    </div>
  );
}

function CoachInfoCard({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="col-6 col-md-3">
      <div className="main-stat-card">
        <div className="main-stat-value coach-info-value">{value || "—"}</div>
        <div className="main-stat-label">{label}</div>
      </div>
    </div>
  );
}
