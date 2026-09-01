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

export default function NewsDetail({ params }: { params: { slug: string } }) {
  const locale = useLocale();
  const item = news.find((n) => n.slug === params.slug);

  if (!item) {
    return (
      <>
        <Navbar />
        <main className="container section">
          <h1 className="h4 fw-bold">News not found</h1>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />

      <section className="section section--soft">
        <div className="container">
          <div className="small-muted mb-2">{formatDate(item.date)}</div>
          <h1 className="h3 fw-bold title-accent">{item.title}</h1>
          <p className="text-muted mt-3">{item.excerpt}</p>
        </div>
      </section>

      <Footer />
    </>
  );
}
