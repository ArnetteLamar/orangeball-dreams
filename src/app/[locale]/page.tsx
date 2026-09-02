"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useLocale, useT } from "./I18nProvider";
import { mediaVideos } from "@/lib/media";

const featuredSlugs = [
  "tunde-olumuyiwa",
  "diego-niebla",
  "antonio-moreira",
  "angelo-alexandre",
  "arnette-hallman",
  "jose-balderas",
];

type HomePlayer = {
  slug: string;
  name: string;
  position?: string;
  nationality?: string;
  photo?: string;
  profile_type?: string;
  gender?: string;
};

type HomeNewsItem = {
  id: string;
  date: string;
  category: string;
  title: string;
  summary: string;
  image?: string;
  href?: string;
  source?: string;
};
type LocalizedText =
  | string
  | {
      es?: string;
      en?: string;
    };

type RawHomeNewsItem = {
  id: string;
  date: string;
  category: LocalizedText;
  title: LocalizedText;
  summary: LocalizedText;
  image?: string;
  player_slug?: string;
  href?: string;
  source?: string;
  homepage?: boolean;
};

export default function Home() {
  const t = useT();
  const locale = useLocale();
  const isES = locale === "es";

  const [players, setPlayers] = useState<HomePlayer[]>([]);
  const [rawHomeNews, setRawHomeNews] = useState<RawHomeNewsItem[]>([]);

  useEffect(() => {
    async function loadPlayers() {
      try {
        const response = await fetch("/generated/players/index.json");

        if (!response.ok) {
          throw new Error("Could not load players index");
        }

        const data = await response.json();

        const loadedPlayers = Array.isArray(data)
          ? data
          : data.players || data.data || [];

        setPlayers(loadedPlayers);
      } catch (error) {
        console.error("Homepage players load error:", error);
        setPlayers([]);
      }
    }

    loadPlayers();
  }, []);

  useEffect(() => {
    async function loadHomeNews() {
      try {
        const response = await fetch("/generated/news/home.json");

        if (!response.ok) {
          throw new Error("Could not load home news");
        }

        const data = await response.json();

        setRawHomeNews(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Homepage news load error:", error);
        setRawHomeNews([]);
      }
    }

    loadHomeNews();
  }, []);

  const featuredAthletes = useMemo(() => {
    const selected = featuredSlugs
      .map((featuredSlug) =>
        players.find((player) => player.slug === featuredSlug),
      )
      .filter(Boolean) as HomePlayer[];

    const remaining = players.filter(
      (player) => !featuredSlugs.includes(player.slug),
    );

    return [...selected, ...remaining].slice(0, 6);
  }, [players]);

  const heroAthletes = featuredAthletes.slice(0, 4);

  const latestHomeNews: HomeNewsItem[] = useMemo(() => {
    return rawHomeNews
      .map((item) => {
        const playerPhoto = item.player_slug
          ? players.find((player) => player.slug === item.player_slug)?.photo
          : undefined;

        return {
          id: item.id,
          date: item.date,
          category: localizeNewsField(item.category, isES),
          title: localizeNewsField(item.title, isES),
          summary: localizeNewsField(item.summary, isES),
          image: item.image || playerPhoto,
          href: resolveNewsHref(item.href, locale),
          source: item.source,
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 6);
  }, [rawHomeNews, players, isES, locale]);



const homeVideos = mediaVideos
  .filter((video) => video.featuredOnHome)
  .slice(0, 4);
 
 return (
   <>
     <Navbar />

     <main className="home-premium-page">
       {/* HERO */}
       <section className="section home-hero-block">
         <div className="container">
           <div className="row align-items-center g-5">
             <div className="col-lg-6">
               <div className="d-inline-flex align-items-center gap-2 mb-3">
                 <span className="badge text-bg-dark">Orange Ball Dreams</span>

                 <span className="badge home-accent-badge">
                   {t("home.tag")}
                 </span>
               </div>

               <h1 className="display-6 fw-bold lh-1">{t("home.title")}</h1>

               <p className="fs-5 mt-3 col-lg-11">{t("home.subtitle")}</p>

               <div className="d-flex flex-wrap gap-2 mt-4">
                 <Link className="btn btn-dark" href={`/${locale}/athletes`}>
                   {t("home.ctaClients")}
                 </Link>

                 <Link className="btn btn-accent" href={`/${locale}/news`}>
                   {t("home.ctaNews")}
                 </Link>
               </div>

               <div className="d-flex flex-wrap gap-4 mt-4">
                 <div>
                   <div className="h4 fw-bold mb-0">{players.length}</div>
                   <div className="small-muted">
                     {isES ? "Perfiles" : "Profiles"}
                   </div>
                 </div>

                 <div>
                   <div className="h4 fw-bold mb-0">EN / ES</div>
                   <div className="small-muted">
                     {isES ? "Idiomas" : "Languages"}
                   </div>
                 </div>

                 <div>
                   <div className="h4 fw-bold mb-0">360º</div>
                   <div className="small-muted">
                     {isES ? "Acompañamiento" : "Support"}
                   </div>
                 </div>
               </div>
             </div>

             <div className="col-lg-6">
               <div className="row g-3">
                 {heroAthletes.map((athlete, index) => {
                   const photo = athlete.photo || "";

                   return (
                     <div
                       className={index === 0 ? "col-12" : "col-4"}
                       key={athlete.slug}
                     >
                       <Link
                         href={`/${locale}/athletes/${athlete.slug}`}
                         className="text-decoration-none text-dark"
                       >
                         <div className="card home-hero-card hover-lift overflow-hidden h-100">
                           <div
                             className={`home-card-photo ${
                               index === 0
                                 ? "home-card-photo--main"
                                 : "home-card-photo--small"
                             }`}
                             style={{
                               height: index === 0 ? 220 : 105,
                             }}
                           >
                             <HomeAthletePhoto
                               src={photo}
                               alt={athlete.name}
                               priority={index === 0}
                             />
                           </div>

                           {index === 0 ? (
                             <div className="card-body">
                               <div className="fw-bold">{athlete.name}</div>

                               <div className="small-muted">
                                 {athlete.position || "—"} •{" "}
                                 {athlete.nationality || "—"}
                               </div>
                             </div>
                           ) : null}
                         </div>
                       </Link>
                     </div>
                   );
                 })}
               </div>
             </div>
           </div>
         </div>
       </section>

       {/* LATEST NEWS */}
       <section className="section home-content-block home-news-journal-section">
         <div className="container">
           <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end gap-3 mb-4">
             <div>
               <span className="badge home-accent-badge mb-2">
                 {isES ? "Actualidad" : "Latest News"}
               </span>

               <h2 className="h4 fw-bold mb-1 title-accent">
                 {isES ? "Noticias destacadas" : "Featured News"}
               </h2>

               <div className="small-muted">
                 {isES
                   ? "Las noticias más recientes sobre jugadores, selecciones, mercado y scouting."
                   : "The latest stories on players, national teams, market movement and scouting."}
               </div>
             </div>

             <Link
               className="btn btn-outline-dark btn-sm"
               href={`/${locale}/news`}
             >
               {isES ? "Ver todas" : "View all"}
             </Link>
           </div>

           <div className="home-news-grid">
             {latestHomeNews.map((item) => (
               <Link
                 key={item.id}
                 href={item.href || `/${locale}/news`}
                 className="home-news-row text-decoration-none"
                 target={item.href?.startsWith("http") ? "_blank" : undefined}
                 rel={item.href?.startsWith("http") ? "noreferrer" : undefined}
               >
                 <div className="home-news-thumb">
                   {item.image ? (
                     <Image
                       src={item.image}
                       alt={item.title}
                       fill
                       sizes="(max-width: 768px) 100vw, 340px"
                       style={{
                         objectFit: "cover",
                         objectPosition: "center",
                       }}
                     />
                   ) : (
                     <div className="home-news-thumb-placeholder" />
                   )}
                 </div>

                 <div className="home-news-content">
                   <div className="d-flex flex-wrap gap-2 mb-2">
                     <span className="badge text-bg-dark">{item.category}</span>

                     {item.source ? (
                       <span className="badge text-bg-light">
                         {item.source}
                       </span>
                     ) : null}

                     <span className="badge text-bg-light">{item.date}</span>
                   </div>

                   <h3>{item.title}</h3>

                   <p>{item.summary}</p>
                 </div>
               </Link>
             ))}
           </div>
         </div>
       </section>

       {/* FEATURED ATHLETES */}
       <section className="section home-content-block">
         <div className="container">
           <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end gap-3 mb-4">
             <div>
               <h2 className="h4 fw-bold mb-1 title-accent">
                 {isES ? "Atletas Destacados" : "Featured Athletes"}
               </h2>

               <div className="small-muted">
                 {isES
                   ? "Jugadores y entrenadores acompañados por Orange Ball Dreams"
                   : "Players and coaches supported by Orange Ball Dreams"}
               </div>
             </div>

             <Link
               className="btn btn-outline-dark btn-sm"
               href={`/${locale}/athletes`}
             >
               {isES ? "Ver todos" : "View all"}
             </Link>
           </div>

           <div className="row g-3">
             {featuredAthletes.map((athlete) => {
               const photo = athlete.photo || "";

               return (
                 <div className="col-sm-6 col-lg-4" key={athlete.slug}>
                   <div className="card shadow-soft hover-lift h-100 overflow-hidden">
                     <Link
                       href={`/${locale}/athletes/${athlete.slug}`}
                       className="text-decoration-none text-dark"
                     >
                       <div
                         className="home-card-photo home-card-photo--featured"
                         style={{
                           height: 145,
                         }}
                       >
                         <HomeAthletePhoto src={photo} alt={athlete.name} />
                       </div>

                       <div className="card-body">
                         <div className="fw-bold mb-1">{athlete.name}</div>

                         <div className="small-muted">
                           {athlete.position || "—"} •{" "}
                           {athlete.nationality || "—"}
                         </div>
                       </div>
                     </Link>

                     <div className="card-footer bg-white border-top-0">
                       <Link
                         className="btn btn-outline-dark btn-sm w-100"
                         href={`/${locale}/athletes/${athlete.slug}`}
                       >
                         {isES ? "Ver perfil" : "View profile"}
                       </Link>
                     </div>
                   </div>
                 </div>
               );
             })}
           </div>
         </div>
       </section>

       

       {/* AGENCY NEWS + CONTACT */}
       <section id="contact" className="section home-content-block">
         <div className="container">
           <div className="row g-4 align-items-stretch">
             <div className="col-lg-5">
               <div className="card shadow-soft h-100 premium-agency-card">
                 <div className="card-body p-4">
                   <span className="badge home-accent-badge mb-3">
                     {isES ? "Agency News" : "Agency News"}
                   </span>

                   <h2 className="h4 fw-bold mb-3 title-accent">
                     {isES
                       ? "Orangeball Dreams está tomando forma"
                       : "Orangeball Dreams is taking shape"}
                   </h2>

                   <div className="agency-simple-list">
                     {[
                       {
                         d: "01|09|2026",
                         t: isES
                           ? "Primera versión pública en preparación"
                           : "First public preview in preparation",
                       },
                       {
                         d: "30|08|2026",
                         t: isES
                           ? "Noticias y perfiles conectados en la homepage"
                           : "News and profiles connected on the homepage",
                       },
                       {
                         d: "25|08|2026",
                         t: isES
                           ? "Media, scouting y representación en un solo ecosistema"
                           : "Media, scouting and representation in one ecosystem",
                       },
                     ].map((item) => (
                       <div className="agency-simple-item" key={item.d}>
                         <div className="small-muted">{item.d}</div>
                         <div className="fw-semibold">{item.t}</div>
                       </div>
                     ))}
                   </div>
                 </div>
               </div>
             </div>

             <div className="col-lg-7">
               <div className="card shadow-soft h-100 premium-contact-card">
                 <div className="card-body p-4 p-lg-5">
                   <span className="badge text-bg-dark mb-3">
                     {isES ? "Contact" : "Contact"}
                   </span>

                   <h2 className="h3 fw-bold mb-3">
                     {isES
                       ? "¿Te interesa la plataforma?"
                       : "Interested in the platform?"}
                   </h2>

                   <p className="text-muted mb-4">
                     {isES
                       ? "Para representación, oportunidades con clubes, scouting o feedback sobre Orangeball Dreams, puedes contactar directamente."
                       : "For representation, club opportunities, scouting or feedback about Orangeball Dreams, you can contact us directly."}
                   </p>

                   <div className="contact-options-grid">
                     <a
                       className="contact-option-card"
                       href="mailto:luchofer11@hotmail.com?subject=Orangeball%20Dreams"
                     >
                       <span className="contact-option-label">
                         {isES ? "Agencia" : "Agency"}
                       </span>

                       <strong>luchofer11@hotmail.com</strong>

                       <span className="contact-option-action">
                         {isES ? "Enviar email" : "Send email"}
                       </span>
                     </a>

                     <a
                       className="contact-option-card"
                       href="mailto:arnettehallman@gmail.com?subject=Orangeball%20Dreams%20Feedback"
                     >
                       <span className="contact-option-label">
                         {isES ? "Feedback plataforma" : "Platform feedback"}
                       </span>

                       <strong>arnettehallman@gmail.com</strong>

                       <span className="contact-option-action">
                         {isES ? "Enviar feedback" : "Send feedback"}
                       </span>
                     </a>
                   </div>

                   <div className="mt-4">
                     <Link className="btn btn-dark" href={`/${locale}/about`}>
                       {isES ? "Sobre la agencia" : "About the agency"}
                     </Link>
                   </div>
                 </div>
               </div>
             </div>
           </div>
         </div>
       </section>

       {/* VIDEO GALLERY */}
       {/* VIDEO GALLERY */}
       <section id="home-video-gallery" className="section home-content-block">
         <div className="container">
           <div className="d-flex justify-content-between align-items-end mb-3">
             <div>
               <span className="badge home-accent-badge mb-2">
                 {isES ? "Media" : "Media"}
               </span>

               <h2 className="h4 fw-bold mb-1 title-accent">
                 {isES ? "Galería de Vídeo" : "Video Gallery"}
               </h2>

               <div className="small-muted">
                 {isES
                   ? "Highlights, entrevistas y contenido de la plataforma."
                   : "Highlights, interviews and platform content."}
               </div>
             </div>

             <Link
               className="btn btn-outline-dark btn-sm"
               href={`/${locale}/media`}
             >
               {isES ? "Ver media" : "View media"}
             </Link>
           </div>

           <div className="row g-3">
             {homeVideos.map((video) => {
               const title = isES ? video.title.es : video.title.en;
               const description = isES
                 ? video.description.es
                 : video.description.en;

               const hasRealVideo =
                 video.videoUrl && !video.videoUrl.includes("VIDEO_ID_AQUI");

               return (
                 <div className="col-md-6 col-lg-4" key={video.id}>
                   <article className="card shadow-soft hover-lift h-100 overflow-hidden">
                     <div
                       className="ratio ratio-16x9"
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

                     <div className="card-body">
                       <div className="d-flex flex-wrap gap-2 mb-2">
                         <span className="badge text-bg-dark">
                           {video.category}
                         </span>
                       </div>

                       <h3 className="h6 fw-bold mb-2">{title}</h3>

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

function HomeAthletePhoto({
  src,
  alt,
  priority = false,
}: {
  src: string;
  alt: string;
  priority?: boolean;
}) {
  if (!src) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          backgroundImage: 'url("/images/backgrounds/orangeball-hero-bg.png")',
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
    );
  }

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        zIndex: 2,
      }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes="(max-width: 768px) 100vw, 33vw"
        style={{
          objectFit: "contain",
          objectPosition: "center center",
        }}
      />
    </div>
  );
}

