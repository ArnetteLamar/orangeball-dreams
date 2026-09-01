"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import PlayerImage from "@/components/PlayerImage";
import { useLocale } from "@/app/[locale]/I18nProvider";
import {
  formatStat,
  getPlayers,
  searchPlayers,
  type PlayerIndexItem,
} from "@/lib/players";

type ClientItem = PlayerIndexItem & {
  profile_type?: string;
  gender?: string;
  category?: string;
};

type ClientSection = {
  key: string;
  title: string;
  subtitle: string;
  clients: ClientItem[];
};

export default function AthletesPage() {
  const locale = useLocale();
  const isES = locale === "es";
  const isPT = locale === "pt";

  const [players, setPlayers] = useState<PlayerIndexItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const texts = {
    pageTitle: isES
      ? "Nuestros Clientes"
      : isPT
        ? "Os Nossos Clientes"
        : "Our Clients",
    pageSubtitle: isES
      ? "Atletas y entrenadores acompañados por Orange Ball Dreams."
      : isPT
        ? "Atletas e treinadores acompanhados pela Orange Ball Dreams."
        : "Athletes and coaches supported by Orange Ball Dreams.",
    searchPlaceholder: isES
      ? "Buscar cliente..."
      : isPT
        ? "Procurar cliente..."
        : "Search client...",
    loading: isES
      ? "Cargando clientes..."
      : isPT
        ? "A carregar clientes..."
        : "Loading clients...",
    error: isES
      ? "No fue posible cargar los clientes generados."
      : isPT
        ? "Não foi possível carregar os clientes gerados."
        : "It was not possible to load the generated clients.",
    noResults: isES
      ? "No se encontraron clientes."
      : isPT
        ? "Não foram encontrados clientes."
        : "No clients found.",
    femaleTitle: isES
      ? "Atletas Femeninas"
      : isPT
        ? "Atletas Femininas"
        : "Female Athletes",
    maleTitle: isES
      ? "Atletas Masculinos"
      : isPT
        ? "Atletas Masculinos"
        : "Male Athletes",
    coachesTitle: isES ? "Entrenadores" : isPT ? "Treinadores" : "Coaches",
    representedPlayers: isES
      ? "Jugadoras representadas"
      : isPT
        ? "Jogadoras representadas"
        : "Represented players",
    representedMalePlayers: isES
      ? "Jugadores representados"
      : isPT
        ? "Jogadores representados"
        : "Represented players",
    representedCoaches: isES
      ? "Perfiles técnicos representados"
      : isPT
        ? "Perfis técnicos representados"
        : "Represented coaching profiles",
    profiles: isES ? "perfiles" : isPT ? "perfis" : "profiles",
    profile: isES ? "perfil" : isPT ? "perfil" : "profile",
    viewProfile: isES ? "Ver perfil" : isPT ? "Ver perfil" : "View profile",
    freeAgent: "Free Agent",
    coachingProfile: isES
      ? "Perfil técnico disponible para consulta."
      : isPT
        ? "Perfil técnico disponível para consulta."
        : "Coaching profile available for review.",
    clients: isES ? "clientes" : isPT ? "clientes" : "clients",
    all: isES ? "Todos" : isPT ? "Todos" : "All",
  };

  useEffect(() => {
    let isMounted = true;

    getPlayers()
      .then((data) => {
        if (isMounted) {
          setPlayers(data);
          setError(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError(true);
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
  }, []);

  const filtered = useMemo(() => {
    return searchPlayers(players, search) as ClientItem[];
  }, [players, search]);

  const sections = useMemo<ClientSection[]>(() => {
    const femaleAthletes: ClientItem[] = [];
    const maleAthletes: ClientItem[] = [];
    const coaches: ClientItem[] = [];

    filtered.forEach((client) => {
      if (isCoachProfile(client)) {
        coaches.push(client);
        return;
      }

      if (isMaleProfile(client)) {
        maleAthletes.push(client);
        return;
      }

      if (isFemaleProfile(client)) {
        femaleAthletes.push(client);
        return;
      }

      femaleAthletes.push(client);
    });

    return [
      {
        key: "female-athletes",
        title: texts.femaleTitle,
        subtitle: texts.representedPlayers,
        clients: sortClientsByName(femaleAthletes),
      },
      {
        key: "male-athletes",
        title: texts.maleTitle,
        subtitle: texts.representedMalePlayers,
        clients: sortClientsByName(maleAthletes),
      },
      {
        key: "coaches",
        title: texts.coachesTitle,
        subtitle: texts.representedCoaches,
        clients: sortClientsByName(coaches),
      },
    ];
  }, [
    filtered,
    texts.femaleTitle,
    texts.maleTitle,
    texts.coachesTitle,
    texts.representedPlayers,
    texts.representedMalePlayers,
    texts.representedCoaches,
  ]);

  const femaleCount =
    sections.find((section) => section.key === "female-athletes")?.clients
      .length || 0;

  const maleCount =
    sections.find((section) => section.key === "male-athletes")?.clients
      .length || 0;

  const coachesCount =
    sections.find((section) => section.key === "coaches")?.clients.length || 0;

  return (
    <>
      <Navbar />

      <main className="clients-premium-page">
       
        <section className="section clients-hero-section">
          <div className="container">
            <div className="row g-4 align-items-end">
              <div className="col-lg-7">
                <span className="badge text-bg-dark mb-3">
                  Orange Ball Dreams
                </span>

                <h1 className="display-5 fw-bold mb-3">{texts.pageTitle}</h1>

                <p className="fs-5 mb-0 clients-hero-text">
                  {texts.pageSubtitle}
                </p>
              </div>

              <div className="col-lg-5">
                <div className="clients-search-card">
                  <label className="form-label small-muted mb-2">
                    {texts.searchPlaceholder}
                  </label>

                  <input
                    className="form-control form-control-lg"
                    placeholder={texts.searchPlaceholder}
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />

                  <div className="d-flex flex-wrap gap-2 mt-3">
                    <a className="client-filter-pill" href="#female-athletes">
                      {texts.femaleTitle} · {femaleCount}
                    </a>

                    <a className="client-filter-pill" href="#male-athletes">
                      {texts.maleTitle} · {maleCount}
                    </a>

                    <a className="client-filter-pill" href="#coaches">
                      {texts.coachesTitle} · {coachesCount}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="row g-3 mt-4">
              <SummaryCard
                label={texts.femaleTitle}
                value={femaleCount}
                href="#female-athletes"
              />

              <SummaryCard
                label={texts.maleTitle}
                value={maleCount}
                href="#male-athletes"
              />

              <SummaryCard
                label={texts.coachesTitle}
                value={coachesCount}
                href="#coaches"
              />

              <SummaryCard
                label={texts.all}
                value={filtered.length}
                href="#clients-list"
              />
            </div>
          </div>
        </section>

        <section id="clients-list" className="section clients-list-section">
          <div className="container">
            {loading ? (
              <div className="text-center text-muted">{texts.loading}</div>
            ) : null}

            {error ? (
              <div className="alert alert-warning">{texts.error}</div>
            ) : null}

            {!loading && !error && filtered.length === 0 ? (
              <div className="card shadow-soft">
                <div className="card-body p-4 text-center text-muted">
                  {texts.noResults}
                </div>
              </div>
            ) : null}

            {!loading && !error && filtered.length > 0 ? (
              <div className="d-flex flex-column gap-5">
                {sections.map((section) =>
                  section.clients.length > 0 ? (
                    <ClientGroup
                      key={section.key}
                      sectionId={section.key}
                      title={section.title}
                      subtitle={section.subtitle}
                      clients={section.clients}
                      locale={locale}
                      texts={texts}
                    />
                  ) : null,
                )}
              </div>
            ) : null}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

function SummaryCard({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href: string;
}) {
  return (
    <div className="col-6 col-lg-3">
      <a href={href} className="client-summary-card">
        <div className="client-summary-value">{value}</div>
        <div className="client-summary-label">{label}</div>
      </a>
    </div>
  );
}

function ClientGroup({
  sectionId,
  title,
  subtitle,
  clients,
  locale,
  texts,
}: {
  sectionId: string;
  title: string;
  subtitle: string;
  clients: ClientItem[];
  locale: string;
  texts: {
    profile: string;
    profiles: string;
    viewProfile: string;
    freeAgent: string;
    coachingProfile: string;
  };
}) {
  return (
    <section id={sectionId} className="clients-section">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end gap-2 mb-4">
        <div>
          <h2 className="h4 fw-bold mb-1 title-accent">{title}</h2>

          <div className="small-muted">
            {clients.length}{" "}
            {clients.length === 1 ? texts.profile : texts.profiles} · {subtitle}
          </div>
        </div>
      </div>

      <div className="row g-4">
        {clients.map((client) => (
          <div className="col-12 col-sm-6 col-lg-4 col-xl-3" key={client.slug}>
            <ClientCard client={client} locale={locale} texts={texts} />
          </div>
        ))}
      </div>
    </section>
  );
}

function ClientCard({
  client,
  locale,
  texts,
}: {
  client: ClientItem;
  locale: string;
  texts: {
    viewProfile: string;
    freeAgent: string;
    coachingProfile: string;
  };
}) {
  const isCoach = isCoachProfile(client);
  const club = client.club || texts.freeAgent;
  const position = client.position || "—";
  const nationality = client.nationality || "—";

  return (
    <article className="client-card card shadow-soft hover-lift h-100 overflow-hidden">
      <Link
        href={`/${locale}/athletes/${client.slug}`}
        className="client-card-photo-link"
      >
        <div className="client-card-photo">
          <PlayerImage src={client.photo} alt={client.name} />
        </div>
      </Link>

      <div className="card-body p-3">
        <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
          <div>
            <h3 className="h6 fw-bold mb-1">{client.name}</h3>

            <div className="small-muted">
              {club} · {position}
            </div>
          </div>

          {isCoach ? (
            <span className="badge text-bg-dark">Coach</span>
          ) : (
            <span className="badge text-bg-light">Player</span>
          )}
        </div>

        <div className="d-flex flex-wrap gap-2 mb-3">
          <span className="badge text-bg-light">{nationality}</span>

          {client.league ? (
            <span className="badge text-bg-light">{client.league}</span>
          ) : null}
        </div>

        {!isCoach ? (
          <div className="row g-2">
            <MiniStat label="PPG" value={client.averages?.ppg ?? 0} />
            <MiniStat label="RPG" value={client.averages?.rpg ?? 0} />
            <MiniStat label="APG" value={client.averages?.apg ?? 0} />
          </div>
        ) : (
          <div className="client-coach-note">{texts.coachingProfile}</div>
        )}
      </div>

      <div className="card-footer bg-white border-0 p-3 pt-0">
        <Link
          className="btn btn-dark w-100"
          href={`/${locale}/athletes/${client.slug}`}
        >
          {texts.viewProfile}
        </Link>
      </div>
    </article>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="col-4">
      <div className="client-mini-stat">
        <div className="fw-bold">{formatStat(value)}</div>
        <div className="small-muted">{label}</div>
      </div>
    </div>
  );
}

function sortClientsByName(clients: ClientItem[]) {
  return [...clients].sort((a, b) => a.name.localeCompare(b.name));
}

function normalizeValue(value?: string | null) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function isCoachProfile(client: ClientItem) {
  const profileType = normalizeValue(client.profile_type || client.category);
  const position = normalizeValue(client.position);

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

function isMaleProfile(client: ClientItem) {
  const gender = normalizeValue(client.gender);

  return (
    gender === "male" ||
    gender === "men" ||
    gender === "man" ||
    gender === "m" ||
    gender === "masculino" ||
    gender === "masculina" ||
    gender === "homem"
  );
}

function isFemaleProfile(client: ClientItem) {
  const gender = normalizeValue(client.gender);

  return (
    gender === "female" ||
    gender === "women" ||
    gender === "woman" ||
    gender === "f" ||
    gender === "feminino" ||
    gender === "feminina" ||
    gender === "mulher"
  );
}
