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

export default function Home() {
  const t = useT();
  const locale = useLocale();
  const isES = locale === "es";

  const [players, setPlayers] = useState<HomePlayer[]>([]);

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

  const diego = players.find((player) => player.slug === "diego-niebla");
  const tunde = players.find((player) => player.slug === "tunde-olumuyiwa");
  const antonio = players.find((player) => player.slug === "antonio-moreira");
  const joana = players.find((player) => player.slug === "joana-soeiro");

  const homeNews: HomeNewsItem[] = [
    {
      id: "diego-seleccion-espanola",
      date: "2026-08-28",
      category: isES ? "Selección" : "National Team",
      title: isES
        ? "Diego Niebla entra en el radar de la selección absoluta española"
        : "Diego Niebla enters the Spanish senior national team radar",
      summary: isES
        ? "El joven perfil español gana protagonismo en el seguimiento internacional."
        : "The young Spanish profile gains visibility in international monitoring.",
      image: "/images/news/diego-niebla-marca.webp",
      href: "https://www.marca.com/baloncesto/seleccion/2026/08/25/asi-diego-niebla-perla-chus-mateo-anadido-seleccion.html",
      source: "Marca",
    },
    {
      id: "pablo-mera-real-madrid-debut",
      date: "2026-08-30",
      category: isES ? "Real Madrid" : "Real Madrid",
      title: isES
        ? "Pablo Mera rompe el techo del primer equipo del Real Madrid"
        : "Pablo Mera breaks through into Real Madrid’s first team",
      summary: isES
        ? "Con solo 16 años, Pablo Mera debutó como titular con el primer equipo del Real Madrid en el amistoso frente al Río Breogán, firmando una actuación con minutos, puntos, asistencias y rebotes."
        : "At just 16 years old, Pablo Mera made his first-team Real Madrid debut as a starter in the friendly against Río Breogán, delivering a confident performance with minutes, points, assists and rebounds.",
      image: "/images/news/pablo-mera-debut.webp",
      href: "https://www.lavozdegalicia.es/noticia/deportes/2026/08/30/ferrolano-pablo-mera-debuta-rompe-techo-primer-equipo-real-madrid/00031788079611889216727.htm",
      source: "La Voz de Galicia",
    },
    {
      id: "daily-scouting-radar",
      date: "2026-08-26",
      category: "Scouting",
      title: isES
        ? "Radar diario: rendimiento, mercado y señales de oportunidad"
        : "Daily radar: performance, market and opportunity signals",
      summary: isES
        ? "Una lectura diaria de perfiles, movimientos y contexto competitivo."
        : "A daily read on profiles, movement and competitive context.",
      image: antonio?.photo,
      href: `/${locale}/news`,
      source: "OBD Intelligence",
    },
    {
      id: "player-pathways",
      date: "2026-08-25",
      category: isES ? "Historias" : "Stories",
      title: isES
        ? "Más que estadísticas: las historias detrás de cada trayectoria"
        : "More than stats: the stories behind every player pathway",
      summary: isES
        ? "Orange Ball Dreams une datos, carrera, contexto humano y narrativa deportiva."
        : "Orange Ball Dreams connects data, career context, human support and sports storytelling.",
      image: joana?.photo,
      href: `/${locale}/about`,
      source: "Orange Ball Dreams",
    },
    {
      id: "market-update",
      date: "2026-08-24",
      category: isES ? "Mercado" : "Market",
      title: isES
        ? "El mercado europeo sigue abriendo espacio para perfiles versátiles"
        : "The European market keeps opening space for versatile profiles",
      summary: isES
        ? "La versatilidad, la lectura del juego y el contexto competitivo ganan peso."
        : "Versatility, game understanding and competitive context are gaining weight.",
      image: diego?.photo,
      href: `/${locale}/news`,
      source: "OBD Market",
    },
    {
      id: "performance-context",
      date: "2026-08-23",
      category: isES ? "Rendimiento" : "Performance",
      title: isES
        ? "El contexto importa: cómo leer números, rol y evolución de un jugador"
        : "Context matters: reading numbers, role and player evolution",
      summary: isES
        ? "Los datos ganan valor cuando se cruzan con rol, equipo, liga y momento competitivo."
        : "Data becomes more valuable when connected with role, team, league and competitive timing.",
      image: tunde?.photo,
      href: `/${locale}/news`,
      source: "OBD Analysis",
    },
  ];

const latestHomeNews = [...homeNews]
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  .slice(0, 6);

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
