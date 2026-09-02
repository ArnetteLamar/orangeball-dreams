"use client";

import { useCallback, useEffect, useState } from "react";

type LocalizedText =
  | string
  | {
      es?: string;
      en?: string;
    };

type AdminNewsProposal = {
  file_name: string;
  status: string;
  created_at?: string;
  proposal_type: string;
  target: string;
  confidence: number;
  data: {
    id: string;
    date: string;
    homepage?: boolean;
    category: LocalizedText;
    title: LocalizedText;
    summary: LocalizedText;
    image?: string;
    player_slug?: string;
    href?: string;
    source?: string;
  };
  evidence?: {
    source_url?: string;
    source_name?: string;
    source_date?: string;
    why_relevant?: string;
  };
};

type NewsProposalsResponse = {
  status: string;
  count: number;
  proposals: AdminNewsProposal[];
};

function localize(value: LocalizedText) {
  if (typeof value === "string") {
    return value;
  }

  return value.es || value.en || "";
}

export default function AdminNewsProposals() {
  const [proposals, setProposals] = useState<AdminNewsProposal[]>([]);
  const [loading, setLoading] = useState(false);
  const [reviewingFileName, setReviewingFileName] = useState<string | null>(
    null,
  );
  const [message, setMessage] = useState<string | null>(null);

  const loadProposals = useCallback(async () => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/news/proposals");
      const data: NewsProposalsResponse = await response.json();

      if (!response.ok) {
        throw new Error("Failed to load news proposals");
      }

      setProposals(data.proposals || []);
    } catch (error) {
      setProposals([]);
      setMessage(
        error instanceof Error
          ? `Erro: ${error.message}`
          : "Erro ao carregar propostas de notícias.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProposals();
  }, [loadProposals]);

  async function reviewProposal(
    proposal: AdminNewsProposal,
    action: "approve" | "reject",
  ) {
    const confirmed = window.confirm(
      action === "approve"
        ? "Queres aprovar esta notícia? Ela vai entrar na Homepage e na News Page."
        : "Queres rejeitar esta notícia?",
    );

    if (!confirmed) return;

    setReviewingFileName(proposal.file_name);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/news/proposals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          file_name: proposal.file_name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to review proposal");
      }

      setMessage(
        action === "approve"
          ? "Notícia aprovada. Homepage e News Page foram atualizadas localmente."
          : "Notícia rejeitada.",
      );

      await loadProposals();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? `Erro: ${error.message}`
          : "Erro ao rever proposta.",
      );
    } finally {
      setReviewingFileName(null);
    }
  }

  return (
    <div className="card shadow-soft mb-4">
      <div className="card-body p-4">
        <div className="d-flex flex-column flex-md-row justify-content-between gap-3 align-items-md-start mb-3">
          <div>
            <h2 className="h4 fw-bold mb-1">News Proposals</h2>

            <p className="text-muted mb-0">
              Propostas de notícias criadas pelo AI News Agent. Só aparecem no
              site depois de aprovação.
            </p>
          </div>

          <button
            className="btn btn-outline-dark"
            onClick={loadProposals}
            disabled={loading || reviewingFileName !== null}
          >
            {loading ? "A atualizar..." : "Atualizar notícias"}
          </button>
        </div>

        {message ? (
          <div className="alert alert-light border py-2 px-3 small mb-3">
            {message}
          </div>
        ) : null}

        {loading ? (
          <div className="alert alert-light mb-0">
            A carregar propostas de notícias...
          </div>
        ) : proposals.length > 0 ? (
          <div className="d-flex flex-column gap-3">
            {proposals.map((proposal) => {
              const title = localize(proposal.data.title);
              const category = localize(proposal.data.category);
              const summary = localize(proposal.data.summary);
              const isReviewing = reviewingFileName === proposal.file_name;

              return (
                <div
                  key={proposal.file_name}
                  className="border rounded-3 p-3 bg-light"
                >
                  <div className="d-flex flex-column flex-lg-row justify-content-between gap-3">
                    <div>
                      <div className="d-flex flex-wrap gap-2 mb-2">
                        <span className="badge text-bg-dark">
                          {category || "News"}
                        </span>

                        <span className="badge text-bg-light">
                          {proposal.data.source || "Fonte desconhecida"}
                        </span>

                        <span className="badge text-bg-light">
                          {proposal.data.date || "Sem data"}
                        </span>

                        <span className="badge text-bg-warning">
                          Confiança:{" "}
                          {Math.round((proposal.confidence || 0) * 100)}%
                        </span>

                        <span className="badge text-bg-light">
                          Target: {proposal.target}
                        </span>
                      </div>

                      <h3 className="h5 fw-bold mb-2">
                        {title || "Notícia sem título"}
                      </h3>

                      <p className="text-muted mb-2">{summary || "—"}</p>

                      <div className="small-muted mb-1">
                        Ficheiro: {proposal.file_name}
                      </div>

                      {proposal.data.player_slug ? (
                        <div className="small-muted mb-1">
                          Player slug: {proposal.data.player_slug}
                        </div>
                      ) : null}

                      {proposal.data.href ? (
                        <div className="small-muted mb-1">
                          URL: {proposal.data.href}
                        </div>
                      ) : null}

                      {proposal.evidence?.why_relevant ? (
                        <div className="small text-muted mt-2">
                          <strong>Relevância:</strong>{" "}
                          {proposal.evidence.why_relevant}
                        </div>
                      ) : null}
                    </div>

                    <div className="d-flex flex-row flex-lg-column gap-2 align-items-start align-items-lg-end">
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => reviewProposal(proposal, "approve")}
                        disabled={reviewingFileName !== null}
                      >
                        {isReviewing ? "A rever..." : "Aprovar"}
                      </button>

                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => reviewProposal(proposal, "reject")}
                        disabled={reviewingFileName !== null}
                      >
                        {isReviewing ? "A rever..." : "Rejeitar"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="alert alert-light mb-0">
            Não existem propostas de notícias pendentes.
          </div>
        )}
      </div>
    </div>
  );
}
