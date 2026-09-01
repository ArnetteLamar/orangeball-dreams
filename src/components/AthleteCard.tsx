"use client";

import Link from "next/link";
import PlayerImage from "@/components/PlayerImage";
import { useLocale } from "@/app/[locale]/I18nProvider";

export type Athlete = {
  slug: string;
  name: string;
  position: string;
  nationality: string;
  team?: string;
  available: boolean;
  gender: "men" | "women";
  photo?: string;
};

export default function AthleteCard({ athlete }: { athlete: Athlete }) {
  const locale = useLocale();
  const isES = locale === "es";
  const isPT = locale === "pt";

  const team = athlete.team || "Free Agent";

  const texts = {
    player: isES ? "Jugador" : isPT ? "Jogador" : "Player",
    available: isES ? "Disponible" : isPT ? "Disponível" : "Available",
    unavailable: "—",
    viewProfile: isES ? "Ver perfil" : isPT ? "Ver perfil" : "View profile",
    profileNote: isES
      ? "Perfil disponible para consulta."
      : isPT
        ? "Perfil disponível para consulta."
        : "Profile available for review.",
  };

  return (
    <article className="client-card card shadow-soft hover-lift h-100 overflow-hidden">
      <Link
        href={`/${locale}/athletes/${athlete.slug}`}
        className="client-card-photo-link"
      >
        <div className="client-card-photo">
          <PlayerImage src={athlete.photo} alt={athlete.name} />
        </div>
      </Link>

      <div className="card-body p-3">
        <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
          <div>
            <h3 className="h6 fw-bold mb-1">{athlete.name}</h3>

            <div className="small-muted">
              {team} · {athlete.position || "—"}
            </div>
          </div>

          <span className="badge text-bg-light">{texts.player}</span>
        </div>

        <div className="d-flex flex-wrap gap-2 mb-3">
          <span className="badge text-bg-light">
            {athlete.nationality || "—"}
          </span>

          <span
            className={`badge ${
              athlete.available ? "text-bg-success" : "text-bg-secondary"
            }`}
          >
            {athlete.available ? texts.available : texts.unavailable}
          </span>
        </div>

        <div className="client-coach-note">{texts.profileNote}</div>
      </div>

      <div className="card-footer bg-white border-0 p-3 pt-0">
        <Link
          className="btn btn-dark w-100"
          href={`/${locale}/athletes/${athlete.slug}`}
        >
          {texts.viewProfile}
        </Link>
      </div>
    </article>
  );
}
