import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function GamesPage() {
  return (
    <>
      <Navbar />
      <main className="container py-5">
        <h1 className="fw-bold">Jogos</h1>
        <p className="text-muted">
          (Placeholder) Aqui vai a lista de jogos e depois a ficha do jogo em /games/[id].
        </p>
      </main>
      <Footer />
    </>
  );
}
