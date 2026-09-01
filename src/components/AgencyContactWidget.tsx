"use client";

import { useState } from "react";
import { useLocale } from "@/app/[locale]/I18nProvider";

const AGENCY_TEAMS_EMAIL = "Luchofer11@hotmail.com ";
const PSYCHOLOGY_TEAMS_EMAIL = "miguel@email.com";

type ContactTopic = "representation" | "psychology" | "club" | "other";

export default function AgencyContactWidget() {
  const locale = useLocale();
  const isES = locale === "es";
  const [isOpen, setIsOpen] = useState(false);
  const [topic, setTopic] = useState<ContactTopic>("representation");

  const selectedEmail =
    topic === "psychology" ? PSYCHOLOGY_TEAMS_EMAIL : AGENCY_TEAMS_EMAIL;

  const teamsUrl = `https://teams.microsoft.com/l/chat/0/0?users=${encodeURIComponent(
    selectedEmail,
  )}`;

  const topics = [
    {
      value: "representation",
      label: isES ? "Representación de atleta" : "Athlete representation",
    },
    {
      value: "psychology",
      label: isES ? "Psicología deportiva" : "Sports psychology",
    },
    {
      value: "club",
      label: isES ? "Club / entrenador" : "Club / coach",
    },
    {
      value: "other",
      label: isES ? "Otro contacto" : "Other contact",
    },
  ] as const;

  return (
    <div
      style={{
        position: "fixed",
        right: 20,
        bottom: 20,
        zIndex: 9999,
      }}
    >
      {isOpen ? (
        <div
          className="card shadow-soft border-0"
          style={{
            width: "320px",
            maxWidth: "calc(100vw - 40px)",
            borderRadius: "18px",
            overflow: "hidden",
          }}
        >
          <div className="card-body p-4">
            <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
              <div>
                <h3 className="h6 fw-bold mb-1">
                  {isES ? "Contactar con Orangeball" : "Contact Orangeball"}
                </h3>

                <p className="small text-muted mb-0">
                  {isES
                    ? "Elige el motivo del contacto y abre una conversación directa."
                    : "Choose the reason for contact and start a direct conversation."}
                </p>
              </div>

              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setIsOpen(false)}
                aria-label={isES ? "Cerrar" : "Close"}
              >
                ×
              </button>
            </div>

            <div className="d-flex flex-column gap-2 mb-3">
              {topics.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  className={`btn btn-sm text-start ${
                    topic === item.value ? "btn-dark" : "btn-outline-dark"
                  }`}
                  onClick={() => setTopic(item.value)}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <a
              href={teamsUrl}
              target="_blank"
              rel="noreferrer"
              className="btn btn-dark w-100"
            >
              {isES ? "Abrir conversación en Teams" : "Open Teams chat"}
            </a>

            <p className="small text-muted mt-3 mb-0">
              {isES
                ? "Responderemos lo antes posible."
                : "We will reply as soon as possible."}
            </p>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="btn btn-dark shadow-soft"
          onClick={() => setIsOpen(true)}
          style={{
            borderRadius: "999px",
            padding: "12px 18px",
            fontWeight: 700,
          }}
        >
          💬 {isES ? "Contactar agencia" : "Contact agency"}
        </button>
      )}
    </div>
  );
}
