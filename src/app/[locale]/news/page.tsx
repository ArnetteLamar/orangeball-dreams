"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { news } from "@/lib/data";
import { useLocale } from "@/app/[locale]/I18nProvider";

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}|${mm}|${yyyy}`;
}

export default function NewsPage() {
  const locale = useLocale();

  return (
    <>
      <Navbar />

      <section className="section section--soft">
        <div className="container">
          <h1 className="h3 fw-bold mb-1 title-accent">
            {locale === "es" ? "Noticias" : "Agency News"}
          </h1>
        </div>
      </section>

      <main className="container section">
        <div className="card shadow-soft hover-lift">
          <div className="list-group list-group-flush">
            {news.map((n) => (
              <Link
                key={n.slug}
                className="list-group-item list-group-item-action"
                href={`/${locale}/news/${n.slug}`}
              >
                <div className="small-muted">{formatDate(n.date)}</div>
                <div className="fw-semibold">{n.title}</div>
                <div className="text-muted">{n.excerpt}</div>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
