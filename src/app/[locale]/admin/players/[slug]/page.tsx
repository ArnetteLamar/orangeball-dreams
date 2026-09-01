"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useLocale } from "@/app/[locale]/I18nProvider";
import { formatStat, getPlayerBySlug, type PlayerProfile } from "@/lib/players";
import PlayerImage from "@/components/PlayerImage";

type PlayerGame = {
  id: number;
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

type PlayerAiReport = {
  generated_at: string;
  summary: string;
  latest_game_summary: string;
  strengths: string[];
  improvement_points: string[];
  classification?: {
    label: string;
    reason: string;
  };
  recommendation: string;
};

type PlayerProposal = {
  proposal_id: string;
  type: string;
  source: string;
  source_url?: string;
  confidence: number;
  status: string;
  created_at: string;
  notes: string;
  proposed_data: {
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

    category?: string;
    title?: string;
    summary?: string;
    content?: string;
    published_at?: string;
    source_name?: string;

    profile_type?: string;
    name?: string;
    club?: string;
    position?: string;
    nationality?: string;
    gender?: string;
    league?: string;
    height_cm?: number;
    photo?: string;
    highlight_video?: string;
    instagram?: string;
    youtube?: string;
    bio?: string;
    agent_notes?: string;
    status?: string;
    tags?: string[];
  };
};

type ProposalEditForm = {
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
  notes: string;
};

type PlayerSource = {
  source_id: string;
  source_name: string;
  status: string;
  trust_level: string;
  profile_url: string;
  external_player_id: string;
  last_checked_at: string | null;
  notes: string;
};

type PlayerSourceProfile = {
  schema_version: string;
  player_slug: string;
  player_name: string;
  status: string;
  sources: PlayerSource[];
};

type PlayerSourcesResponse = {
  status: string;
  slug: string;
  sourceProfile: PlayerSourceProfile | null;
};
type SourceEditForm = {
  source_name: string;
  status: string;
  trust_level: string;
  profile_url: string;
  external_player_id: string;
  notes: string;
};
type AdminPlayerProfile = PlayerProfile & {
  profile_type?: string;
  gender?: string;
  height_cm?: number | null;
  bio?: string;
  instagram?: string;
  youtube?: string;
  agent_notes?: string;
};

const emptyGameForm = {
  competition: "Liga Betclic",
  season: "2026/27",
  round: "",
  opponent: "",
  points: "",
  rebounds: "",
  assists: "",
  steals: "",
  blocks: "",
  minutes: "",
};

export default function AdminPlayerPage() {
  const params = useParams();
  const locale = useLocale();

  const rawSlug = params?.slug;
  const slug = Array.isArray(rawSlug)
    ? rawSlug[0]
    : (rawSlug as string | undefined);

  const [player, setPlayer] = useState<AdminPlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [editingSourceId, setEditingSourceId] = useState<string | null>(null);
  const [savingSourceId, setSavingSourceId] = useState<string | null>(null);

  const [sourceEditForm, setSourceEditForm] = useState<SourceEditForm>({
    source_name: "",
    status: "planned",
    trust_level: "high",
    profile_url: "",
    external_player_id: "",
    notes: "",
  });

  const [sourceProfile, setSourceProfile] =
    useState<PlayerSourceProfile | null>(null);
  const [loadingSourceProfile, setLoadingSourceProfile] = useState(false);

  const [form, setForm] = useState({
    profile_type: "player",
    name: "",
    club: "",
    position: "",
    nationality: "",
    gender: "",
    league: "",
    height_cm: "",
    photo: "",
    highlight_video: "",
    instagram: "",
    youtube: "",
    bio: "",
    agent_notes: "",
    status: "active",
  });

  const [games, setGames] = useState<PlayerGame[]>([]);
  const [gameForm, setGameForm] = useState(emptyGameForm);
  const [savingGame, setSavingGame] = useState(false);
  const [deletingGameId, setDeletingGameId] = useState<number | null>(null);

  const [editingGameId, setEditingGameId] = useState<number | null>(null);
  const [editingGameForm, setEditingGameForm] = useState(emptyGameForm);
  const [updatingGameId, setUpdatingGameId] = useState<number | null>(null);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const [generatingAiReport, setGeneratingAiReport] = useState(false);
  const [aiReportGenerated, setAiReportGenerated] = useState(false);

  const [aiReport, setAiReport] = useState<PlayerAiReport | null>(null);
  const [loadingAiReport, setLoadingAiReport] = useState(false);

  const [proposals, setProposals] = useState<PlayerProposal[]>([]);
  const [loadingProposals, setLoadingProposals] = useState(false);
  const [reviewingProposalId, setReviewingProposalId] = useState<string | null>(
    null,
  );
  const [editingProposalId, setEditingProposalId] = useState<string | null>(
    null,
  );
  const [updatingProposalId, setUpdatingProposalId] = useState<string | null>(
    null,
  );

  const [proposalEditForm, setProposalEditForm] = useState<ProposalEditForm>({
    competition: "",
    season: "",
    round: "",
    opponent: "",
    points: "",
    rebounds: "",
    assists: "",
    steals: "",
    blocks: "",
    minutes: "",
    notes: "",
  });

  const [creatingTestProposal, setCreatingTestProposal] = useState(false);
  const [agentOutputText, setAgentOutputText] = useState("");
  const [processingAgentOutput, setProcessingAgentOutput] = useState(false);

  const loadSourceProfile = useCallback(async () => {
    if (!slug) return;

    setLoadingSourceProfile(true);

    try {
      const response = await fetch(`/api/admin/players/${slug}/sources`);
      const data: PlayerSourcesResponse = await response.json();

      if (!response.ok) {
        throw new Error("Failed to load source profile");
      }

      setSourceProfile(data.sourceProfile || null);
    } catch {
      setSourceProfile(null);
    } finally {
      setLoadingSourceProfile(false);
    }
  }, [slug]);

  const loadAiReport = useCallback(async () => {
    if (!slug) return;

    setLoadingAiReport(true);

    try {
      const response = await fetch(`/api/admin/players/${slug}/ai-report`);

      if (!response.ok) {
        setAiReport(null);
        return;
      }

      const data = await response.json();

      setAiReport(data.report || null);
    } catch {
      setAiReport(null);
    } finally {
      setLoadingAiReport(false);
    }
  }, [slug]);

  const loadProposals = useCallback(async () => {
    if (!slug) return;

    setLoadingProposals(true);

    try {
      const response = await fetch(`/api/admin/players/${slug}/proposals`);

      if (!response.ok) {
        setProposals([]);
        return;
      }

      const data = await response.json();

      setProposals(data.proposals || []);
    } catch {
      setProposals([]);
    } finally {
      setLoadingProposals(false);
    }
  }, [slug]);

  useEffect(() => {
    if (!slug) return;

    setLoading(true);
    setNotFound(false);

    getPlayerBySlug(slug)
      .then((data) => {
        if (!data) {
          setNotFound(true);
          return;
        }

        const adminData = data as AdminPlayerProfile;

        setPlayer(adminData);
        setForm({
          profile_type: adminData.profile_type || "player",
          name: adminData.name || "",
          club: adminData.club || "",
          position: adminData.position || "",
          nationality: adminData.nationality || "",
          gender: adminData.gender || "",
          league: adminData.league || "",
          height_cm:
            adminData.height_cm !== null && adminData.height_cm !== undefined
              ? String(adminData.height_cm)
              : "",
          photo: adminData.photo || "",
          highlight_video: adminData.highlight_video || "",
          instagram: adminData.instagram || "",
          youtube: adminData.youtube || "",
          bio: adminData.bio || "",
          agent_notes: adminData.agent_notes || "",
          status: adminData.status || "active",
        });
      })
      .catch(() => {
        setNotFound(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [slug]);

  useEffect(() => {
    if (!slug) return;

    fetch(`/api/admin/players/${slug}/stats`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load stats");
        }

        return response.json();
      })
      .then((data) => {
        setGames(data.games || []);
      })
      .catch(() => {
        setGames([]);
      });
  }, [slug]);

  useEffect(() => {
    void loadAiReport();
  }, [loadAiReport]);

  useEffect(() => {
    void loadProposals();
  }, [loadProposals]);

  useEffect(() => {
    void loadSourceProfile();
  }, [loadSourceProfile]);

  const hasHighlightVideo = useMemo(() => {
    if (!form.highlight_video) return false;
    return !form.highlight_video.includes("VIDEO_ID");
  }, [form.highlight_video]);

  function normalizeYouTubeUrl(value: string) {
    const trimmed = value.trim();

    if (!trimmed) return "";

    if (trimmed.includes("youtube.com/embed/")) {
      return trimmed;
    }

    try {
      const url = new URL(trimmed);

      if (url.hostname.includes("youtube.com")) {
        const videoId = url.searchParams.get("v");

        if (videoId) {
          return `https://www.youtube.com/embed/${videoId}`;
        }
      }

      if (url.hostname.includes("youtu.be")) {
        const videoId = url.pathname.replace("/", "").split("?")[0];

        if (videoId) {
          return `https://www.youtube.com/embed/${videoId}`;
        }
      }
    } catch {
      return trimmed;
    }

    return trimmed;
  }

  function updateForm(field: string, value: string) {
    setSaved(false);
    setGenerated(false);

    setForm((current) => {
      if (field === "profile_type" && value === "coach") {
        return {
          ...current,
          profile_type: value,
          position: current.position || "Treinador",
          club: current.club || "Free",
          league: current.league || "Free Agent",
        };
      }

      return {
        ...current,
        [field]: value,
      };
    });
  }

  function updateGameForm(field: string, value: string) {
    setGameForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function startEditingGame(game: PlayerGame) {
    setEditingGameId(game.id);

    setEditingGameForm({
      competition: game.competition || "",
      season: game.season || "",
      round: game.round || "",
      opponent: game.opponent || "",
      points: String(game.points ?? ""),
      rebounds: String(game.rebounds ?? ""),
      assists: String(game.assists ?? ""),
      steals: String(game.steals ?? ""),
      blocks: String(game.blocks ?? ""),
      minutes: String(game.minutes ?? ""),
    });
  }

  function cancelEditingGame() {
    setEditingGameId(null);
    setEditingGameForm(emptyGameForm);
  }

  function updateEditingGameForm(field: string, value: string) {
    setEditingGameForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function startEditingSource(source: PlayerSource) {
    setEditingSourceId(source.source_id);

    setSourceEditForm({
      source_name: source.source_name || "",
      status: source.status || "planned",
      trust_level: source.trust_level || "high",
      profile_url: source.profile_url || "",
      external_player_id: source.external_player_id || "",
      notes: source.notes || "",
    });
  }

  function cancelEditingSource() {
    setEditingSourceId(null);

    setSourceEditForm({
      source_name: "",
      status: "planned",
      trust_level: "high",
      profile_url: "",
      external_player_id: "",
      notes: "",
    });
  }

  function updateSourceEditForm(field: keyof SourceEditForm, value: string) {
    setSourceEditForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function saveSourceProfile(sourceId: string) {
    if (!slug) return;

    setSavingSourceId(sourceId);

    try {
      const response = await fetch(`/api/admin/players/${slug}/sources`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source_id: sourceId,
          ...sourceEditForm,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to update source profile");
      }

      await loadSourceProfile();
      cancelEditingSource();

      alert("Fonte atualizada com sucesso.");
    } catch (error) {
      alert(
        error instanceof Error
          ? `Erro ao atualizar fonte: ${error.message}`
          : "Erro ao atualizar fonte.",
      );
    } finally {
      setSavingSourceId(null);
    }
  }

  async function addGameStats() {
    if (!slug) return;

    if (!gameForm.opponent.trim()) {
      alert("O adversário é obrigatório.");
      return;
    }

    setSavingGame(true);
    setGenerated(false);

    try {
      const response = await fetch(`/api/admin/players/${slug}/stats`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(gameForm),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to add game stats");
      }

      const result = await response.json();

      setGames((current) => [
        ...current,
        {
          id: current.length + 1,
          ...result.game,
        },
      ]);

      const generateResponse = await fetch("/api/admin/generate", {
        method: "POST",
      });

      if (!generateResponse.ok) {
        throw new Error("Failed to regenerate website");
      }

      const refreshedPlayer = await getPlayerBySlug(slug);

      if (refreshedPlayer) {
        setPlayer(refreshedPlayer);
      }

      setGameForm({
        ...emptyGameForm,
        competition: gameForm.competition,
        season: gameForm.season,
      });

      setGenerated(true);

      alert("Jogo adicionado e website regenerado com sucesso.");
    } catch (error) {
      alert(
        error instanceof Error
          ? `Erro ao adicionar jogo: ${error.message}`
          : "Erro ao adicionar jogo.",
      );
    } finally {
      setSavingGame(false);
    }
  }

  async function deleteGameStats(gameId: number) {
    if (!slug) return;

    const confirmed = window.confirm(
      "Tens a certeza que queres apagar este jogo?",
    );

    if (!confirmed) return;

    setDeletingGameId(gameId);
    setGenerated(false);

    try {
      const response = await fetch(
        `/api/admin/players/${slug}/stats?gameId=${gameId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to delete game");
      }

      setGames((current) =>
        current
          .filter((game) => game.id !== gameId)
          .map((game, index) => ({
            ...game,
            id: index + 1,
          })),
      );

      const generateResponse = await fetch("/api/admin/generate", {
        method: "POST",
      });

      if (!generateResponse.ok) {
        throw new Error("Failed to regenerate website");
      }

      const refreshedPlayer = await getPlayerBySlug(slug);

      if (refreshedPlayer) {
        setPlayer(refreshedPlayer);
      }

      setGenerated(true);

      alert("Jogo apagado e website regenerado com sucesso.");
    } catch (error) {
      alert(
        error instanceof Error
          ? `Erro ao apagar jogo: ${error.message}`
          : "Erro ao apagar jogo.",
      );
    } finally {
      setDeletingGameId(null);
    }
  }

  async function saveEditedGameStats(gameId: number) {
    if (!slug) return;

    if (!editingGameForm.opponent.trim()) {
      alert("O adversário é obrigatório.");
      return;
    }

    setUpdatingGameId(gameId);
    setGenerated(false);

    try {
      const response = await fetch(
        `/api/admin/players/${slug}/stats?gameId=${gameId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(editingGameForm),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to update game");
      }

      const result = await response.json();

      setGames((current) =>
        current.map((game) =>
          game.id === gameId
            ? {
                ...game,
                ...result.game,
                id: gameId,
              }
            : game,
        ),
      );

      const generateResponse = await fetch("/api/admin/generate", {
        method: "POST",
      });

      if (!generateResponse.ok) {
        throw new Error("Failed to regenerate website");
      }

      const refreshedPlayer = await getPlayerBySlug(slug);

      if (refreshedPlayer) {
        setPlayer(refreshedPlayer);
      }

      setEditingGameId(null);
      setGenerated(true);

      alert("Jogo editado e website regenerado com sucesso.");
    } catch (error) {
      alert(
        error instanceof Error
          ? `Erro ao editar jogo: ${error.message}`
          : "Erro ao editar jogo.",
      );
    } finally {
      setUpdatingGameId(null);
    }
  }

  async function saveChanges() {
    if (!slug) return;

    setSaving(true);
    setSaved(false);
    setGenerated(false);

    const payload = {
      ...form,
      highlight_video: normalizeYouTubeUrl(form.highlight_video),
    };

    try {
      const response = await fetch(`/api/admin/players/${slug}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to save player");
      }

      const result = await response.json();

      setForm(payload);

      setPlayer((current) => {
        if (!current) return current;

        return {
          ...current,
          ...result.profile,
        };
      });

      setSaved(true);
    } catch (error) {
      alert(
        error instanceof Error
          ? `Erro ao guardar alterações: ${error.message}`
          : "Erro ao guardar alterações.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function regenerateWebsite() {
    setGenerating(true);
    setGenerated(false);

    try {
      const response = await fetch("/api/admin/generate", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to regenerate website");
      }

      setGenerated(true);
      setSaved(false);
    } catch {
      alert("Erro ao regenerar o website.");
    } finally {
      setGenerating(false);
    }
  }

  async function updatePlayerStatus(nextStatus: "active" | "archived") {
    if (!slug) return;

    const confirmed = window.confirm(
      nextStatus === "archived"
        ? "Tens a certeza que queres arquivar este atleta?"
        : "Queres reativar este atleta?",
    );

    if (!confirmed) return;

    setSaving(true);
    setSaved(false);
    setGenerated(false);

    try {
      const response = await fetch(`/api/admin/players/${slug}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: nextStatus,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update player status");
      }

      setForm((current) => ({
        ...current,
        status: nextStatus,
      }));

      setPlayer((current) =>
        current
          ? {
              ...current,
              status: nextStatus,
            }
          : current,
      );

      const generateResponse = await fetch("/api/admin/generate", {
        method: "POST",
      });

      if (!generateResponse.ok) {
        throw new Error("Failed to regenerate website");
      }

      setGenerated(true);

      alert(
        nextStatus === "archived"
          ? "Atleta arquivado com sucesso."
          : "Atleta reativado com sucesso.",
      );
    } catch {
      alert("Erro ao atualizar estado do atleta.");
    } finally {
      setSaving(false);
    }
  }

  async function generateAiReport() {
    if (!slug) return;

    setGeneratingAiReport(true);
    setAiReportGenerated(false);

    try {
      const response = await fetch(`/api/admin/players/${slug}/ai-report`, {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to generate AI report");
      }

      setAiReportGenerated(true);
      await loadAiReport();

      alert("AI Report gerado com sucesso.");
    } catch (error) {
      alert(
        error instanceof Error
          ? `Erro ao gerar AI Report: ${error.message}`
          : "Erro ao gerar AI Report.",
      );
    } finally {
      setGeneratingAiReport(false);
    }
  }


  async function processAgentOutput() {
    if (!slug) return;

    if (!agentOutputText.trim()) {
      alert("Cola primeiro o JSON devolvido pelo Orangeball Scouting Agent.");
      return;
    }

    setProcessingAgentOutput(true);

    try {
      const response = await fetch(`/api/admin/players/${slug}/proposals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "agent_output",
          agent_output: agentOutputText,
        }),
      });

      const rawText = await response.text();

      let result: any = null;

      try {
        result = rawText ? JSON.parse(rawText) : null;
      } catch {
        result = null;
      }

      if (!response.ok) {
        console.error("Agent output error:", {
          status: response.status,
          rawText,
          result,
        });

        throw new Error(
          result?.errors?.join("\n") ||
            result?.error ||
            result?.message ||
            `HTTP ${response.status}: ${rawText || "sem resposta da API"}`,
        );
      }

      if (result?.status === "ignored") {
        setAgentOutputText("");

        alert(
          result.reason
            ? `Output ignorado pelo agente: ${result.reason}`
            : "Output ignorado pelo agente.",
        );

        return;
      }

      await loadProposals();

      setAgentOutputText("");

      alert(
        "AI Output processado com sucesso. Foi criada uma proposta pendente.",
      );
    } catch (error) {
      alert(
        error instanceof Error
          ? `Erro ao processar AI Output:\n${error.message}`
          : "Erro ao processar AI Output.",
      );
    } finally {
      setProcessingAgentOutput(false);
    }
  }

  async function createTestProposal() {
    if (!slug) return;

    setCreatingTestProposal(true);

    try {
      const response = await fetch(
        `/api/admin/players/${slug}/proposals/create-test`,
        {
          method: "POST",
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to create test proposal");
      }

      await loadProposals();

      alert("Proposta de teste criada com sucesso.");
    } catch (error) {
      alert(
        error instanceof Error
          ? `Erro ao criar proposta: ${error.message}`
          : "Erro ao criar proposta.",
      );
    } finally {
      setCreatingTestProposal(false);
    }
  }

  function startEditingProposal(proposal: PlayerProposal) {
    setEditingProposalId(proposal.proposal_id);

    setProposalEditForm({
      competition: proposal.proposed_data.competition || "",
      season: proposal.proposed_data.season || "",
      round: proposal.proposed_data.round || "",
      opponent: proposal.proposed_data.opponent || "",
      points: String(proposal.proposed_data.points ?? ""),
      rebounds: String(proposal.proposed_data.rebounds ?? ""),
      assists: String(proposal.proposed_data.assists ?? ""),
      steals: String(proposal.proposed_data.steals ?? ""),
      blocks: String(proposal.proposed_data.blocks ?? ""),
      minutes: String(proposal.proposed_data.minutes ?? ""),
      notes: proposal.notes || "",
    });
  }

  function cancelEditingProposal() {
    setEditingProposalId(null);

    setProposalEditForm({
      competition: "",
      season: "",
      round: "",
      opponent: "",
      points: "",
      rebounds: "",
      assists: "",
      steals: "",
      blocks: "",
      minutes: "",
      notes: "",
    });
  }

  function updateProposalEditForm(
    field: keyof ProposalEditForm,
    value: string,
  ) {
    setProposalEditForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function saveEditedProposal(proposalId: string) {
    if (!slug) return;

    if (!proposalEditForm.opponent.trim()) {
      alert("O adversário é obrigatório.");
      return;
    }

    setUpdatingProposalId(proposalId);

    try {
      const response = await fetch(`/api/admin/players/${slug}/proposals`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          proposal_id: proposalId,
          notes: proposalEditForm.notes,
          proposed_data: {
            competition: proposalEditForm.competition,
            season: proposalEditForm.season,
            round: proposalEditForm.round,
            opponent: proposalEditForm.opponent,
            points: proposalEditForm.points,
            rebounds: proposalEditForm.rebounds,
            assists: proposalEditForm.assists,
            steals: proposalEditForm.steals,
            blocks: proposalEditForm.blocks,
            minutes: proposalEditForm.minutes,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to update proposal");
      }

      await loadProposals();
      cancelEditingProposal();

      alert("Proposta editada com sucesso.");
    } catch (error) {
      alert(
        error instanceof Error
          ? `Erro ao editar proposta: ${error.message}`
          : "Erro ao editar proposta.",
      );
    } finally {
      setUpdatingProposalId(null);
    }
  }

  async function reviewProposal(
    proposalId: string,
    decision: "approved" | "rejected",
  ) {
    if (!slug) return;

    const confirmed = window.confirm(
      decision === "approved"
        ? "Queres aprovar esta proposta? Isto vai atualizar os dados reais do atleta."
        : "Queres rejeitar esta proposta?",
    );

    if (!confirmed) return;

    setReviewingProposalId(proposalId);

    try {
      const response = await fetch(`/api/admin/players/${slug}/proposals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          decision,
          proposal_id: proposalId,
          reviewed_by: "arnette",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to review proposal");
      }

      await loadProposals();

      if (decision === "approved") {
        const refreshedPlayer = await getPlayerBySlug(slug);

        if (refreshedPlayer) {
          setPlayer(refreshedPlayer);
        }

        const statsResponse = await fetch(`/api/admin/players/${slug}/stats`);

        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setGames(statsData.games || []);
        }

        await loadAiReport();
        setGenerated(true);
      }

      alert(
        decision === "approved"
          ? "Proposta aprovada com sucesso."
          : "Proposta rejeitada com sucesso.",
      );
    } catch (error) {
      alert(
        error instanceof Error
          ? `Erro ao rever proposta: ${error.message}`
          : "Erro ao rever proposta.",
      );
    } finally {
      setReviewingProposalId(null);
    }
  }

  return (
    <>
      <Navbar />

      <main className="container py-5">
        <div className="mb-4">
          <Link
            href={`/${locale}/admin`}
            className="btn btn-sm btn-outline-dark mb-3"
          >
            ← Voltar ao Admin
          </Link>

          <div>
            <span className="badge text-bg-dark mb-3">Admin Player Detail</span>
          </div>

          <h1 className="fw-bold mb-2">
            {loading
              ? "A carregar..."
              : player?.name || "Atleta não encontrado"}
          </h1>

          <p className="text-muted mb-0">
            Vista interna do atleta gerado pela Automation Layer.
          </p>
        </div>

        {loading ? (
          <div className="text-muted">A carregar dados do atleta...</div>
        ) : null}

        {!loading && notFound ? (
          <div className="alert alert-warning">
            Este atleta não foi encontrado nos ficheiros gerados.
          </div>
        ) : null}

        {!loading && player ? (
          <div className="row g-4">
            <div className="col-lg-4">
              <div className="card shadow-soft overflow-hidden">
                <div className="admin-player-photo">
                  <PlayerImage
                    src={form.photo || player.photo}
                    alt={player.name}
                  />
                </div>

                <div className="card-body p-4">
                  <h2 className="h5 fw-bold mb-2">{form.name}</h2>

                  <div className="small-muted mb-3">
                    {form.club} • {form.position}
                  </div>

                  <div className="d-flex flex-wrap gap-2">
                    <span className="badge text-bg-light">{player.slug}</span>
                    <span className="badge text-bg-light">
                      {form.nationality}
                    </span>
                    <span className="badge text-bg-light">{form.status}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-8">
              <div className="card shadow-soft mb-4">
                <div className="card-body p-4">
                  <div className="d-flex flex-column flex-md-row justify-content-between gap-3 mb-3">
                    <div>
                      <h2 className="h4 fw-bold mb-1">Fontes do atleta</h2>
                      <p className="text-muted mb-0">
                        Fontes externas associadas a este atleta para recolha
                        futura de dados.
                      </p>
                    </div>

                    <span className="badge text-bg-light">
                      {sourceProfile?.status || "sem perfil"}
                    </span>
                  </div>

                  {loadingSourceProfile ? (
                    <div className="text-muted">A carregar fontes...</div>
                  ) : null}

                  {!loadingSourceProfile && sourceProfile?.sources?.length ? (
                    <div className="d-flex flex-column gap-3">
                      {sourceProfile.sources.map((source) => {
                        const isEditingSource =
                          editingSourceId === source.source_id;
                        const isSavingSource =
                          savingSourceId === source.source_id;

                        return (
                          <div
                            key={source.source_id}
                            className="border rounded p-3"
                          >
                            {isEditingSource ? (
                              <div>
                                <div className="row g-3">
                                  <div className="col-md-6">
                                    <label className="form-label small-muted">
                                      Nome da fonte
                                    </label>
                                    <input
                                      className="form-control"
                                      value={sourceEditForm.source_name}
                                      onChange={(event) =>
                                        updateSourceEditForm(
                                          "source_name",
                                          event.target.value,
                                        )
                                      }
                                    />
                                  </div>

                                  <div className="col-md-3">
                                    <label className="form-label small-muted">
                                      Status
                                    </label>
                                    <select
                                      className="form-select"
                                      value={sourceEditForm.status}
                                      onChange={(event) =>
                                        updateSourceEditForm(
                                          "status",
                                          event.target.value,
                                        )
                                      }
                                    >
                                      <option value="active">active</option>
                                      <option value="planned">planned</option>
                                      <option value="disabled">disabled</option>
                                    </select>
                                  </div>

                                  <div className="col-md-3">
                                    <label className="form-label small-muted">
                                      Trust level
                                    </label>
                                    <select
                                      className="form-select"
                                      value={sourceEditForm.trust_level}
                                      onChange={(event) =>
                                        updateSourceEditForm(
                                          "trust_level",
                                          event.target.value,
                                        )
                                      }
                                    >
                                      <option value="high">high</option>
                                      <option value="medium">medium</option>
                                      <option value="low">low</option>
                                      <option value="verified_by_admin">
                                        verified_by_admin
                                      </option>
                                    </select>
                                  </div>

                                  <div className="col-md-8">
                                    <label className="form-label small-muted">
                                      Profile URL
                                    </label>
                                    <input
                                      className="form-control"
                                      value={sourceEditForm.profile_url}
                                      onChange={(event) =>
                                        updateSourceEditForm(
                                          "profile_url",
                                          event.target.value,
                                        )
                                      }
                                    />
                                  </div>

                                  <div className="col-md-4">
                                    <label className="form-label small-muted">
                                      External player ID
                                    </label>
                                    <input
                                      className="form-control"
                                      value={sourceEditForm.external_player_id}
                                      onChange={(event) =>
                                        updateSourceEditForm(
                                          "external_player_id",
                                          event.target.value,
                                        )
                                      }
                                    />
                                  </div>

                                  <div className="col-12">
                                    <label className="form-label small-muted">
                                      Notas
                                    </label>
                                    <textarea
                                      className="form-control"
                                      rows={2}
                                      value={sourceEditForm.notes}
                                      onChange={(event) =>
                                        updateSourceEditForm(
                                          "notes",
                                          event.target.value,
                                        )
                                      }
                                    />
                                  </div>
                                </div>

                                <div className="d-flex flex-wrap gap-2 mt-3">
                                  <button
                                    className="btn btn-sm btn-dark"
                                    onClick={() =>
                                      saveSourceProfile(source.source_id)
                                    }
                                    disabled={isSavingSource}
                                  >
                                    {isSavingSource
                                      ? "A guardar..."
                                      : "Guardar fonte"}
                                  </button>

                                  <button
                                    className="btn btn-sm btn-outline-secondary"
                                    onClick={cancelEditingSource}
                                    disabled={isSavingSource}
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="d-flex flex-column flex-md-row justify-content-between gap-2">
                                <div>
                                  <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                                    <div className="fw-bold">
                                      {source.source_name}
                                    </div>

                                    <span className="badge text-bg-dark">
                                      {source.source_id}
                                    </span>

                                    <span
                                      className={`badge ${
                                        source.status === "active"
                                          ? "text-bg-success"
                                          : source.status === "planned"
                                            ? "text-bg-warning"
                                            : "text-bg-secondary"
                                      }`}
                                    >
                                      {source.status}
                                    </span>

                                    <span className="badge text-bg-light">
                                      Trust: {source.trust_level}
                                    </span>
                                  </div>

                                  <div className="small-muted">
                                    URL:{" "}
                                    {source.profile_url || "ainda não definida"}
                                  </div>

                                  <div className="small-muted">
                                    External ID:{" "}
                                    {source.external_player_id ||
                                      "ainda não definido"}
                                  </div>

                                  {source.notes ? (
                                    <div className="small text-muted mt-2">
                                      {source.notes}
                                    </div>
                                  ) : null}
                                </div>

                                <div className="text-md-end small-muted">
                                  <div>
                                    Última verificação:{" "}
                                    {source.last_checked_at
                                      ? new Date(
                                          source.last_checked_at,
                                        ).toLocaleString("pt-PT")
                                      : "nunca"}
                                  </div>

                                  <button
                                    className="btn btn-sm btn-outline-dark mt-2"
                                    onClick={() => startEditingSource(source)}
                                  >
                                    Editar fonte
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : null}

                  {!loadingSourceProfile && !sourceProfile ? (
                    <div className="alert alert-light mb-0">
                      Ainda não existe source profile para este atleta.
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="card shadow-soft">
                <div className="card-body p-4">
                  <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start gap-3 mb-4">
                    <div>
                      <h2 className="h5 fw-bold mb-1">Editar dados base</h2>
                      <p className="small-muted mb-0">
                        Guarda no AI Engine e depois regenera os ficheiros
                        públicos.
                      </p>
                    </div>

                    <div className="d-flex flex-wrap gap-2">
                      <button
                        className="btn btn-dark"
                        onClick={saveChanges}
                        disabled={saving || generating}
                      >
                        {saving ? "A guardar..." : "Guardar alterações"}
                      </button>

                      <button
                        className="btn btn-outline-dark"
                        onClick={regenerateWebsite}
                        disabled={generating || saving}
                      >
                        {generating ? "A regenerar..." : "Regenerar Website"}
                      </button>

                      {form.status === "archived" ? (
                        <button
                          className="btn btn-outline-success"
                          onClick={() => updatePlayerStatus("active")}
                          disabled={saving || generating}
                        >
                          Reativar atleta
                        </button>
                      ) : (
                        <button
                          className="btn btn-outline-danger"
                          onClick={() => updatePlayerStatus("archived")}
                          disabled={saving || generating}
                        >
                          Arquivar atleta
                        </button>
                      )}

                      <button
                        className="btn btn-outline-primary"
                        onClick={generateAiReport}
                        disabled={
                          generatingAiReport ||
                          generating ||
                          saving ||
                          savingGame
                        }
                      >
                        {generatingAiReport
                          ? "A gerar AI Report..."
                          : "Gerar AI Report"}
                      </button>
                    </div>
                  </div>

                  {saved ? (
                    <div className="alert alert-success mb-4">
                      Alterações guardadas no AI Engine. Agora clica em
                      “Regenerar Website”.
                    </div>
                  ) : null}

                  {generated ? (
                    <div className="alert alert-success mb-4">
                      Website regenerado com sucesso. O perfil público já pode
                      refletir os novos dados.
                    </div>
                  ) : null}

                  {aiReportGenerated ? (
                    <div className="alert alert-success mb-4">
                      AI Report gerado com sucesso.
                      <div className="mt-2">
                        <Link
                          href={`/generated/reports/players/${player.slug}-ai-report.md`}
                          target="_blank"
                          className="btn btn-sm btn-outline-dark"
                        >
                          Abrir AI Report
                        </Link>
                      </div>
                    </div>
                  ) : null}

                  <div className="row g-3 mb-4">
                    <AdminInput
                      label="Nome"
                      value={form.name}
                      onChange={(value) => updateForm("name", value)}
                    />

                    <AdminInput label="Slug" value={player.slug} readOnly />

                    <AdminSelect
                      label="Tipo de perfil"
                      value={form.profile_type}
                      onChange={(value) => updateForm("profile_type", value)}
                      options={[
                        { value: "player", label: "Atleta" },
                        { value: "coach", label: "Treinador" },
                      ]}
                    />

                    <AdminSelect
                      label="Género"
                      value={form.gender}
                      onChange={(value) => updateForm("gender", value)}
                      options={[
                        { value: "female", label: "Feminino" },
                        { value: "male", label: "Masculino" },
                      ]}
                    />

                    <AdminInput
                      label="Clube"
                      value={form.club}
                      onChange={(value) => updateForm("club", value)}
                    />

                    <AdminInput
                      label={
                        form.profile_type === "coach" ? "Função" : "Posição"
                      }
                      value={form.position}
                      onChange={(value) => updateForm("position", value)}
                    />

                    <AdminInput
                      label="Nacionalidade"
                      value={form.nationality}
                      onChange={(value) => updateForm("nationality", value)}
                    />

                    <AdminInput
                      label="Liga"
                      value={form.league}
                      onChange={(value) => updateForm("league", value)}
                    />

                    <AdminInput
                      label="Altura em cm"
                      value={form.height_cm}
                      onChange={(value) => updateForm("height_cm", value)}
                    />

                    <AdminSelect
                      label="Status"
                      value={form.status}
                      onChange={(value) => updateForm("status", value)}
                      options={[
                        { value: "active", label: "active" },
                        { value: "archived", label: "archived" },
                      ]}
                    />

                    <AdminInput
                      label="Foto"
                      value={form.photo}
                      onChange={(value) => updateForm("photo", value)}
                    />

                    <AdminInput
                      label="Highlight Video"
                      value={form.highlight_video}
                      onChange={(value) => updateForm("highlight_video", value)}
                    />

                    <AdminInput
                      label="Instagram"
                      value={form.instagram}
                      onChange={(value) => updateForm("instagram", value)}
                    />

                    <AdminInput
                      label="YouTube"
                      value={form.youtube}
                      onChange={(value) => updateForm("youtube", value)}
                    />

                    <AdminTextarea
                      label="Bio"
                      value={form.bio}
                      onChange={(value) => updateForm("bio", value)}
                    />

                    <AdminTextarea
                      label={
                        form.profile_type === "coach"
                          ? "Experiência / notas técnicas"
                          : "Agent notes"
                      }
                      value={form.agent_notes}
                      onChange={(value) => updateForm("agent_notes", value)}
                    />
                  </div>

                  <hr className="my-4" />
                  <div id="agent-output" className="border rounded-3 p-4 mb-4">
                    <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start gap-3 mb-3">
                      <div>
                        <h2 className="h5 fw-bold mb-1">
                          Orangeball Scouting Agent
                        </h2>

                        <p className="small-muted mb-0">
                          Cola aqui o JSON devolvido pelo GPT privado. Se for um
                          stat_update válido, o sistema cria uma proposta
                          pendente para aprovares.
                        </p>
                      </div>

                      <button
                        className="btn btn-outline-primary"
                        onClick={processAgentOutput}
                        disabled={processingAgentOutput || loadingProposals}
                      >
                        {processingAgentOutput
                          ? "A processar..."
                          : "Processar AI Output"}
                      </button>
                    </div>

                    <textarea
                      className="form-control font-monospace"
                      rows={10}
                      value={agentOutputText}
                      onChange={(event) =>
                        setAgentOutputText(event.target.value)
                      }
                      placeholder="Cola aqui o JSON completo devolvido pelo Orangeball Scouting Agent..."
                    />

                    <div className="small-muted mt-2">
                      Formatos suportados nesta fase: stat_update, news_update,
                      profile_update e ignored.
                    </div>
                  </div>

                  <div id="proposals" className="border rounded-3 p-4 mb-4">
                    <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start gap-3 mb-3">
                      <div>
                        <h2 className="h5 fw-bold mb-1">AI Proposals</h2>
                        <p className="small-muted mb-0">
                          Propostas pendentes geradas pelo AI Engine. Só entram
                          nos dados reais após aprovação.
                        </p>
                      </div>

                      <div className="d-flex flex-wrap gap-2">
                        <button
                          className="btn btn-outline-primary"
                          onClick={createTestProposal}
                          disabled={creatingTestProposal || loadingProposals}
                        >
                          {creatingTestProposal
                            ? "A criar proposta..."
                            : "Criar proposta de teste"}
                        </button>

                        <button
                          className="btn btn-outline-dark"
                          onClick={loadProposals}
                          disabled={loadingProposals}
                        >
                          {loadingProposals
                            ? "A carregar..."
                            : "Atualizar propostas"}
                        </button>
                      </div>
                    </div>

                    {loadingProposals ? (
                      <div className="alert alert-light mb-0">
                        A carregar propostas...
                      </div>
                    ) : proposals.length > 0 ? (
                      <div className="d-flex flex-column gap-3">
                        {proposals.map((proposal) => {
                          const data = proposal.proposed_data;
                          const isNewsProposal =
                            proposal.type === "news_update";
                          const isGameProposal = proposal.type === "add_game";
                          const isProfileProposal =
                            proposal.type === "profile_update";
                          const isEditing =
                            editingProposalId === proposal.proposal_id;
                          const isReviewing =
                            reviewingProposalId === proposal.proposal_id;
                          const isUpdating =
                            updatingProposalId === proposal.proposal_id;

                          return (
                            <div
                              key={proposal.proposal_id}
                              className="border rounded p-3 bg-light"
                            >
                              <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
                                <div>
                                  <h5 className="mb-1">
                                    {isGameProposal
                                      ? `Adicionar jogo vs ${data.opponent || "—"}`
                                      : isNewsProposal
                                        ? data.title || "Nova notícia"
                                        : isProfileProposal
                                          ? "Atualização de perfil"
                                          : proposal.type}
                                  </h5>

                                  <div className="text-muted small">
                                    Fonte: {proposal.source || "—"} · Confiança:{" "}
                                    {Math.round(
                                      (proposal.confidence || 0) * 100,
                                    )}
                                    %
                                    {proposal.created_at
                                      ? ` · Criado em ${new Date(
                                          proposal.created_at,
                                        ).toLocaleString("pt-PT")}`
                                      : ""}
                                  </div>
                                </div>

                                {!isEditing ? (
                                  <div className="d-flex flex-wrap gap-2">
                                    {isGameProposal ? (
                                      <button
                                        className="btn btn-sm btn-outline-primary"
                                        onClick={() =>
                                          startEditingProposal(proposal)
                                        }
                                        disabled={reviewingProposalId !== null}
                                      >
                                        Editar
                                      </button>
                                    ) : null}

                                    {isGameProposal ||
                                    isNewsProposal ||
                                    isProfileProposal ? (
                                      <button
                                        className="btn btn-sm btn-success"
                                        onClick={() =>
                                          reviewProposal(
                                            proposal.proposal_id,
                                            "approved",
                                          )
                                        }
                                        disabled={reviewingProposalId !== null}
                                      >
                                        {isReviewing
                                          ? "A aprovar..."
                                          : "Aprovar"}
                                      </button>
                                    ) : (
                                      <span className="badge text-bg-warning">
                                        Aprovação de perfil no próximo passo
                                      </span>
                                    )}

                                    <button
                                      className="btn btn-sm btn-outline-danger"
                                      onClick={() =>
                                        reviewProposal(
                                          proposal.proposal_id,
                                          "rejected",
                                        )
                                      }
                                      disabled={reviewingProposalId !== null}
                                    >
                                      {isReviewing
                                        ? "A rejeitar..."
                                        : "Rejeitar"}
                                    </button>
                                  </div>
                                ) : null}
                              </div>

                              {isEditing ? (
                                <div className="border rounded p-3 bg-white">
                                  <div className="row g-2">
                                    <div className="col-md-4">
                                      <label className="form-label">
                                        Competição
                                      </label>
                                      <input
                                        className="form-control"
                                        value={proposalEditForm.competition}
                                        onChange={(event) =>
                                          updateProposalEditForm(
                                            "competition",
                                            event.target.value,
                                          )
                                        }
                                      />
                                    </div>

                                    <div className="col-md-4">
                                      <label className="form-label">
                                        Época
                                      </label>
                                      <input
                                        className="form-control"
                                        value={proposalEditForm.season}
                                        onChange={(event) =>
                                          updateProposalEditForm(
                                            "season",
                                            event.target.value,
                                          )
                                        }
                                      />
                                    </div>

                                    <div className="col-md-4">
                                      <label className="form-label">
                                        Jornada
                                      </label>
                                      <input
                                        className="form-control"
                                        value={proposalEditForm.round}
                                        onChange={(event) =>
                                          updateProposalEditForm(
                                            "round",
                                            event.target.value,
                                          )
                                        }
                                      />
                                    </div>

                                    <div className="col-md-6">
                                      <label className="form-label">
                                        Adversário
                                      </label>
                                      <input
                                        className="form-control"
                                        value={proposalEditForm.opponent}
                                        onChange={(event) =>
                                          updateProposalEditForm(
                                            "opponent",
                                            event.target.value,
                                          )
                                        }
                                      />
                                    </div>

                                    <div className="col-md-2">
                                      <label className="form-label">PTS</label>
                                      <input
                                        type="number"
                                        className="form-control"
                                        value={proposalEditForm.points}
                                        onChange={(event) =>
                                          updateProposalEditForm(
                                            "points",
                                            event.target.value,
                                          )
                                        }
                                      />
                                    </div>

                                    <div className="col-md-2">
                                      <label className="form-label">REB</label>
                                      <input
                                        type="number"
                                        className="form-control"
                                        value={proposalEditForm.rebounds}
                                        onChange={(event) =>
                                          updateProposalEditForm(
                                            "rebounds",
                                            event.target.value,
                                          )
                                        }
                                      />
                                    </div>

                                    <div className="col-md-2">
                                      <label className="form-label">AST</label>
                                      <input
                                        type="number"
                                        className="form-control"
                                        value={proposalEditForm.assists}
                                        onChange={(event) =>
                                          updateProposalEditForm(
                                            "assists",
                                            event.target.value,
                                          )
                                        }
                                      />
                                    </div>

                                    <div className="col-md-2">
                                      <label className="form-label">STL</label>
                                      <input
                                        type="number"
                                        className="form-control"
                                        value={proposalEditForm.steals}
                                        onChange={(event) =>
                                          updateProposalEditForm(
                                            "steals",
                                            event.target.value,
                                          )
                                        }
                                      />
                                    </div>

                                    <div className="col-md-2">
                                      <label className="form-label">BLK</label>
                                      <input
                                        type="number"
                                        className="form-control"
                                        value={proposalEditForm.blocks}
                                        onChange={(event) =>
                                          updateProposalEditForm(
                                            "blocks",
                                            event.target.value,
                                          )
                                        }
                                      />
                                    </div>

                                    <div className="col-md-2">
                                      <label className="form-label">MIN</label>
                                      <input
                                        type="number"
                                        className="form-control"
                                        value={proposalEditForm.minutes}
                                        onChange={(event) =>
                                          updateProposalEditForm(
                                            "minutes",
                                            event.target.value,
                                          )
                                        }
                                      />
                                    </div>

                                    <div className="col-12">
                                      <label className="form-label">
                                        Notas
                                      </label>
                                      <textarea
                                        className="form-control"
                                        rows={2}
                                        value={proposalEditForm.notes}
                                        onChange={(event) =>
                                          updateProposalEditForm(
                                            "notes",
                                            event.target.value,
                                          )
                                        }
                                      />
                                    </div>
                                  </div>

                                  <div className="d-flex flex-wrap gap-2 mt-3">
                                    <button
                                      className="btn btn-primary"
                                      onClick={() =>
                                        saveEditedProposal(proposal.proposal_id)
                                      }
                                      disabled={isUpdating}
                                    >
                                      {isUpdating
                                        ? "A guardar..."
                                        : "Guardar alterações"}
                                    </button>

                                    <button
                                      className="btn btn-outline-secondary"
                                      onClick={cancelEditingProposal}
                                      disabled={isUpdating}
                                    >
                                      Cancelar
                                    </button>
                                  </div>
                                </div>
                              ) : isNewsProposal ? (
                                <>
                                  <div className="row g-2 mb-2">
                                    <div className="col-md-4">
                                      <strong>Categoria:</strong>{" "}
                                      {data.category || "—"}
                                    </div>

                                    <div className="col-md-4">
                                      <strong>Data:</strong>{" "}
                                      {data.published_at || "—"}
                                    </div>

                                    <div className="col-md-4">
                                      <strong>Fonte:</strong>{" "}
                                      {data.source_name ||
                                        proposal.source ||
                                        "—"}
                                    </div>
                                  </div>

                                  <p className="mb-2">
                                    <strong>Resumo:</strong>{" "}
                                    {data.summary || "—"}
                                  </p>

                                  {data.content ? (
                                    <p className="mb-2 small text-muted">
                                      <strong>Conteúdo:</strong> {data.content}
                                    </p>
                                  ) : null}

                                  {proposal.source_url ? (
                                    <p className="mb-0 small text-muted">
                                      <strong>URL:</strong>{" "}
                                      {proposal.source_url}
                                    </p>
                                  ) : null}

                                  {proposal.notes ? (
                                    <p className="mb-0 small text-muted mt-2">
                                      <strong>Notas:</strong> {proposal.notes}
                                    </p>
                                  ) : null}
                                </>
                              ) : isProfileProposal ? (
                                <>
                                  <div className="row g-2 mb-2">
                                    {Object.entries(
                                      data as Record<string, unknown>,
                                    )
                                      .filter(([, value]) => {
                                        if (Array.isArray(value)) {
                                          return value.length > 0;
                                        }

                                        return (
                                          value !== undefined &&
                                          value !== null &&
                                          String(value).trim() !== ""
                                        );
                                      })
                                      .map(([field, value]) => (
                                        <div className="col-md-6" key={field}>
                                          <div className="border rounded-3 p-3 bg-white h-100">
                                            <div className="small-muted mb-1">
                                              {getProfileFieldLabel(field)}
                                            </div>

                                            <div className="fw-bold">
                                              {Array.isArray(value)
                                                ? value.join(", ")
                                                : String(value)}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                  </div>

                                  {proposal.source_url ? (
                                    <p className="mb-0 small text-muted">
                                      <strong>URL:</strong>{" "}
                                      {proposal.source_url}
                                    </p>
                                  ) : null}

                                  {proposal.notes ? (
                                    <p className="mb-0 small text-muted mt-2">
                                      <strong>Notas:</strong> {proposal.notes}
                                    </p>
                                  ) : null}
                                </>
                              ) : (
                                <>
                                  <div className="row g-2 mb-2">
                                    <div className="col-md-3">
                                      <strong>Competição:</strong>{" "}
                                      {data.competition || "—"}
                                    </div>

                                    <div className="col-md-3">
                                      <strong>Época:</strong>{" "}
                                      {data.season || "—"}
                                    </div>

                                    <div className="col-md-3">
                                      <strong>Jornada:</strong>{" "}
                                      {data.round || "—"}
                                    </div>

                                    <div className="col-md-3">
                                      <strong>Adversário:</strong>{" "}
                                      {data.opponent || "—"}
                                    </div>
                                  </div>

                                  <div className="d-flex flex-wrap gap-3 mb-2">
                                    <span>
                                      <strong>PTS:</strong> {data.points ?? 0}
                                    </span>
                                    <span>
                                      <strong>REB:</strong> {data.rebounds ?? 0}
                                    </span>
                                    <span>
                                      <strong>AST:</strong> {data.assists ?? 0}
                                    </span>
                                    <span>
                                      <strong>STL:</strong> {data.steals ?? 0}
                                    </span>
                                    <span>
                                      <strong>BLK:</strong> {data.blocks ?? 0}
                                    </span>
                                    <span>
                                      <strong>MIN:</strong> {data.minutes ?? 0}
                                    </span>
                                  </div>

                                  {proposal.notes ? (
                                    <p className="mb-0 small text-muted">
                                      <strong>Notas:</strong> {proposal.notes}
                                    </p>
                                  ) : null}
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="alert alert-light mb-0">
                        Não existem propostas pendentes para este atleta.
                      </div>
                    )}
                  </div>

                  <hr className="my-4" />

                  <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start gap-3 mb-3">
                    <div>
                      <h2 className="h5 fw-bold mb-1">Adicionar jogo</h2>
                      <p className="small-muted mb-0">
                        Insere estatísticas manuais. O sistema atualiza o
                        stats.csv e regenera o website.
                      </p>
                    </div>
                  </div>

                  <div className="row g-3 mb-4">
                    <AdminInput
                      label="Competição"
                      value={gameForm.competition}
                      onChange={(value) => updateGameForm("competition", value)}
                    />

                    <AdminInput
                      label="Época"
                      value={gameForm.season}
                      onChange={(value) => updateGameForm("season", value)}
                    />

                    <AdminInput
                      label="Jornada"
                      value={gameForm.round}
                      onChange={(value) => updateGameForm("round", value)}
                    />

                    <AdminInput
                      label="Adversário"
                      value={gameForm.opponent}
                      onChange={(value) => updateGameForm("opponent", value)}
                    />

                    <AdminInput
                      label="Pontos"
                      value={gameForm.points}
                      onChange={(value) => updateGameForm("points", value)}
                    />

                    <AdminInput
                      label="Ressaltos"
                      value={gameForm.rebounds}
                      onChange={(value) => updateGameForm("rebounds", value)}
                    />

                    <AdminInput
                      label="Assistências"
                      value={gameForm.assists}
                      onChange={(value) => updateGameForm("assists", value)}
                    />

                    <AdminInput
                      label="Roubos"
                      value={gameForm.steals}
                      onChange={(value) => updateGameForm("steals", value)}
                    />

                    <AdminInput
                      label="Blocos"
                      value={gameForm.blocks}
                      onChange={(value) => updateGameForm("blocks", value)}
                    />

                    <AdminInput
                      label="Minutos"
                      value={gameForm.minutes}
                      onChange={(value) => updateGameForm("minutes", value)}
                    />
                  </div>

                  <div className="mb-4">
                    <button
                      className="btn btn-dark"
                      onClick={addGameStats}
                      disabled={savingGame || saving || generating}
                    >
                      {savingGame ? "A guardar jogo..." : "Guardar jogo"}
                    </button>
                  </div>

                  <h2 className="h5 fw-bold mb-3">Histórico de jogos</h2>

                  {games.length > 0 ? (
                    <div className="table-responsive mb-4">
                      <table className="table align-middle">
                        <thead>
                          <tr>
                            <th>Competição</th>
                            <th>Época</th>
                            <th>Jornada</th>
                            <th>Adversário</th>
                            <th>PTS</th>
                            <th>REB</th>
                            <th>AST</th>
                            <th>STL</th>
                            <th>BLK</th>
                            <th>MIN</th>
                            <th>Ações</th>
                          </tr>
                        </thead>

                        <tbody>
                          {games.map((game) => {
                            const isEditing = editingGameId === game.id;

                            return (
                              <tr key={game.id}>
                                {isEditing ? (
                                  <>
                                    <td>
                                      <input
                                        className="form-control form-control-sm"
                                        value={editingGameForm.competition}
                                        onChange={(event) =>
                                          updateEditingGameForm(
                                            "competition",
                                            event.target.value,
                                          )
                                        }
                                      />
                                    </td>

                                    <td>
                                      <input
                                        className="form-control form-control-sm"
                                        value={editingGameForm.season}
                                        onChange={(event) =>
                                          updateEditingGameForm(
                                            "season",
                                            event.target.value,
                                          )
                                        }
                                      />
                                    </td>

                                    <td>
                                      <input
                                        className="form-control form-control-sm"
                                        value={editingGameForm.round}
                                        onChange={(event) =>
                                          updateEditingGameForm(
                                            "round",
                                            event.target.value,
                                          )
                                        }
                                      />
                                    </td>

                                    <td>
                                      <input
                                        className="form-control form-control-sm"
                                        value={editingGameForm.opponent}
                                        onChange={(event) =>
                                          updateEditingGameForm(
                                            "opponent",
                                            event.target.value,
                                          )
                                        }
                                      />
                                    </td>

                                    <td>
                                      <input
                                        className="form-control form-control-sm"
                                        value={editingGameForm.points}
                                        onChange={(event) =>
                                          updateEditingGameForm(
                                            "points",
                                            event.target.value,
                                          )
                                        }
                                      />
                                    </td>

                                    <td>
                                      <input
                                        className="form-control form-control-sm"
                                        value={editingGameForm.rebounds}
                                        onChange={(event) =>
                                          updateEditingGameForm(
                                            "rebounds",
                                            event.target.value,
                                          )
                                        }
                                      />
                                    </td>

                                    <td>
                                      <input
                                        className="form-control form-control-sm"
                                        value={editingGameForm.assists}
                                        onChange={(event) =>
                                          updateEditingGameForm(
                                            "assists",
                                            event.target.value,
                                          )
                                        }
                                      />
                                    </td>

                                    <td>
                                      <input
                                        className="form-control form-control-sm"
                                        value={editingGameForm.steals}
                                        onChange={(event) =>
                                          updateEditingGameForm(
                                            "steals",
                                            event.target.value,
                                          )
                                        }
                                      />
                                    </td>

                                    <td>
                                      <input
                                        className="form-control form-control-sm"
                                        value={editingGameForm.blocks}
                                        onChange={(event) =>
                                          updateEditingGameForm(
                                            "blocks",
                                            event.target.value,
                                          )
                                        }
                                      />
                                    </td>

                                    <td>
                                      <input
                                        className="form-control form-control-sm"
                                        value={editingGameForm.minutes}
                                        onChange={(event) =>
                                          updateEditingGameForm(
                                            "minutes",
                                            event.target.value,
                                          )
                                        }
                                      />
                                    </td>

                                    <td>
                                      <div className="d-flex gap-2">
                                        <button
                                          className="btn btn-sm btn-dark"
                                          onClick={() =>
                                            saveEditedGameStats(game.id)
                                          }
                                          disabled={updatingGameId === game.id}
                                        >
                                          {updatingGameId === game.id
                                            ? "A guardar..."
                                            : "Guardar"}
                                        </button>

                                        <button
                                          className="btn btn-sm btn-outline-secondary"
                                          onClick={cancelEditingGame}
                                          disabled={updatingGameId === game.id}
                                        >
                                          Cancelar
                                        </button>
                                      </div>
                                    </td>
                                  </>
                                ) : (
                                  <>
                                    <td>{game.competition || "—"}</td>
                                    <td>{game.season || "—"}</td>
                                    <td>{game.round || "—"}</td>
                                    <td>{game.opponent || "—"}</td>
                                    <td>{game.points}</td>
                                    <td>{game.rebounds}</td>
                                    <td>{game.assists}</td>
                                    <td>{game.steals}</td>
                                    <td>{game.blocks}</td>
                                    <td>{game.minutes}</td>

                                    <td>
                                      <div className="d-flex gap-2">
                                        <button
                                          className="btn btn-sm btn-outline-dark"
                                          onClick={() => startEditingGame(game)}
                                          disabled={
                                            savingGame ||
                                            saving ||
                                            generating ||
                                            deletingGameId === game.id
                                          }
                                        >
                                          Editar
                                        </button>

                                        <button
                                          className="btn btn-sm btn-outline-danger"
                                          onClick={() =>
                                            deleteGameStats(game.id)
                                          }
                                          disabled={
                                            deletingGameId === game.id ||
                                            savingGame ||
                                            saving ||
                                            generating
                                          }
                                        >
                                          {deletingGameId === game.id
                                            ? "A apagar..."
                                            : "Apagar"}
                                        </button>
                                      </div>
                                    </td>
                                  </>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="alert alert-light mb-4">
                      Ainda não existem jogos registados para este atleta.
                    </div>
                  )}

                  <hr className="my-4" />

                  <h2 className="h5 fw-bold mb-3">Performance</h2>

                  <div className="row g-3 mb-4">
                    <AdminField
                      label="PPG"
                      value={formatStat(player.averages.ppg)}
                    />
                    <AdminField
                      label="RPG"
                      value={formatStat(player.averages.rpg)}
                    />
                    <AdminField
                      label="APG"
                      value={formatStat(player.averages.apg)}
                    />
                    <AdminField
                      label="OBD Index"
                      value={formatStat(player.averages.performance_index)}
                    />
                  </div>

                  <hr className="my-4" />

                  <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start gap-3 mb-3">
                    <div>
                      <h2 className="h5 fw-bold mb-1">AI Report</h2>
                      <p className="small-muted mb-0">
                        Análise automática gerada pelo AI Engine com base no
                        perfil e estatísticas.
                      </p>
                    </div>

                    <button
                      className="btn btn-outline-primary"
                      onClick={generateAiReport}
                      disabled={
                        generatingAiReport || generating || saving || savingGame
                      }
                    >
                      {generatingAiReport
                        ? "A gerar AI Report..."
                        : "Gerar novo AI Report"}
                    </button>
                  </div>

                  {loadingAiReport ? (
                    <div className="alert alert-light">
                      A carregar AI Report...
                    </div>
                  ) : aiReport ? (
                    <div className="border rounded-3 p-4 mb-4">
                      <div className="small-muted mb-2">
                        Gerado em:{" "}
                        {new Date(aiReport.generated_at).toLocaleString(
                          "pt-PT",
                        )}
                      </div>

                      <h3 className="h6 fw-bold mb-2">Resumo</h3>
                      <p className="text-muted">{aiReport.summary}</p>

                      <h3 className="h6 fw-bold mb-2">Último jogo</h3>
                      <p className="text-muted">
                        {aiReport.latest_game_summary}
                      </p>

                      <h3 className="h6 fw-bold mb-2">Pontos fortes</h3>
                      <ul className="text-muted">
                        {(aiReport.strengths || []).map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>

                      <h3 className="h6 fw-bold mb-2">Pontos a melhorar</h3>
                      <ul className="text-muted">
                        {(aiReport.improvement_points || []).map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>

                      {aiReport.classification ? (
                        <>
                          <h3 className="h6 fw-bold mb-2">
                            Classificação final
                          </h3>

                          <div className="border rounded-3 p-3 mb-3 bg-light">
                            <div className="fw-bold mb-1">
                              {aiReport.classification.label}
                            </div>

                            <div className="text-muted small">
                              {aiReport.classification.reason}
                            </div>
                          </div>
                        </>
                      ) : null}

                      <h3 className="h6 fw-bold mb-2">
                        Recomendação de scouting
                      </h3>
                      <p className="text-muted mb-0">
                        {aiReport.recommendation}
                      </p>
                    </div>
                  ) : (
                    <div className="alert alert-light mb-4">
                      Ainda não existe AI Report para este atleta. Clica em
                      “Gerar novo AI Report”.
                    </div>
                  )}

                  <hr className="my-4" />

                  <h2 className="h5 fw-bold mb-2">Summary</h2>
                  <p className="text-muted mb-4">{player.summary}</p>

                  <h2 className="h5 fw-bold mb-2">Media Status</h2>

                  <div className="border rounded-3 p-3">
                    <div className="small-muted mb-1">Highlight Video</div>
                    <div className="fw-bold">
                      {hasHighlightVideo
                        ? "Vídeo configurado"
                        : "Vídeo ainda não disponível"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </main>

      <Footer />
    </>
  );
}

function getProfileFieldLabel(field: string) {
  const labels: Record<string, string> = {
    profile_type: "Tipo de perfil",
    name: "Nome",
    club: "Clube",
    position: "Posição/Função",
    nationality: "Nacionalidade",
    gender: "Género",
    league: "Liga",
    height_cm: "Altura em cm",
    photo: "Foto",
    highlight_video: "Highlight Video",
    instagram: "Instagram",
    youtube: "YouTube",
    bio: "Bio",
    agent_notes: "Agent notes",
    status: "Status",
    tags: "Tags",
  };

  return labels[field] || field;
}

function AdminInput({
  label,
  value,
  onChange,
  readOnly = false,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
}) {
  return (
    <div className="col-md-6">
      <label className="form-label small-muted">{label}</label>
      <input
        className="form-control"
        value={value}
        readOnly={readOnly}
        onChange={(event) => onChange?.(event.target.value)}
      />
    </div>
  );
}

function AdminSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="col-md-6">
      <label className="form-label small-muted">{label}</label>
      <select
        className="form-select"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function AdminTextarea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="col-12">
      <label className="form-label small-muted">{label}</label>
      <textarea
        className="form-control"
        rows={4}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function AdminField({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="col-md-3">
      <div className="border rounded-3 p-3 h-100">
        <div className="small-muted mb-1">{label}</div>
        <div className="fw-bold">{value}</div>
      </div>
    </div>
  );
}