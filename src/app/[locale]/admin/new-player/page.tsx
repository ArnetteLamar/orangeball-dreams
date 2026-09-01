"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/app/[locale]/I18nProvider";

export default function NewPlayerPage() {
  const locale = useLocale();
  const router = useRouter();

  const [form, setForm] = useState({
    profile_type: "player",
    name: "",
    club: "",
    position: "",
    nationality: "",
    gender: "female",
    league: "",
    height_cm: "",
    photo: "",
    highlight_video: "",
    bio: "",
    instagram: "",
    youtube: "",
    agent_notes: "",
  });

  const [creating, setCreating] = useState(false);

  function updateForm(field: string, value: string) {
    setForm((current) => {
      if (field === "profile_type") {
        if (value === "coach") {
          return {
            ...current,
            profile_type: value,
            position: current.position || "Treinador",
            club: current.club || "Free",
            league: current.league || "Free Agent",
          };
        }

        return {
          ...current,
          profile_type: value,
          position: current.position === "Treinador" ? "" : current.position,
        };
      }

      return {
        ...current,
        [field]: value,
      };
    });
  }

  async function createPlayer() {
    if (!form.name.trim()) {
      alert("O nome é obrigatório.");
      return;
    }

    if (!form.position.trim()) {
      alert("A posição/função é obrigatória.");
      return;
    }

    if (!form.nationality.trim()) {
      alert("A nacionalidade é obrigatória.");
      return;
    }

    if (!form.gender.trim()) {
      alert("O género é obrigatório.");
      return;
    }

    if (!form.league.trim()) {
      alert("A liga é obrigatória. Para treinador sem equipa usa Free Agent.");
      return;
    }

    setCreating(true);

    try {
      const response = await fetch("/api/admin/players", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to create profile");
      }

      const result = await response.json();

      const generateResponse = await fetch("/api/admin/generate", {
        method: "POST",
      });

      if (!generateResponse.ok) {
        alert(
          "Perfil criado, mas o website não regenerou. Vai ao Admin e clica em Regenerar Website.",
        );
      }

      router.push(`/${locale}/admin/players/${result.slug}`);
    } catch (error) {
      alert(
        error instanceof Error
          ? `Erro ao criar perfil: ${error.message}`
          : "Erro ao criar perfil.",
      );
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <Navbar />

      <main className="container py-5">
        <div className="mb-4">
          <Link
            href={`/${locale}/admin`}
            className="btn btn-sm btn-outline-dark mb-3"
          >
            ← Voltar ao Admin
          </Link>

          <div>
            <span className="badge text-bg-dark mb-3">Create Profile</span>
          </div>

          <h1 className="fw-bold mb-2">Criar novo perfil</h1>

          <p className="text-muted mb-0">
            Cria atletas femininos, atletas masculinos ou treinadores
            diretamente no AI Engine.
          </p>
        </div>

        <div className="card shadow-soft">
          <div className="card-body p-4">
            <div className="row g-3">
              <AdminSelect
                label="Tipo de perfil"
                value={form.profile_type}
                onChange={(value) => updateForm("profile_type", value)}
                options={[
                  { value: "player", label: "Atleta" },
                  { value: "coach", label: "Treinador" },
                ]}
              />

              <AdminSelect
                label="Género"
                value={form.gender}
                onChange={(value) => updateForm("gender", value)}
                options={[
                  { value: "female", label: "Feminino" },
                  { value: "male", label: "Masculino" },
                ]}
              />

              <AdminInput
                label="Nome"
                value={form.name}
                onChange={(value) => updateForm("name", value)}
              />

              <AdminInput
                label="Clube"
                value={form.club}
                onChange={(value) => updateForm("club", value)}
                placeholder={
                  form.profile_type === "coach" ? "Free" : "Ex: SL Benfica"
                }
              />

              <AdminInput
                label={form.profile_type === "coach" ? "Função" : "Posição"}
                value={form.position}
                onChange={(value) => updateForm("position", value)}
                placeholder={
                  form.profile_type === "coach" ? "Treinador" : "Base, Poste..."
                }
              />

              <AdminInput
                label="Nacionalidade"
                value={form.nationality}
                onChange={(value) => updateForm("nationality", value)}
              />

              <AdminInput
                label="Liga"
                value={form.league}
                onChange={(value) => updateForm("league", value)}
                placeholder={
                  form.profile_type === "coach"
                    ? "Free Agent"
                    : "Ex: Liga Betclic"
                }
              />

              <AdminInput
                label="Altura em cm"
                value={form.height_cm}
                onChange={(value) => updateForm("height_cm", value)}
              />

              <AdminInput
                label="Foto"
                value={form.photo}
                onChange={(value) => updateForm("photo", value)}
                placeholder="/images/players/NOME.png"
              />

              <AdminInput
                label="Highlight Video"
                value={form.highlight_video}
                onChange={(value) => updateForm("highlight_video", value)}
                placeholder="YouTube link ou embed"
              />

              <AdminInput
                label="Instagram"
                value={form.instagram}
                onChange={(value) => updateForm("instagram", value)}
              />

              <AdminInput
                label="YouTube"
                value={form.youtube}
                onChange={(value) => updateForm("youtube", value)}
              />

              <AdminTextarea
                label="Bio"
                value={form.bio}
                onChange={(value) => updateForm("bio", value)}
              />

              <AdminTextarea
                label={
                  form.profile_type === "coach"
                    ? "Experiência / notas técnicas"
                    : "Agent notes"
                }
                value={form.agent_notes}
                onChange={(value) => updateForm("agent_notes", value)}
              />
            </div>

            <div className="mt-4">
              <button
                className="btn btn-dark"
                onClick={createPlayer}
                disabled={creating}
              >
                {creating ? "A criar..." : "Criar perfil"}
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

function AdminInput({
  label,
  value,
  onChange,
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="col-md-6">
      <label className="form-label small-muted">{label}</label>
      <input
        className="form-control"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function AdminSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="col-md-6">
      <label className="form-label small-muted">{label}</label>
      <select
        className="form-select"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function AdminTextarea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="col-12">
      <label className="form-label small-muted">{label}</label>
      <textarea
        className="form-control"
        rows={4}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
