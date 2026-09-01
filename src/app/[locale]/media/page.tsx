"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { useLocale } from "@/app/[locale]/I18nProvider";
import { mediaVideos } from "@/lib/media";

export default function MediaPage() {
  const locale = useLocale();
  const isES = locale === "es";

  return (
    <>
      <Navbar />

      <main className="media-premium-page">
        <section className="section media-hero-section">
          <div className="container">
            <span className="badge home-accent-badge mb-3">Media</span>

            <h1 className="display-5 fw-bold mb-3">
              {isES ? "Galería de vídeo" : "Video Gallery"}
            </h1>

            <p className="fs-5 media-hero-text mb-4">
              {isES
                ? "Highlights, entrevistas, contenido de presentación y vídeos que ayudan a contar mejor la historia de cada atleta."
                : "Highlights, interviews, presentation content and videos that help tell each athlete’s story better."}
            </p>

            <div className="d-flex flex-wrap gap-2">
              <Link className="btn btn-dark" href={`/${locale}/athletes`}>
                {isES ? "Ver perfiles" : "View profiles"}
              </Link>

              <Link className="btn btn-outline-light" href={`/${locale}/about`}>
                {isES ? "Sobre la agencia" : "About the agency"}
              </Link>
            </div>
          </div>
        </section>

        <section className="section media-list-section">
          <div className="container">
            <div className="row g-4">
              {mediaVideos.map((video) => {
                const title = isES ? video.title.es : video.title.en;
                const description = isES
                  ? video.description.es
                  : video.description.en;

                const hasRealVideo =
                  video.videoUrl && !video.videoUrl.includes("VIDEO_ID_AQUI");

                return (
                  <div className="col-md-6 col-xl-4" key={video.id}>
                    <article className="card shadow-soft hover-lift h-100 overflow-hidden media-video-card">
                      <div
                        className="ratio ratio-16x9 media-video-frame"
                        style={{
                          background:
                            "linear-gradient(135deg, #111 0%, #333 55%, var(--accent) 100%)",
                        }}
                      >
                        {hasRealVideo ? (
                          <iframe
                            src={video.videoUrl}
                            title={title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        ) : (
                          <div className="d-flex align-items-center justify-content-center text-white text-center px-3">
                            <div>
                              <div className="fw-bold">
                                {isES
                                  ? "Vídeo próximamente"
                                  : "Video coming soon"}
                              </div>

                              <div className="small opacity-75">
                                {video.category}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="card-body p-4">
                        <span className="badge text-bg-dark mb-3">
                          {video.category}
                        </span>

                        <h2 className="h5 fw-bold mb-2">{title}</h2>

                        <p className="small-muted mb-0">{description}</p>
                      </div>
                    </article>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
