"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useEffect, useState } from "react";

type PlayerData = {
  slug: string;
  name: string;
  club: string;
  position: string;
  nationality: string;
  photo: string;
  highlight_video: string;
  summary: string;
  averages: {
    games_played: number;
    ppg: number;
    rpg: number;
    apg: number;
    spg: number;
    bpg: number;
    mpg: number;
    performance_index: number;
  };
  latest_game: {
    competition: string;
    season: string;
    round: string;
    opponent: string;
    points: number;
    rebounds: number;
    assists: number;
    steals: number;
    blocks: number;
    minutes: number;
    performance_index: number;
  };
};

export default function PlayerPage() {
  const [player, setPlayer] = useState<PlayerData | null>(null);

  useEffect(() => {
    fetch("/generated/players/arnette-hallman.json")
      .then((res) => res.json())
      .then((data) => setPlayer(data));
  }, []);

  if (!player) {
    return (
      <>
        <Navbar />
        <section className="section section--soft">
          <div className="container">A carregar jogador...</div>
        </section>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />

      <section className="section player-hero">
        <div className="container">
          <div className="row g-4 align-items-center">
            <div className="col-lg-5">
              <div className="player-photo-card">
                <img src={player.photo} alt={player.name} />
              </div>
            </div>

            <div className="col-lg-7">
              <span className="badge text-bg-dark mb-3">
                Oragenball Player Profile
              </span>

              <h1 className="display-4 fw-bold mb-3">{player.name}</h1>

              <div className="d-flex flex-wrap gap-2 mb-4">
                <span className="badge text-bg-light">{player.club}</span>
                <span className="badge text-bg-light">{player.position}</span>
                <span className="badge text-bg-light">{player.nationality}</span>
              </div>

              <p className="fs-5 text-muted">{player.summary}</p>

              <div className="row g-3 mt-4">
                <MainStat label="PPG" value={player.averages.ppg} />
                <MainStat label="RPG" value={player.averages.rpg} />
                <MainStat label="APG" value={player.averages.apg} />
                <MainStat label="OBD Index" value={player.averages.performance_index} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="row g-4">
            <div className="col-lg-7">
              <div className="card shadow-soft h-100">
                <div className="card-body p-4">
                  <h2 className="h4 fw-bold mb-3 title-accent">Latest Game</h2>

                  <p className="small-muted mb-2">
                    {player.latest_game.competition} • {player.latest_game.season} •{" "}
                    {player.latest_game.round}
                  </p>

                  <h3 className="h5 fw-bold mb-4">
                    vs {player.latest_game.opponent}
                  </h3>

                  <div className="row g-3">
                    <StatCard label="PTS" value={player.latest_game.points} />
                    <StatCard label="REB" value={player.latest_game.rebounds} />
                    <StatCard label="AST" value={player.latest_game.assists} />
                    <StatCard label="STL" value={player.latest_game.steals} />
                    <StatCard label="BLK" value={player.latest_game.blocks} />
                    <StatCard label="MIN" value={player.latest_game.minutes} />
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-5">
              <div className="card shadow-soft h-100 overflow-hidden">
                <div className="ratio ratio-16x9 bg-dark">
                  <iframe
                    src={player.highlight_video}
                    title={`${player.name} highlights`}
                    allowFullScreen
                  />
                </div>
                <div className="card-body p-4">
                  <h2 className="h5 fw-bold mb-1">Highlight Video</h2>
                  <p className="small-muted mb-0">
                    Main player showcase video.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--soft">
        <div className="container">
          <h2 className="h4 fw-bold mb-4 title-accent">AI Generated News</h2>

          <div className="card shadow-soft">
            <div className="card-body p-4">
              <span className="badge text-bg-dark mb-3">Coming soon</span>
              <h3 className="h5 fw-bold">
                Automatic player news will appear here.
              </h3>
              <p className="text-muted mb-0">
                The AI Engine will use game stats to generate player updates,
                match reports and performance highlights.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}

function MainStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="col-6 col-md-3">
      <div className="main-stat-card">
        <div className="main-stat-value">{value}</div>
        <div className="main-stat-label">{label}</div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="col-6 col-md-4">
      <div className="card shadow-soft h-100">
        <div className="card-body text-center p-3">
          <div className="display-6 fw-bold">{value}</div>
          <div className="small-muted">{label}</div>
        </div>
      </div>
    </div>
  );
}