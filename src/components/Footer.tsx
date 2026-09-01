"use client";

import Link from "next/link";
import { useLocale } from "@/app/[locale]/I18nProvider";

export default function Footer() {
  const locale = useLocale();
  const year = new Date().getFullYear();

  return (
    <footer className="footer-agency">
      <div className="container py-5">
        {/* Top Row */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-4">
          {/* Brand */}
          <div className="fw-bold fs-5">
            <span style={{ color: "var(--accent)" }}>ORANGE BALL </span> DREAMS
          </div>

          {/* Links */}
          <div className="d-flex flex-wrap gap-4">
            <Link className="footer-link" href={`/${locale}/athletes`}>
              Our Clients
            </Link>
            <Link className="footer-link" href={`/${locale}/news`}>
              Agency News
            </Link>
            <Link className="footer-link" href={`/${locale}/about`}>
              About
            </Link>
            <Link className="footer-link" href={`/${locale}/contact`}>
              Contact
            </Link>
          </div>

          {/* Social */}
          <div className="d-flex gap-2">
            <a className="btn btn-outline-dark icon-btn" href="#">
              <i className="bi bi-instagram" />
            </a>
            <a className="btn btn-outline-dark icon-btn" href="#">
              <i className="bi bi-twitter-x" />
            </a>
            <a className="btn btn-outline-dark icon-btn" href="#">
              <i className="bi bi-youtube" />
            </a>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-4 pt-3 border-top footer-muted text-center text-md-start">
          © {year} Orange Ball Dreams  | All rights reserved | Designed by Arnette Hallman
        </div>
      </div>
    </footer>
  );
}
