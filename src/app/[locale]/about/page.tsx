"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useLocale } from "@/app/[locale]/I18nProvider";
import Image from "next/image";
import AgencyContactWidget from "@/components/AgencyContactWidget";

export default function AboutPage() {
  const locale = useLocale();
  const isES = locale === "es";

  return (
    <>
      <Navbar />

      {/* HERO */}
      <section className="section section--soft">
        <div className="container text-center">
          <h1 className="display-6 fw-bold title-accent">
            {isES
              ? "Representación basada en presencia y confianza"
              : "Representation built on presence and trust"}
          </h1>

          <p className="text-muted fs-5 mt-3 col-lg-8 mx-auto">
            {isES
              ? "En Orange Ball Dreams creemos que la verdadera representación significa estar presente — en los partidos, en las conversaciones y en cada etapa del camino del atleta."
              : "At Orange Ball Dreams, we believe that true representation means being present — at games, in conversations and in every step of an athlete’s journey."}
          </p>
        </div>
      </section>

      {/* FOUNDER SECTION */}
      <section className="section">
        <div className="container">
          <div className="row g-5 align-items-center">
            <div className="col-lg-6">
              <div className="card shadow-soft hover-lift overflow-hidden">
                <Image
                  src="/img/about/founder.png"
                  alt="Founder"
                  width={800}
                  height={800}
                  className="w-100 h-100"
                  style={{ objectFit: "cover" }}
                />
              </div>
            </div>

            <div className="col-lg-6">
              <h2 className="h4 fw-bold mb-3 title-accent">
                {isES ? "Los Fundadores" : "The Founders"}
              </h2>

              <p className="text-muted">
                {isES
                  ? "Orange Ball Dreams fue creada con una convicción clara: la representación real requiere proximidad."
                  : "Orange Ball Dreams was created with one core belief: real representation requires proximity."}
              </p>

              <p className="text-muted">
                {isES
                  ? "El fundador participa activamente en el desarrollo de cada atleta, asistiendo a partidos y manteniendo una comunicación constante."
                  : "The founder is personally involved in the development of each athlete, attending games and maintaining consistent communication."}
              </p>

              <p className="text-muted">
                {isES
                  ? "Más allá de contratos y negociaciones, la prioridad es entender al atleta como persona."
                  : "Beyond contracts and negotiations, the priority is understanding the athlete as a person."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PSYCHOLOGY SECTION */}
      <section className="section pt-0">
        <div className="container">
          <div className="row g-5 align-items-center">
            <div className="col-lg-4">
              <div
                className="card shadow-soft overflow-hidden mx-auto"
                style={{ maxWidth: "320px" }}
              >
                <Image
                  src="/img/about/miguel-sa.jpeg"
                  alt="Miguel Sá"
                  width={500}
                  height={700}
                  className="w-100"
                  style={{
                    height: "390px",
                    objectFit: "cover",
                    objectPosition: "center top",
                  }}
                />
              </div>
            </div>

            <div className="col-lg-8">
              <h2 className="h4 fw-bold mb-3 title-accent">
                {isES ? "Psicología Deportiva" : "Sports Psychology"}
              </h2>

              <p className="text-muted">
                {isES
                  ? "Miguel Sá es un psicólogo clínico y deportivo con más de 10 años de experiencia."
                  : "Miguel Sá is a clinical and sports psychologist with more than 10 years of experience."}
              </p>

              <p className="text-muted">
                {isES
                  ? "Después de completar el máster en Psicología Clínica y el posgrado en Psicología del Deporte y del Rendimiento, Miguel trabajó con atletas de muchos contextos deportivos, desde el fútbol hasta el baloncesto, el fútbol sala y el balonmano, además de clubes como el SL Benfica, el Sporting CP, el FC Famalicão y la Academia Rafa Nadal en España."
                  : "After completing his Master’s degree in Clinical Psychology and postgraduate studies in Sport and Performance Psychology, Miguel worked with athletes across several sporting contexts, from football to basketball, futsal and handball, including clubs such as SL Benfica, Sporting CP, FC Famalicão and the Rafa Nadal Academy in Spain."}
              </p>

              <p className="text-muted mb-0">
                {isES
                  ? "Actualmente, trabaja de forma individual con atletas y con empresas de representación de jugadores como colaborador estratégico en el área del trabajo mental y del rendimiento, construyendo relaciones de éxito y ayudando a los atletas a desarrollar carreras de excelencia."
                  : "Today, he works individually with athletes and with player representation companies as a strategic collaborator in mental performance and high achievement, building successful relationships and helping athletes develop careers of excellence."}
              </p>

              <div className="d-flex flex-wrap gap-2 mt-4">
                <a
                  href="https://teams.microsoft.com/l/chat/0/0?users=Miguelsapsychology@gmail.com"
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-outline-dark"
                >
                  {isES ? "Contactar a Miguel Sá" : "Contact Miguel Sá"}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* OUR APPROACH */}
      <section className="section section--soft">
        <div className="container">
          <h2 className="h4 fw-bold mb-4 text-center title-accent">
            {isES ? "Nuestra Forma de Trabajo" : "Our Approach"}
          </h2>

          <div className="row g-4">
            {[
              {
                title: isES ? "Presencia Personal" : "Personal Presence",
                text: isES
                  ? "Seguimos el rendimiento de cada atleta y estamos presentes en su día a día."
                  : "We follow every performance and stay close to the athlete’s daily reality.",
              },
              {
                title: isES ? "Visión a Largo Plazo" : "Long-Term Vision",
                text: isES
                  ? "Cada decisión se toma pensando en el futuro del atleta."
                  : "Every decision is made with the athlete’s future in mind.",
              },
              {
                title: isES
                  ? "Confianza y Transparencia"
                  : "Trust & Transparency",
                text: isES
                  ? "Comunicación clara y orientación honesta."
                  : "Clear communication and honest guidance.",
              },
              {
                title: isES
                  ? "Mentalidad Centrada en el Jugador"
                  : "Player-First Mentality",
                text: isES
                  ? "El atleta es siempre la prioridad, profesional y personalmente."
                  : "The athlete always comes first — professionally and personally.",
              },
            ].map((item, i) => (
              <div className="col-md-6 col-lg-3" key={i}>
                <div className="card shadow-soft hover-lift h-100">
                  <div className="card-body">
                    <h5 className="fw-bold">{item.title}</h5>
                    <p className="text-muted mb-0">{item.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <AgencyContactWidget />

      <Footer />
    </>
  );
}

