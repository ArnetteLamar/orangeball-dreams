"use client";

import Link from "next/link";
import { useLocale } from "@/app/[locale]/I18nProvider";
import Image from "next/image";
import { useState } from "react";

export default function Navbar() {
  const locale = useLocale();
  const isES = locale === "es";
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const clientsLabel = isES ? "Clientes" : "Clients";
  const femaleLabel = isES ? "Femenino" : "Women";
  const maleLabel = isES ? "Masculino" : "Men";
  const coachesLabel = isES ? "Entrenadores" : "Coaches";
  const mediaLabel = "Media";
  const newsLabel = isES ? "Noticias" : "News";
  const aboutLabel = isES ? "Agencia" : "About";
  const contactLabel = isES ? "Contacto" : "Contact";

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <nav className="navbar navbar-expand-lg navbar-agency sticky-top">
      <div className="container py-2">
        <Link
          className="navbar-brand brand-wrap d-flex align-items-center"
          href={`/${locale}`}
          onClick={closeMenu}
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

        <Link
          className="navbar-brand fw-bold brand-text"
          href={`/${locale}`}
          onClick={closeMenu}
        >
          <span style={{ color: "var(--accent)" }}>ORANGE BALL</span> DREAMS
        </Link>

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
            onClick={closeMenu}
          >
            <i className="bi bi-youtube" />
          </Link>

          <div className="d-flex align-items-center gap-1 ms-2">
            <Link
              className={`lang-pill ${locale === "en" ? "active" : ""}`}
              href="/en"
              onClick={closeMenu}
            >
              EN
            </Link>

            <Link
              className={`lang-pill ${locale === "es" ? "active" : ""}`}
              href="/es"
              onClick={closeMenu}
            >
              ES
            </Link>
          </div>

          <button
            className="navbar-toggler ms-2"
            type="button"
            aria-controls="nav"
            aria-expanded={isMenuOpen}
            aria-label="Toggle navigation"
            onClick={() => setIsMenuOpen((value) => !value)}
          >
            <span className="navbar-toggler-icon" />
          </button>
        </div>

        <div
          className={`collapse navbar-collapse ${isMenuOpen ? "show" : ""}`}
          id="nav"
        >
          <ul className="navbar-nav ms-auto mb-2 mb-lg-0 align-items-lg-center">
            <li className="nav-item orangeball-nav-dropdown">
              <Link
                className="nav-link orangeball-nav-trigger"
                href={`/${locale}/athletes`}
                onClick={closeMenu}
              >
                {clientsLabel}
                <span className="orangeball-nav-arrow">▾</span>
              </Link>

              <div className="orangeball-nav-menu">
                <Link
                  href={`/${locale}/athletes#female-athletes`}
                  onClick={closeMenu}
                >
                  {femaleLabel}
                </Link>

                <Link
                  href={`/${locale}/athletes#male-athletes`}
                  onClick={closeMenu}
                >
                  {maleLabel}
                </Link>

                <Link href={`/${locale}/athletes#coaches`} onClick={closeMenu}>
                  {coachesLabel}
                </Link>
              </div>
            </li>

            <li className="nav-item">
              <Link
                className="nav-link"
                href={`/${locale}/media`}
                onClick={closeMenu}
              >
                {mediaLabel}
              </Link>
            </li>

            <li className="nav-item">
              <Link
                className="nav-link"
                href={`/${locale}/news`}
                onClick={closeMenu}
              >
                {newsLabel}
              </Link>
            </li>

            <li className="nav-item">
              <Link
                className="nav-link"
                href={`/${locale}/about`}
                onClick={closeMenu}
              >
                {aboutLabel}
              </Link>
            </li>

            <li className="nav-item">
              <Link
                className="nav-link"
                href={`/${locale}#contact`}
                onClick={closeMenu}
              >
                {contactLabel}
              </Link>
            </li>

           
          </ul>
        </div>
      </div>
    </nav>
  );
}
