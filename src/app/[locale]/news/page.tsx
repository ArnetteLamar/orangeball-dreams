"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useLocale } from "@/app/[locale]/I18nProvider";

type LocalizedText =
  | string
  | {
      es?: string;
      en?: string;
    };

type RawNewsItem = {
  id: string;
  date: string;
  category: LocalizedText;
  title: LocalizedText;
  summary: LocalizedText;
  image?: string;
  href?: string;
  source?: string;
  homepage?: boolean;
};

type NewsItem = {
  id: string;
  date: string;
  category: string;
  title: string;
  summary: string;
  image?: string;
  href?: string;
  source?: string;
};

export default function NewsPage() {
  const locale = useLocale();
  const isES = locale === "es";

  const [rawNews, setRawNews] = useState<RawNewsItem[]>([]);

  useEffect(() => {
    async function loadNews() {
      try {
        const response = await fetch("/generated/news/home.json");

        if (!response.ok) {
          throw new Error("Could not load news");
        }

        const data = await response.json();

        setRawNews(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("News page load error:", error);
        setRawNews([]);
      }
    }

    loadNews();
  }, []);

  const news = useMemo<NewsItem[]>(() => {
    return rawNews
      .map((item) => ({
        id: item.id,
        date: item.date,
        category: localizeNewsField(item.category, isES),
        title: localizeNewsField(item.title, isES),
        summary: localizeNewsField(item.summary, isES),
        image: item.image,
        href: resolveNewsHref(item.href, locale),
        source: item.source,
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [rawNews, isES, locale]);

  return (
    <>
      <Navbar />

      <main className="news-premium-page">
        <section className="section news-hero-section">
          <div className="container">
            <span className="badge home-accent-badge mb-3">
              {isES ? "Actualidad" : "Latest News"}
            </span>

            <h1 className="display-5 fw-bold mb-3">
              {isES ? "Noticias Orangeball Dreams" : "Orangeball Dreams News"}
            </h1>

            <p className="fs-5 news-hero-text mb-0">
              {isES
                ? "Noticias, scouting, mercado, perfiles y señales relevantes alrededor de los atletas y entrenadores acompañados por Orangeball Dreams."
                : "News, scouting, market movement, profiles and relevant signals around the athletes and coaches supported by Orangeball Dreams."}
            </p>
          </div>
        </section>

        <section className="section news-list-section">
          <div className="container">
            <div className="row g-4">
              {news.map((item) => (
                <div className="col-lg-6" key={item.id}>
                  <article className="card shadow-soft hover-lift h-100 overflow-hidden news-page-card">
                    <Link
                      href={item.href || `/${locale}/news`}
                      target={
                        item.href?.startsWith("http") ? "_blank" : undefined
                      }
                      rel={
                        item.href?.startsWith("http") ? "noreferrer" : undefined
                      }
                      className="text-decoration-none text-dark"
                    >
                      <div className="news-page-thumb">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.title}
                            fill
                            sizes="(max-width: 991px) 100vw, 50vw"
                            style={{
                              objectFit: "cover",
                              objectPosition: "center",
                            }}
                          />
                        ) : (
                          <div className="news-page-thumb-placeholder" />
                        )}
                      </div>

                      <div className="card-body p-4">
                        <div className="d-flex flex-wrap gap-2 mb-3">
                          <span className="badge text-bg-dark">
                            {item.category}
                          </span>

                          {item.source ? (
                            <span className="badge text-bg-light">
                              {item.source}
                            </span>
                          ) : null}

                          <span className="badge text-bg-light">
                            {item.date}
                          </span>
                        </div>

                        <h2 className="h5 fw-bold mb-2">{item.title}</h2>

                        <p className="small-muted mb-0">{item.summary}</p>
                      </div>
                    </Link>
                  </article>
                </div>
              ))}
            </div>

            {news.length === 0 ? (
              <div className="card shadow-soft p-4">
                <h2 className="h5 fw-bold mb-2">
                  {isES ? "Sin noticias disponibles" : "No news available"}
                </h2>

                <p className="small-muted mb-0">
                  {isES
                    ? "Las noticias aparecerán aquí cuando el sistema genere contenido."
                    : "News will appear here when the system generates content."}
                </p>
              </div>
            ) : null}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

function localizeNewsField(value: LocalizedText, isES: boolean) {
  if (typeof value === "string") {
    return value;
  }

  return isES ? value.es || value.en || "" : value.en || value.es || "";
}

function resolveNewsHref(href: string | undefined, locale: string) {
  if (!href) {
    return `/${locale}/news`;
  }

  if (href.startsWith("/")) {
    return href.replace("{locale}", locale);
  }

  return href;
}
