import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

export default function GamePage({ params }: { params: { id: string } }) {
  return (
    <>
      <Navbar />
      <main className="container py-5">
        <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
          <h1 className="fw-bold mb-0">Jogo #{params.id}</h1>
          <Link className="btn btn-outline-dark btn-sm" href="/games">
            ← Todos
          </Link>
        </div>
        <p className="text-muted">(Placeholder) Ficha do jogo, equipas, resultado e stats por atleta.</p>
      </main>
      <Footer />
    </>
  );
}
