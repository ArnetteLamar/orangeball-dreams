"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { useEffect, useState } from "react";

type Player = {
  slug: string;
  name: string;
  club: string;
  position: string;
  nationality: string;
  photo: string;
};

export default function AthletesPage() {
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    fetch("/generated/players/index.json")
      .then((res) => res.json())
      .then((data) => setPlayers(data));
  }, []);

  return (
    <>
      <Navbar />

      <section className="section section--soft">
        <div className="container">
          <span className="badge text-bg-dark mb-3">
            Oragenball Dreams
          </span>

          <h1 className="display-6 fw-bold mb-3">Featured Athletes</h1>

          <p className="text-muted fs-5 col-lg-8">
            Explore player profiles powered by the Oragenball AI Engine.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="row g-4">
            {players.map((player) => (
              <div className="col-md-6 col-lg-4" key={player.slug}>
                <div className="card shadow-soft hover-lift h-100 overflow-hidden">
                  <div
                    style={{
                      height: 280,
                      background: "linear-gradient(135deg, #111, #333)",
                    }}
                  >
                    <img
                      src={player.photo}
                      alt={player.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>

                  <div className="card-body p-4">
                    <h2 className="h5 fw-bold mb-2">{player.name}</h2>

                    <div className="small-muted mb-3">
                      {player.club} • {player.position}
                    </div>

                    <span className="badge text-bg-light">
                      {player.nationality}
                    </span>
                  </div>

                  <div className="card-footer bg-white border-0 p-4 pt-0">
                    <Link
                      className="btn btn-dark w-100"
                      href={`/en/athletes/${player.slug}`}
                    >
                      View Profile
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}