"use client";

import Link from "next/link";
import { useLocale } from "@/app/[locale]/I18nProvider";
import Image from "next/image";

export default function Navbar() {
  const locale = useLocale();
  const isES = locale === "es";

 
  const clientsLabel = isES ? "Clientes" : "Clients";
  const femaleLabel = isES ? "Femenino" : "Women";
  const maleLabel = isES ? "Masculino" : "Men";
  const coachesLabel = isES ? "Entrenadores" : "Coaches";
  const mediaLabel = isES ? "Media" : "Media";
  const newsLabel = isES ? "Noticias" : "News";
  const aboutLabel = isES ? "Agencia" : "About";
  const contactLabel = isES ? "Contacto" : "Contact";

  return (
    <nav className="navbar navbar-expand-lg navbar-agency sticky-top">
      <div className="container py-2">
        {/* Brand logo */}
        <Link
          className="navbar-brand brand-wrap d-flex align-items-center"
          href={`/${locale}`}
        >
          <Image
            src="/img/logo.png"
            alt="Orange Ball Dreams"
            width={180}
            height={180}
            priority
            className="brand-logo"
          />
        </Link>

        {/* Brand text */}
        <Link className="navbar-brand fw-bold" href={`/${locale}`}>
          <span style={{ color: "var(--accent)" }}>ORANGE BALL</span> DREAMS
        </Link>

        {/* Right icons */}
        <div className="d-flex align-items-center gap-2 order-lg-3 ms-auto ms-lg-0">
          <a
            className="btn btn-outline-dark icon-btn"
            href="https://www.instagram.com/orange_ball_dreams/?hl=en"
            target="_blank"
            rel="noreferrer"
            aria-label="Instagram"
          >
            <i className="bi bi-instagram" />
          </a>

          <Link
            className="btn btn-outline-dark icon-btn"
            href={`/${locale}/media`}
            aria-label="Media"
          >
            <i className="bi bi-youtube" />
          </Link>

          <div className="d-flex align-items-center gap-1 ms-2">
            <Link
              className={`lang-pill ${locale === "en" ? "active" : ""}`}
              href="/en"
            >
              EN
            </Link>

            <Link
              className={`lang-pill ${locale === "es" ? "active" : ""}`}
              href="/es"
            >
              ES
            </Link>
          </div>

          <button
            className="navbar-toggler ms-2"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#nav"
            aria-controls="nav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon" />
          </button>
        </div>

        {/* Menu */}
        <div className="collapse navbar-collapse" id="nav">
          <ul className="navbar-nav ms-auto mb-2 mb-lg-0 align-items-lg-center">
           
            <li className="nav-item orangeball-nav-dropdown">
              <Link
                className="nav-link orangeball-nav-trigger"
                href={`/${locale}/athletes`}
              >
                {clientsLabel}
                <span className="orangeball-nav-arrow">▾</span>
              </Link>

              <div className="orangeball-nav-menu">
                <Link href={`/${locale}/athletes#female-athletes`}>
                  {femaleLabel}
                </Link>

                <Link href={`/${locale}/athletes#male-athletes`}>
                  {maleLabel}
                </Link>

                <Link href={`/${locale}/athletes#coaches`}>{coachesLabel}</Link>
              </div>
            </li>

            <li className="nav-item">
              <Link className="nav-link" href={`/${locale}/media`}>
                {mediaLabel}
              </Link>
            </li>

            <li className="nav-item">
              <Link className="nav-link" href={`/${locale}/news`}>
                {newsLabel}
              </Link>
            </li>

            <li className="nav-item">
              <Link className="nav-link" href={`/${locale}/about`}>
                {aboutLabel}
              </Link>
            </li>

            <li className="nav-item">
              <Link className="nav-link" href={`/${locale}#contact`}>
                {contactLabel}
              </Link>
            </li>

            <li className="nav-item">
              <Link
                className="btn btn-dark btn-sm ms-lg-2"
                href={`/${locale}/admin`}
              >
                Admin
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
