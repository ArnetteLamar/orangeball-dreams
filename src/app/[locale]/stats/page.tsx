"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useEffect, useState } from "react";
import { useLocale } from "@/app/[locale]/I18nProvider";
import {
  formatGeneratedDate,
  formatNumber,
  getLatestReport,
  type RankingItem,
  type StatsReport,
} from "@/lib/reports";

export default function StatsPage() {
  const locale = useLocale();
  const isES = locale === "es";

  const [report, setReport] = useState<StatsReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    getLatestReport()
      .then((data) => {
        if (!isMounted) return;

        setReport(data);
        setError(false);
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

  return (
    <>
      <Navbar />

      <section className="section hero-premium">
        <div className="container">
          <span className="badge text-bg-dark mb-3">
            Orangeball Dreams Intelligence
          </span>

          <h1 className="display-5 fw-bold mb-3">
            {isES ? "Motor de Estadísticas" : "Statistics Engine"}
          </h1>

          <p className="fs-5 text-muted mb-0">
            {isES
              ? "Informes generados automáticamente a partir del AI Engine."
              : "Automatically generated reports from the AI Engine."}
          </p>
        </div>
      </section>

      <main className="container section">
        {loading ? (
          <div className="text-center text-muted">
            {isES ? "Cargando informe..." : "Loading report..."}
          </div>
        ) : null}

        {error ? (
          <div className="alert alert-warning">
            {isES
              ? "No fue posible cargar los informes generados."
              : "It was not possible to load the generated reports."}
          </div>
        ) : null}

        {!loading && !error && !report ? (
          <div className="alert alert-light border">
            {isES
              ? "Todavía no existen informes generados."
              : "No generated reports exist yet."}
          </div>
        ) : null}

        {!loading && !error && report ? (
          <>
            <section className="mb-5">
              <div className="card shadow-soft">
                <div className="card-body p-4 p-lg-5">
                  <div className="d-flex flex-column flex-lg-row justify-content-between gap-3 mb-4">
                    <div>
                      <h2 className="h3 fw-bold mb-2">{report.title}</h2>

                      <div className="small-muted">
                        {report.competition} • {report.season} • {report.round}
                      </div>
                    </div>

                    {report.generated_at ? (
                      <div className="small-muted text-lg-end">
                        {isES ? "Generado:" : "Generated:"}
                        <br />
                        {formatGeneratedDate(report.generated_at)}
                      </div>
                    ) : null}
                  </div>

                  <p className="fs-5 text-muted mb-0">{report.summary}</p>
                </div>
              </div>
            </section>

            <section className="row g-4 mb-5">
              <div className="col-lg-6">
                <div className="card shadow-soft h-100">
                  <div className="card-body p-4">
                    <h3 className="h5 fw-bold mb-3">
                      {isES ? "Mejor Anotador" : "Best Scorer"}
                    </h3>

                    <div className="display-6 fw-bold">
                      {report.best_scorer.player}
                    </div>

                    <div className="small-muted mb-3">
                      {report.best_scorer.team}
                      {report.best_scorer.opponent
                        ? ` vs ${report.best_scorer.opponent}`
                        : ""}
                    </div>

                    <div className="main-stat-card">
                      <div className="main-stat-value">
                        {formatNumber(report.best_scorer.points)}
                      </div>
                      <div className="main-stat-label">PTS</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-lg-6">
                <div className="card shadow-soft h-100">
                  <div className="card-body p-4">
                    <h3 className="h5 fw-bold mb-3">
                      {isES ? "Jugador Más Completo" : "Most Complete Player"}
                    </h3>

                    <div className="display-6 fw-bold">
                      {report.most_complete.player}
                    </div>

                    <div className="small-muted mb-3">
                      {report.most_complete.team}
                    </div>

                    <div className="main-stat-card">
                      <div className="main-stat-value">
                        {formatNumber(report.most_complete.performance_index)}
                      </div>
                      <div className="main-stat-label">OBD Index</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="row g-4">
              <RankingCard
                title={isES ? "Top Puntos" : "Top Points"}
                items={report.top_points}
                valueKey="points"
                label="PTS"
              />

              <RankingCard
                title={isES ? "Top Rebotes" : "Top Rebounds"}
                items={report.top_rebounds}
                valueKey="rebounds"
                label="REB"
              />

              <RankingCard
                title={isES ? "Top Asistencias" : "Top Assists"}
                items={report.top_assists}
                valueKey="assists"
                label="AST"
              />

              <RankingCard
                title={isES ? "Top Rendimiento" : "Top Performance"}
                items={report.top_performance}
                valueKey="performance_index"
                label="OBD"
              />
            </section>
          </>
        ) : null}
      </main>

      <Footer />
    </>
  );
}

function RankingCard({
  title,
  items,
  valueKey,
  label,
}: {
  title: string;
  items: RankingItem[];
  valueKey: keyof RankingItem;
  label: string;
}) {
  return (
    <div className="col-lg-6">
      <div className="card shadow-soft h-100">
        <div className="card-body p-4">
          <h3 className="h5 fw-bold mb-4 title-accent">{title}</h3>

          <div className="d-flex flex-column gap-3">
            {items.map((item, index) => {
              const value = item[valueKey];

              return (
                <div
                  className="d-flex justify-content-between align-items-center border-bottom pb-3"
                  key={`${item.player}-${index}`}
                >
                  <div>
                    <div className="fw-bold">
                      {index + 1}. {item.player}
                    </div>

                    <div className="small-muted">
                      {item.team} • vs {item.opponent}
                    </div>
                  </div>

                  <div className="text-end">
                    <div className="fw-bold">
                      {formatNumber(
                        typeof value === "number" ? value : undefined,
                      )}
                    </div>

                    <div className="small-muted">{label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
