"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

import {
  type CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getGeneratedManifest, type GeneratedManifest } from "@/lib/reports";
import Link from "next/link";
import { useLocale } from "@/app/[locale]/I18nProvider";
import AdminLogoutButton from "@/components/AdminLogoutButton";
import AdminNewsProposals from "@/components/AdminNewsProposals";


type AdminPlayer = {
  slug: string;
  name: string;
  club: string;
  position: string;
  nationality: string;
  league: string;
  photo: string;
  status: string;
  featured: boolean;
};

type AdminPlayersResponse = {
  status: string;
  source: string;
  count: number;
  players: AdminPlayer[];
};

type SourcesSummary = {
  totalFiles: number | null;
  created: number | null;
  skipped: number | null;
  failed: number | null;
};

type SourceHistoryEntry = {
  logged_at?: string;
  action?: string;
  proposal_id?: string | null;
  proposal_status?: string | null;
  player_slug?: string;
  source_id?: string;
  confidence?: number | null;
  duplicate_reason?: string;
  competition?: string;
  season?: string;
  round?: string;
  opponent?: string;
  points?: number;
  rebounds?: number;
  assists?: number;
  steals?: number;
  blocks?: number;
  minutes?: number;
};

type SourceHistoryResponse = {
  status: string;
  count: number;
  entries: SourceHistoryEntry[];
};

type PendingProposalCountsResponse = {
  status: string;
  counts: Record<string, number>;
};

type SourceReadinessSource = {
  source_id: string;
  source_name: string;
  status: string;
  trust_level: string;
  profile_url: string;
  external_player_id: string;
  readiness: string;
};

type SourceReadinessPlayer = {
  player_slug: string;
  player_name: string;
  status: string;
  sources: SourceReadinessSource[];
  error?: string;
};

type SourceReadinessResponse = {
  status: string;
  summary: {
    totalPlayers: number;
    totalSources: number;
    readySources: number;
    notReadySources: number;
  };
  players: SourceReadinessPlayer[];
};

type RawSourceData = {
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

type RawSource = {
  file_name: string;
  source_id?: string;
  player_slug?: string;
  player_name?: string;
  collected_at?: string;
  updated_at?: string;
  status?: string;
  source_url?: string;
  external_player_id?: string;
  confidence?: number | null;
  raw_data?: RawSourceData;
  notes?: string;
  error?: string;
};

type RawSourcesResponse = {
  status: string;
  count: number;
  raw_sources: RawSource[];
};

type RawEditForm = {
  competition: string;
  season: string;
  round: string;
  opponent: string;
  points: string;
  rebounds: string;
  assists: string;
  steals: string;
  blocks: string;
  minutes: string;
  confidence: string;
};

export default function AdminPage() {
  const locale = useLocale();

  const [players, setPlayers] = useState<AdminPlayer[]>([]);
  const [manifest, setManifest] = useState<GeneratedManifest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [processingSources, setProcessingSources] = useState(false);
  const [sourcesResult, setSourcesResult] = useState<string | null>(null);
  const [sourcesSummary, setSourcesSummary] = useState<SourcesSummary | null>(
    null,
  );

  const [sourceHistory, setSourceHistory] = useState<SourceHistoryEntry[]>([]);
  const [loadingSourceHistory, setLoadingSourceHistory] = useState(false);

  const [pendingProposalCounts, setPendingProposalCounts] = useState<
    Record<string, number>
  >({});

  const [sourceReadiness, setSourceReadiness] =
    useState<SourceReadinessResponse | null>(null);
  const [loadingSourceReadiness, setLoadingSourceReadiness] = useState(false);

  const [rawSources, setRawSources] = useState<RawSource[]>([]);
  const [loadingRawSources, setLoadingRawSources] = useState(false);

  const [creatingRawDraftKey, setCreatingRawDraftKey] = useState<string | null>(
    null,
  );
  const [rawDraftMessage, setRawDraftMessage] = useState<string | null>(null);

  const [editingRawFileName, setEditingRawFileName] = useState<string | null>(
    null,
  );
  const [savingRawFileName, setSavingRawFileName] = useState<string | null>(
    null,
  );
  const [rawEditMessage, setRawEditMessage] = useState<string | null>(null);
  const [rawEditForm, setRawEditForm] = useState<RawEditForm>({
    competition: "",
    season: "",
    round: "",
    opponent: "",
    points: "0",
    rebounds: "0",
    assists: "0",
    steals: "0",
    blocks: "0",
    minutes: "0",
    confidence: "0.9",
  });

  const compactButtonStyle: CSSProperties = {
    fontSize: "0.78rem",
    padding: "0.25rem 0.55rem",
    lineHeight: 1.15,
  };

  const loadSourceHistory = useCallback(async () => {
    setLoadingSourceHistory(true);

    try {
      const response = await fetch("/api/admin/sources/history");
      const data: SourceHistoryResponse = await response.json();

      if (!response.ok) {
        throw new Error("Failed to load source history");
      }

      setSourceHistory(data.entries || []);
    } catch {
      setSourceHistory([]);
    } finally {
      setLoadingSourceHistory(false);
    }
  }, []);

  const loadPendingProposalCounts = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/proposals/counts");
      const data: PendingProposalCountsResponse = await response.json();

      if (!response.ok) {
        throw new Error("Failed to load pending proposal counts");
      }

      setPendingProposalCounts(data.counts || {});
    } catch {
      setPendingProposalCounts({});
    }
  }, []);

  const loadSourceReadiness = useCallback(async () => {
    setLoadingSourceReadiness(true);

    try {
      const response = await fetch("/api/admin/sources/readiness");
      const data: SourceReadinessResponse = await response.json();

      if (!response.ok) {
        throw new Error("Failed to load source readiness");
      }

      setSourceReadiness(data);
    } catch {
      setSourceReadiness(null);
    } finally {
      setLoadingSourceReadiness(false);
    }
  }, []);

  const loadRawSources = useCallback(async () => {
    setLoadingRawSources(true);

    try {
      const response = await fetch("/api/admin/sources/raw");
      const data: RawSourcesResponse = await response.json();

      if (!response.ok) {
        throw new Error("Failed to load raw sources");
      }

      setRawSources(data.raw_sources || []);
    } catch {
      setRawSources([]);
    } finally {
      setLoadingRawSources(false);
    }
  }, []);

  const createRawDraft = useCallback(
    async (playerSlug: string, sourceId: string) => {
      const key = `${playerSlug}-${sourceId}`;

      setCreatingRawDraftKey(key);
      setRawDraftMessage(null);

      try {
        const response = await fetch("/api/admin/sources/raw", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            player_slug: playerSlug,
            source_id: sourceId,
            status: "draft",
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.message || "Failed to create raw draft");
        }

        setRawDraftMessage(
          `Raw draft criado para ${playerSlug} / ${sourceId}.`,
        );

        await loadRawSources();
      } catch (error) {
        setRawDraftMessage(
          error instanceof Error
            ? `Erro: ${error.message}`
            : "Erro ao criar raw draft.",
        );
      } finally {
        setCreatingRawDraftKey(null);
      }
    },
    [loadRawSources],
  );

  function startEditingRawSource(rawSource: RawSource) {
    setEditingRawFileName(rawSource.file_name);
    setRawEditMessage(null);

    setRawEditForm({
      competition: rawSource.raw_data?.competition || "",
      season: rawSource.raw_data?.season || "",
      round: rawSource.raw_data?.round || "",
      opponent: rawSource.raw_data?.opponent || "",
      points: String(rawSource.raw_data?.points ?? 0),
      rebounds: String(rawSource.raw_data?.rebounds ?? 0),
      assists: String(rawSource.raw_data?.assists ?? 0),
      steals: String(rawSource.raw_data?.steals ?? 0),
      blocks: String(rawSource.raw_data?.blocks ?? 0),
      minutes: String(rawSource.raw_data?.minutes ?? 0),
      confidence: String(rawSource.confidence ?? 0.9),
    });
  }

  function updateRawEditForm(field: keyof RawEditForm, value: string) {
    setRawEditForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function saveRawSource(
    fileName: string,
    status: "draft" | "raw_ready",
  ) {
    setSavingRawFileName(fileName);
    setRawEditMessage(null);

    try {
      const response = await fetch("/api/admin/sources/raw", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          file_name: fileName,
          status,
          confidence: Number(rawEditForm.confidence),
          raw_data: {
            competition: rawEditForm.competition,
            season: rawEditForm.season,
            round: rawEditForm.round,
            opponent: rawEditForm.opponent,
            points: Number(rawEditForm.points),
            rebounds: Number(rawEditForm.rebounds),
            assists: Number(rawEditForm.assists),
            steals: Number(rawEditForm.steals),
            blocks: Number(rawEditForm.blocks),
            minutes: Number(rawEditForm.minutes),
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Failed to save raw");
      }

      setRawEditMessage(
        status === "raw_ready"
          ? "Raw guardado como ready. Já pode virar proposta."
          : "Raw guardado como draft.",
      );

      setEditingRawFileName(null);
      await loadRawSources();
    } catch (error) {
      setRawEditMessage(
        error instanceof Error
          ? `Erro: ${error.message}`
          : "Erro ao guardar raw.",
      );
    } finally {
      setSavingRawFileName(null);
    }
  }

  useEffect(() => {
    async function loadAdminData() {
      try {
        const [playersResponse, manifestData] = await Promise.all([
          fetch("/api/admin/players"),
          getGeneratedManifest(),
        ]);

        if (!playersResponse.ok) {
          throw new Error("Failed to load admin players");
        }

        const playersData: AdminPlayersResponse = await playersResponse.json();

        setPlayers(playersData.players || []);
        setManifest(manifestData);
        setError(false);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    loadAdminData();
    loadSourceHistory();
    loadPendingProposalCounts();
    loadSourceReadiness();
    loadRawSources();
  }, [
    loadSourceHistory,
    loadPendingProposalCounts,
    loadSourceReadiness,
    loadRawSources,
  ]);

  const activePlayers = useMemo(() => {
    return players.filter((player) => player.status !== "archived");
  }, [players]);

  const archivedPlayers = useMemo(() => {
    return players.filter((player) => player.status === "archived");
  }, [players]);

  async function processExternalSources() {
    setProcessingSources(true);
    setSourcesResult(null);
    setSourcesSummary(null);

    try {
      const response = await fetch("/api/admin/sources/process", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to process external sources");
      }

      setSourcesSummary(data.summary || null);
      setSourcesResult(data.stdout || data.message || "Fontes processadas.");

      await loadSourceHistory();
      await loadPendingProposalCounts();
      await loadSourceReadiness();
      await loadRawSources();
    } catch (error) {
      setSourcesResult(
        error instanceof Error
          ? `Erro: ${error.message}`
          : "Erro ao processar fontes externas.",
      );
    } finally {
      setProcessingSources(false);
    }
  }

  return (
    <>
      <Navbar />

      <main className="container py-5">
        <div className="mb-4">
          <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
            <div>
              <span className="badge text-bg-dark mb-3">Admin Panel</span>

              <h1 className="fw-bold mb-2">Orangeball Dreams Admin</h1>

              <p className="text-muted mb-0">
                Painel interno para acompanhar atletas, reports e estado da
                Automation Layer.
              </p>
            </div>

            <AdminLogoutButton />
          </div>

          <Link href={`/${locale}/admin/new-player`} className="btn btn-dark">
            Criar atleta
          </Link>
        </div>
        
        <AdminNewsProposals />

        <div className="card shadow-soft mb-4">
          <div className="card-body p-4">
            <div className="d-flex flex-column flex-md-row justify-content-between gap-3 align-items-md-center">
              <div>
                <h2 className="h4 fw-bold mb-1">Fontes externas</h2>
                <p className="text-muted mb-0">
                  Processa os ficheiros em raw/, cria propostas novas e ignora
                  duplicados.
                </p>
              </div>

              <button
                className="btn btn-dark"
                onClick={processExternalSources}
                disabled={processingSources}
              >
                {processingSources
                  ? "A processar fontes..."
                  : "Processar fontes externas"}
              </button>
            </div>

            {sourcesSummary ? (
              <div className="row g-3 mt-3">
                <div className="col-6 col-md-3">
                  <div className="border rounded p-3 h-100">
                    <div className="small-muted mb-1">Ficheiros</div>
                    <div className="h4 fw-bold mb-0">
                      {sourcesSummary.totalFiles ?? "—"}
                    </div>
                  </div>
                </div>

                <div className="col-6 col-md-3">
                  <div className="border rounded p-3 h-100">
                    <div className="small-muted mb-1">Criadas</div>
                    <div className="h4 fw-bold mb-0">
                      {sourcesSummary.created ?? "—"}
                    </div>
                  </div>
                </div>

                <div className="col-6 col-md-3">
                  <div className="border rounded p-3 h-100">
                    <div className="small-muted mb-1">Duplicados</div>
                    <div className="h4 fw-bold mb-0">
                      {sourcesSummary.skipped ?? "—"}
                    </div>
                  </div>
                </div>

                <div className="col-6 col-md-3">
                  <div className="border rounded p-3 h-100">
                    <div className="small-muted mb-1">Erros</div>
                    <div className="h4 fw-bold mb-0">
                      {sourcesSummary.failed ?? "—"}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {sourcesResult ? (
              <details className="mt-3">
                <summary
                  className="small text-muted"
                  style={{ cursor: "pointer" }}
                >
                  Ver output técnico
                </summary>

                <pre className="bg-light border rounded p-3 mt-3 mb-0 small">
                  {sourcesResult}
                </pre>
              </details>
            ) : null}

            <div className="border-top mt-4 pt-4">
              <div className="d-flex flex-column flex-md-row justify-content-between gap-2 align-items-md-center mb-3">
                <div>
                  <h3 className="h6 fw-bold mb-1">Histórico recente</h3>
                  <p className="small-muted mb-0">
                    Últimas ações registadas pelas fontes externas.
                  </p>
                </div>

                <button
                  className="btn btn-sm btn-outline-dark"
                  onClick={loadSourceHistory}
                  disabled={loadingSourceHistory}
                >
                  {loadingSourceHistory
                    ? "A atualizar..."
                    : "Atualizar histórico"}
                </button>
              </div>

              {sourceHistory.length > 0 ? (
                <div className="d-flex flex-column gap-2">
                  {sourceHistory.slice(0, 8).map((entry, index) => {
                    const isDuplicate = entry.action === "skipped_duplicate";

                    return (
                      <div
                        key={`${entry.logged_at}-${entry.proposal_id}-${index}`}
                        className="border rounded p-3"
                      >
                        <div className="d-flex flex-column flex-md-row justify-content-between gap-2">
                          <div>
                            <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                              <span
                                className={`badge ${
                                  isDuplicate
                                    ? "text-bg-warning"
                                    : "text-bg-success"
                                }`}
                              >
                                {isDuplicate
                                  ? "Duplicado ignorado"
                                  : "Proposta criada"}
                              </span>

                              <span className="small-muted">
                                {entry.source_id || "fonte desconhecida"}
                              </span>
                            </div>

                            <div className="fw-semibold">
                              {entry.player_slug || "atleta"} vs{" "}
                              {entry.opponent || "adversário"}
                            </div>

                            <div className="small-muted">
                              {entry.competition || "Competição"} •{" "}
                              {entry.season || "Época"} •{" "}
                              {entry.round || "Jornada"}
                            </div>

                            {entry.duplicate_reason ? (
                              <div className="small text-muted mt-1">
                                {entry.duplicate_reason}
                              </div>
                            ) : null}
                          </div>

                          <div className="text-md-end small-muted">
                            <div>
                              {entry.points ?? 0} PTS • {entry.rebounds ?? 0}{" "}
                              REB • {entry.assists ?? 0} AST
                            </div>

                            <div>
                              Confiança:{" "}
                              {entry.confidence !== null &&
                              entry.confidence !== undefined
                                ? entry.confidence
                                : "—"}
                            </div>

                            <div>
                              {entry.logged_at
                                ? new Date(entry.logged_at).toLocaleString(
                                    "pt-PT",
                                  )
                                : ""}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="alert alert-light mb-0">
                  Ainda não existe histórico de fontes externas.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="card shadow-soft mb-4">
          <div className="card-body p-4">
            <div className="d-flex flex-column flex-md-row justify-content-between gap-3 align-items-md-start mb-3">
              <div>
                <h2 className="h4 fw-bold mb-1">Source Readiness</h2>
                <p className="text-muted mb-0">
                  Estado das fontes externas antes da recolha real de dados.
                </p>
              </div>

              <div className="d-flex flex-column align-items-md-end gap-2">
                <button
                  className="btn btn-outline-dark"
                  style={compactButtonStyle}
                  onClick={loadSourceReadiness}
                  disabled={loadingSourceReadiness}
                >
                  {loadingSourceReadiness
                    ? "A atualizar..."
                    : "Atualizar readiness"}
                </button>

                {rawDraftMessage ? (
                  <div className="alert alert-light border py-2 px-3 small mb-0">
                    {rawDraftMessage}
                  </div>
                ) : null}
              </div>
            </div>

            {sourceReadiness ? (
              <>
                <div className="row g-3 mb-4">
                  <div className="col-6 col-md-3">
                    <div className="border rounded p-3 h-100">
                      <div className="small-muted mb-1">Atletas</div>
                      <div className="h4 fw-bold mb-0">
                        {sourceReadiness.summary.totalPlayers}
                      </div>
                    </div>
                  </div>

                  <div className="col-6 col-md-3">
                    <div className="border rounded p-3 h-100">
                      <div className="small-muted mb-1">Fontes</div>
                      <div className="h4 fw-bold mb-0">
                        {sourceReadiness.summary.totalSources}
                      </div>
                    </div>
                  </div>

                  <div className="col-6 col-md-3">
                    <div className="border rounded p-3 h-100">
                      <div className="small-muted mb-1">Ready</div>
                      <div className="h4 fw-bold mb-0">
                        {sourceReadiness.summary.readySources}
                      </div>
                    </div>
                  </div>

                  <div className="col-6 col-md-3">
                    <div className="border rounded p-3 h-100">
                      <div className="small-muted mb-1">Not ready</div>
                      <div className="h4 fw-bold mb-0">
                        {sourceReadiness.summary.notReadySources}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="d-flex flex-column gap-2">
                  {sourceReadiness.players.map((player) =>
                    player.sources.map((source) => {
                      const isReady = source.readiness === "ready";

                      return (
                        <div
                          key={`${player.player_slug}-${source.source_id}`}
                          className="border rounded p-3"
                        >
                          <div className="d-flex flex-column flex-md-row justify-content-between gap-2">
                            <div>
                              <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                                <div className="fw-bold">
                                  {player.player_name}
                                </div>

                                <span className="badge text-bg-dark">
                                  {source.source_id}
                                </span>

                                <span
                                  className={`badge ${
                                    isReady
                                      ? "text-bg-success"
                                      : "text-bg-warning"
                                  }`}
                                >
                                  {isReady ? "ready" : "not ready"}
                                </span>
                              </div>

                              <div className="small-muted">
                                Status: {source.status} • Readiness:{" "}
                                {source.readiness}
                              </div>

                              <div className="small-muted">
                                URL: {source.profile_url || "missing"}
                              </div>

                              <div className="small-muted">
                                External ID:{" "}
                                {source.external_player_id || "missing"}
                              </div>
                            </div>

                            <div className="text-md-end d-flex flex-wrap gap-2 justify-content-md-end align-items-start">
                              <Link
                                className="btn btn-outline-dark"
                                style={compactButtonStyle}
                                href={`/${locale}/admin/players/${player.player_slug}`}
                              >
                                Editar fontes
                              </Link>

                              {isReady ? (
                                <button
                                  className="btn btn-dark"
                                  style={compactButtonStyle}
                                  onClick={() =>
                                    createRawDraft(
                                      player.player_slug,
                                      source.source_id,
                                    )
                                  }
                                  disabled={
                                    creatingRawDraftKey ===
                                    `${player.player_slug}-${source.source_id}`
                                  }
                                >
                                  {creatingRawDraftKey ===
                                  `${player.player_slug}-${source.source_id}`
                                    ? "A criar..."
                                    : "Criar raw draft"}
                                </button>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      );
                    }),
                  )}
                </div>
              </>
            ) : (
              <div className="alert alert-light mb-0">
                Ainda não foi carregado o estado das fontes.
              </div>
            )}
          </div>
        </div>

        <div className="card shadow-soft mb-4">
          <div className="card-body p-4">
            <div className="d-flex flex-column flex-md-row justify-content-between gap-3 align-items-md-center mb-3">
              <div>
                <h2 className="h4 fw-bold mb-1">Raw Sources</h2>
                <p className="text-muted mb-0">
                  Ficheiros raw criados a partir das fontes externas antes de
                  virarem propostas.
                </p>
              </div>

              <button
                className="btn btn-sm btn-outline-dark"
                onClick={loadRawSources}
                disabled={loadingRawSources}
              >
                {loadingRawSources ? "A atualizar..." : "Atualizar raw sources"}
              </button>
            </div>

            {rawEditMessage ? (
              <div className="alert alert-light border py-2 px-3 small mt-3 mb-3">
                {rawEditMessage}
              </div>
            ) : null}

            {rawSources.length > 0 ? (
              <div className="d-flex flex-column gap-2">
                {rawSources.map((rawSource) => {
                  const isReady = rawSource.status === "raw_ready";
                  const isPlaceholder = rawSource.status === "raw_placeholder";
                  const isDraft = rawSource.status === "draft";

                  return (
                    <div
                      key={rawSource.file_name}
                      className="border rounded p-3"
                    >
                      <div className="d-flex flex-column flex-md-row justify-content-between gap-2">
                        <div>
                          <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                            <div className="fw-bold">
                              {rawSource.player_name || rawSource.player_slug}
                            </div>

                            <span className="badge text-bg-dark">
                              {rawSource.source_id || "source"}
                            </span>

                            <span
                              className={`badge ${
                                isReady
                                  ? "text-bg-success"
                                  : isPlaceholder || isDraft
                                    ? "text-bg-warning"
                                    : "text-bg-secondary"
                              }`}
                            >
                              {rawSource.status || "unknown"}
                            </span>
                          </div>

                          <div className="small-muted mb-1">
                            {rawSource.file_name}
                          </div>

                          <div className="small-muted">
                            {rawSource.raw_data?.competition ||
                              "Competição em falta"}{" "}
                            • {rawSource.raw_data?.season || "Época em falta"} •{" "}
                            {rawSource.raw_data?.round || "Jornada em falta"}
                          </div>

                          <div className="small-muted">
                            Opponent:{" "}
                            {rawSource.raw_data?.opponent || "missing"}
                          </div>

                          <div className="small-muted">
                            {rawSource.raw_data?.points ?? 0} PTS •{" "}
                            {rawSource.raw_data?.rebounds ?? 0} REB •{" "}
                            {rawSource.raw_data?.assists ?? 0} AST •{" "}
                            {rawSource.raw_data?.minutes ?? 0} MIN
                          </div>
                        </div>

                        <div className="text-md-end d-flex flex-column gap-2 align-items-md-end">
                          <div className="small-muted">
                            <div>
                              Confidence:{" "}
                              {rawSource.confidence !== null &&
                              rawSource.confidence !== undefined
                                ? rawSource.confidence
                                : "—"}
                            </div>

                            <div>
                              Updated:{" "}
                              {rawSource.updated_at
                                ? new Date(rawSource.updated_at).toLocaleString(
                                    "pt-PT",
                                  )
                                : "—"}
                            </div>
                          </div>

                          <div className="d-flex flex-column gap-2 align-items-md-end">
                            <button
                              className="btn btn-outline-dark"
                              style={compactButtonStyle}
                              onClick={() => startEditingRawSource(rawSource)}
                            >
                              Editar raw
                            </button>

                            {isReady ? (
                              <button
                                className="btn btn-dark"
                                style={compactButtonStyle}
                                onClick={processExternalSources}
                                disabled={processingSources}
                              >
                                {processingSources
                                  ? "A processar..."
                                  : "Criar proposta"}
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      {editingRawFileName === rawSource.file_name ? (
                        <div className="border-top mt-3 pt-3">
                          <div className="row g-2">
                            <div className="col-md-3">
                              <label className="form-label small-muted">
                                Competition
                              </label>
                              <input
                                className="form-control form-control-sm"
                                value={rawEditForm.competition}
                                onChange={(event) =>
                                  updateRawEditForm(
                                    "competition",
                                    event.target.value,
                                  )
                                }
                              />
                            </div>

                            <div className="col-md-3">
                              <label className="form-label small-muted">
                                Season
                              </label>
                              <input
                                className="form-control form-control-sm"
                                value={rawEditForm.season}
                                onChange={(event) =>
                                  updateRawEditForm(
                                    "season",
                                    event.target.value,
                                  )
                                }
                              />
                            </div>

                            <div className="col-md-3">
                              <label className="form-label small-muted">
                                Round
                              </label>
                              <input
                                className="form-control form-control-sm"
                                value={rawEditForm.round}
                                onChange={(event) =>
                                  updateRawEditForm("round", event.target.value)
                                }
                              />
                            </div>

                            <div className="col-md-3">
                              <label className="form-label small-muted">
                                Opponent
                              </label>
                              <input
                                className="form-control form-control-sm"
                                value={rawEditForm.opponent}
                                onChange={(event) =>
                                  updateRawEditForm(
                                    "opponent",
                                    event.target.value,
                                  )
                                }
                              />
                            </div>

                            <div className="col-6 col-md-2">
                              <label className="form-label small-muted">
                                PTS
                              </label>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                value={rawEditForm.points}
                                onChange={(event) =>
                                  updateRawEditForm(
                                    "points",
                                    event.target.value,
                                  )
                                }
                              />
                            </div>

                            <div className="col-6 col-md-2">
                              <label className="form-label small-muted">
                                REB
                              </label>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                value={rawEditForm.rebounds}
                                onChange={(event) =>
                                  updateRawEditForm(
                                    "rebounds",
                                    event.target.value,
                                  )
                                }
                              />
                            </div>

                            <div className="col-6 col-md-2">
                              <label className="form-label small-muted">
                                AST
                              </label>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                value={rawEditForm.assists}
                                onChange={(event) =>
                                  updateRawEditForm(
                                    "assists",
                                    event.target.value,
                                  )
                                }
                              />
                            </div>

                            <div className="col-6 col-md-2">
                              <label className="form-label small-muted">
                                STL
                              </label>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                value={rawEditForm.steals}
                                onChange={(event) =>
                                  updateRawEditForm(
                                    "steals",
                                    event.target.value,
                                  )
                                }
                              />
                            </div>

                            <div className="col-6 col-md-2">
                              <label className="form-label small-muted">
                                BLK
                              </label>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                value={rawEditForm.blocks}
                                onChange={(event) =>
                                  updateRawEditForm(
                                    "blocks",
                                    event.target.value,
                                  )
                                }
                              />
                            </div>

                            <div className="col-6 col-md-2">
                              <label className="form-label small-muted">
                                MIN
                              </label>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                value={rawEditForm.minutes}
                                onChange={(event) =>
                                  updateRawEditForm(
                                    "minutes",
                                    event.target.value,
                                  )
                                }
                              />
                            </div>

                            <div className="col-6 col-md-2">
                              <label className="form-label small-muted">
                                Confidence
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                className="form-control form-control-sm"
                                value={rawEditForm.confidence}
                                onChange={(event) =>
                                  updateRawEditForm(
                                    "confidence",
                                    event.target.value,
                                  )
                                }
                              />
                            </div>
                          </div>

                          <div className="d-flex flex-wrap gap-2 mt-3">
                            <button
                              className="btn btn-outline-dark"
                              style={compactButtonStyle}
                              onClick={() =>
                                saveRawSource(rawSource.file_name, "draft")
                              }
                              disabled={
                                savingRawFileName === rawSource.file_name
                              }
                            >
                              Guardar draft
                            </button>

                            <button
                              className="btn btn-dark"
                              style={compactButtonStyle}
                              onClick={() =>
                                saveRawSource(rawSource.file_name, "raw_ready")
                              }
                              disabled={
                                savingRawFileName === rawSource.file_name
                              }
                            >
                              Guardar como ready
                            </button>

                            <button
                              className="btn btn-outline-secondary"
                              style={compactButtonStyle}
                              onClick={() => setEditingRawFileName(null)}
                              disabled={
                                savingRawFileName === rawSource.file_name
                              }
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="alert alert-light mb-0">
                Ainda não existem raw sources.
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-muted">A carregar dados do admin...</div>
        ) : null}

        {error ? (
          <div className="alert alert-warning">
            Não foi possível carregar os dados do Admin.
          </div>
        ) : null}

        {!loading && !error ? (
          <>
            <div className="row g-4 mb-5">
              <AdminCard title="Total atletas" value={players.length} />
              <AdminCard title="Ativos" value={activePlayers.length} />
              <AdminCard title="Arquivados" value={archivedPlayers.length} />
              <AdminCard title="Status" value={manifest?.status ?? "unknown"} />
            </div>

            <div className="card shadow-soft">
              <div className="card-body p-4">
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
                  <div>
                    <h2 className="h5 fw-bold mb-1">Todos os atletas</h2>
                    <p className="small-muted mb-0">
                      Lista lida diretamente do AI Engine. Inclui atletas ativos
                      e arquivados.
                    </p>
                  </div>

                  <span className="badge text-bg-light">
                    Fonte: ai-engine/data/players
                  </span>
                </div>

                <div className="d-flex flex-column gap-3">
                  {players.map((player) => {
                    const isArchived = player.status === "archived";
                    const pendingCount =
                      pendingProposalCounts[player.slug] || 0;

                    return (
                      <div
                        key={player.slug}
                        className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 border-bottom pb-3"
                      >
                        <div>
                          <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                            <div className="fw-bold">{player.name}</div>

                            <span
                              className={`badge ${
                                isArchived
                                  ? "text-bg-secondary"
                                  : "text-bg-success"
                              }`}
                            >
                              {isArchived ? "archived" : "active"}
                            </span>

                            {pendingCount > 0 ? (
                              <span className="badge text-bg-warning">
                                {pendingCount} proposta
                                {pendingCount === 1 ? "" : "s"} pendente
                                {pendingCount === 1 ? "" : "s"}
                              </span>
                            ) : null}
                          </div>

                          <div className="small-muted">
                            {player.club || "Sem clube"} •{" "}
                            {player.position || "Sem posição"}
                          </div>
                        </div>

                        <div className="d-flex flex-wrap gap-2">
                          {!isArchived ? (
                            <Link
                              className="btn btn-sm btn-outline-dark"
                              href={`/${locale}/athletes/${player.slug}`}
                            >
                              Ver perfil
                            </Link>
                          ) : null}

                          {pendingCount > 0 ? (
                            <Link
                              className="btn btn-sm btn-warning"
                              href={`/${locale}/admin/players/${player.slug}#proposals`}
                            >
                              Rever propostas
                            </Link>
                          ) : null}

                          <Link
                            className="btn btn-sm btn-dark"
                            href={`/${locale}/admin/players/${player.slug}`}
                          >
                            Editar
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {players.length === 0 ? (
                  <div className="alert alert-light mb-0">
                    Ainda não existem atletas no AI Engine.
                  </div>
                ) : null}
              </div>
            </div>
          </>
        ) : null}
      </main>

      <Footer />
    </>
  );
}

function AdminCard({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <div className="col-md-3">
      <div className="card shadow-soft h-100">
        <div className="card-body p-4">
          <div className="small-muted mb-2">{title}</div>
          <div className="display-6 fw-bold">{value}</div>
        </div>
      </div>
    </div>
  );
}
