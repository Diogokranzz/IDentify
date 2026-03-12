"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type AuditLog = {
  id: string;
  action: string;
  ip?: string | null;
  createdAt: string;
  admin: {
    email: string;
    name: string;
  };
};

export default function AuditoriaPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("identifyToken");
    if (!stored) {
      router.replace("/admin/login");
      return;
    }
    setToken(stored);
  }, [router]);

  useEffect(() => {
    if (!token) return;
    loadLogs();
  }, [token]);

  async function loadLogs() {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(`${API_URL}/admin/audit?limit=80`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 401) {
        localStorage.removeItem("identifyToken");
        router.replace("/admin/login");
        return;
      }
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Falha ao carregar auditoria");
      }
      setLogs(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen px-6 py-20">
      <div className="absolute inset-0 -z-10">
        <span className="orb orb-a" />
        <span className="orb orb-b" />
        <span className="orb orb-c" />
      </div>

      <section className="glass-card mx-auto flex w-full max-w-5xl flex-col gap-8 p-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[color:var(--accent)]">
              Auditoria
            </p>
            <h1 className="mt-3 text-3xl font-semibold">Logs administrativos</h1>
            <p className="mt-2 text-sm text-[color:var(--ink-soft)]">
              Monitoramento de acessos, alterações e bloqueios.
            </p>
          </div>
          <Link
            href="/admin/painel"
            className="rounded-full border border-white/60 px-4 py-2 text-xs font-semibold"
          >
            Voltar
          </Link>
        </header>

        {loading ? (
          <div className="rounded-3xl border border-white/60 bg-white/50 p-6 text-sm text-[color:var(--ink-soft)]">
            Carregando logs...
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-white/60 bg-white/50 p-6 text-sm text-red-600">
            {error}
          </div>
        ) : (
          <div className="grid gap-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className="rounded-3xl border border-white/60 bg-white/60 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">{log.action}</p>
                    <p className="text-xs text-[color:var(--ink-soft)]">
                      {log.admin.name} • {log.admin.email}
                    </p>
                  </div>
                  <div className="text-right text-xs text-[color:var(--ink-soft)]">
                    <p>{new Date(log.createdAt).toLocaleString("pt-BR")}</p>
                    <p>{log.ip || "IP não registrado"}</p>
                  </div>
                </div>
              </div>
            ))}
            {!logs.length ? (
              <div className="rounded-3xl border border-white/60 bg-white/50 p-6 text-sm text-[color:var(--ink-soft)]">
                Nenhum log encontrado.
              </div>
            ) : null}
          </div>
        )}
      </section>
    </main>
  );
}
