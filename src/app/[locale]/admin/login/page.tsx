"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/app/[locale]/I18nProvider";

export default function AdminLoginPage() {
  const locale = useLocale();
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        setError("Password incorreta.");
        return;
      }

      router.push(`/${locale}/admin`);
      router.refresh();
    } catch {
      setError("Erro ao fazer login.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div
        className="card shadow-soft border-0"
        style={{ width: "100%", maxWidth: 420 }}
      >
        <div className="card-body p-4 p-md-5">
          <div className="badge text-bg-dark mb-3">Admin Login</div>

          <h1 className="h3 fw-bold mb-2">Orangeball Dreams</h1>

          <p className="text-muted mb-4">Área privada de administração.</p>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-control"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoFocus
              />
            </div>

            {error ? (
              <div className="alert alert-danger py-2">{error}</div>
            ) : null}

            <button
              type="submit"
              className="btn btn-dark w-100"
              disabled={loading}
            >
              {loading ? "A entrar..." : "Entrar no Admin"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
