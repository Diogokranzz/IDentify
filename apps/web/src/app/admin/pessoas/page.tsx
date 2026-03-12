"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type Person = {
  id: string;
  name: string;
  block: string;
  area: string;
  status: "active" | "blocked";
  photoUrl?: string | null;
  createdAt: string;
};

type FormState = {
  name: string;
  block: string;
  area: string;
  status: "active" | "blocked";
  photoUrl: string;
};

const emptyForm: FormState = {
  name: "",
  block: "",
  area: "",
  status: "active",
  photoUrl: "",
};

export default function PessoasPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [records, setRecords] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>(emptyForm);

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
    loadPersons();
  }, [token]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return records;
    return records.filter(
      (person) =>
        person.name.toLowerCase().includes(q) ||
        person.area.toLowerCase().includes(q) ||
        person.block.toLowerCase().includes(q)
    );
  }, [records, query]);

  async function loadPersons() {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(`${API_URL}/persons`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 401) {
        localStorage.removeItem("identifyToken");
        router.replace("/admin/login");
        return;
      }
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Falha ao carregar cadastros");
      }
      const data = await response.json();
      setRecords(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  function handleFormChange(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const payload = {
        name: form.name,
        block: form.block,
        area: form.area,
        status: form.status,
        photoUrl: form.photoUrl || undefined,
      };
      const response = await fetch(`${API_URL}/persons`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Falha ao criar cadastro");
      }
      setRecords((prev) => [data.data, ...prev]);
      setForm(emptyForm);
      setMessage("Cadastro criado com sucesso.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(person: Person) {
    setEditingId(person.id);
    setEditForm({
      name: person.name,
      block: person.block,
      area: person.area,
      status: person.status,
      photoUrl: person.photoUrl || "",
    });
  }

  async function saveEdit(personId: string) {
    if (!token) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`${API_URL}/persons/${personId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editForm.name,
          block: editForm.block,
          area: editForm.area,
          status: editForm.status,
          photoUrl: editForm.photoUrl || null,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Falha ao atualizar cadastro");
      }
      setRecords((prev) => prev.map((p) => (p.id === personId ? data.data : p)));
      setEditingId(null);
      setMessage("Cadastro atualizado.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(person: Person) {
    if (!token) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const nextStatus = person.status === "active" ? "blocked" : "active";
      const response = await fetch(`${API_URL}/persons/${person.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Falha ao atualizar status");
      }
      setRecords((prev) => prev.map((p) => (p.id === person.id ? data.data : p)));
      setMessage("Status atualizado.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setSaving(false);
    }
  }

  async function removePerson(person: Person) {
    if (!token) return;
    if (!confirm(`Excluir ${person.name}?`)) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`${API_URL}/persons/${person.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Falha ao excluir cadastro");
      }
      setRecords((prev) => prev.filter((p) => p.id !== person.id));
      setMessage("Cadastro removido.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="relative min-h-screen px-6 py-20">
      <div className="absolute inset-0 -z-10">
        <span className="orb orb-a" />
        <span className="orb orb-b" />
        <span className="orb orb-c" />
      </div>

      <section className="glass-card mx-auto flex w-full max-w-6xl flex-col gap-8 p-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[color:var(--accent)]">
              Cadastros
            </p>
            <h1 className="mt-3 text-3xl font-semibold">Gerenciar pessoas</h1>
            <p className="mt-2 text-sm text-[color:var(--ink-soft)]">
              Controle blocos, áreas e status dos acessos.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin/painel"
              className="rounded-full border border-white/60 px-4 py-2 text-xs font-semibold"
            >
              Voltar
            </Link>
            <Link
              href="/admin/faces"
              className="rounded-full border border-white/60 px-4 py-2 text-xs font-semibold"
            >
              Cadastro facial
            </Link>
          </div>
        </header>

        <form
          className="grid gap-4 rounded-3xl border border-white/60 bg-white/60 p-6 lg:grid-cols-[1.2fr_0.4fr_0.6fr_0.5fr_0.8fr]"
          onSubmit={handleCreate}
        >
          <input
            className="rounded-2xl border border-white/70 bg-white/70 px-4 py-3 text-sm"
            placeholder="Nome completo"
            value={form.name}
            onChange={(event) => handleFormChange("name", event.target.value)}
            required
          />
          <input
            className="rounded-2xl border border-white/70 bg-white/70 px-4 py-3 text-sm"
            placeholder="Bloco"
            value={form.block}
            onChange={(event) => handleFormChange("block", event.target.value)}
            required
          />
          <input
            className="rounded-2xl border border-white/70 bg-white/70 px-4 py-3 text-sm"
            placeholder="Área"
            value={form.area}
            onChange={(event) => handleFormChange("area", event.target.value)}
            required
          />
          <select
            className="rounded-2xl border border-white/70 bg-white/70 px-4 py-3 text-sm"
            value={form.status}
            onChange={(event) => handleFormChange("status", event.target.value)}
          >
            <option value="active">Ativo</option>
            <option value="blocked">Bloqueado</option>
          </select>
          <button
            type="submit"
            className="rounded-full bg-[color:var(--accent)] px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_32px_rgba(22,151,166,0.28)]"
            disabled={saving}
          >
            {saving ? "Salvando..." : "Adicionar"}
          </button>
          <input
            className="rounded-2xl border border-white/70 bg-white/70 px-4 py-3 text-sm lg:col-span-5"
            placeholder="URL da foto (opcional)"
            value={form.photoUrl}
            onChange={(event) => handleFormChange("photoUrl", event.target.value)}
          />
        </form>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <input
            className="rounded-full border border-white/70 bg-white/70 px-4 py-2 text-sm"
            placeholder="Buscar pessoa..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <p className="text-xs text-[color:var(--ink-soft)]">
            {records.length} registros
          </p>
        </div>

        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        {loading ? (
          <div className="rounded-3xl border border-white/60 bg-white/50 p-6 text-sm text-[color:var(--ink-soft)]">
            Carregando registros...
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {filtered.map((person) => {
              const isEditing = editingId === person.id;
              return (
                <div
                  key={person.id}
                  className="rounded-3xl border border-white/60 bg-white/60 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold">{person.name}</p>
                      <p className="text-xs text-[color:var(--ink-soft)]">
                        Bloco {person.block} • {person.area}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        person.status === "active"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {person.status === "active" ? "Ativo" : "Bloqueado"}
                    </span>
                  </div>

                  {isEditing ? (
                    <div className="mt-4 grid gap-3">
                      <input
                        className="rounded-2xl border border-white/70 bg-white/70 px-4 py-2 text-sm"
                        value={editForm.name}
                        onChange={(event) =>
                          setEditForm((prev) => ({ ...prev, name: event.target.value }))
                        }
                      />
                      <div className="grid gap-3 sm:grid-cols-2">
                        <input
                          className="rounded-2xl border border-white/70 bg-white/70 px-4 py-2 text-sm"
                          value={editForm.block}
                          onChange={(event) =>
                            setEditForm((prev) => ({ ...prev, block: event.target.value }))
                          }
                        />
                        <input
                          className="rounded-2xl border border-white/70 bg-white/70 px-4 py-2 text-sm"
                          value={editForm.area}
                          onChange={(event) =>
                            setEditForm((prev) => ({ ...prev, area: event.target.value }))
                          }
                        />
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <select
                          className="rounded-2xl border border-white/70 bg-white/70 px-4 py-2 text-sm"
                          value={editForm.status}
                          onChange={(event) =>
                            setEditForm((prev) => ({
                              ...prev,
                              status: event.target.value as "active" | "blocked",
                            }))
                          }
                        >
                          <option value="active">Ativo</option>
                          <option value="blocked">Bloqueado</option>
                        </select>
                        <input
                          className="rounded-2xl border border-white/70 bg-white/70 px-4 py-2 text-sm"
                          placeholder="URL da foto"
                          value={editForm.photoUrl}
                          onChange={(event) =>
                            setEditForm((prev) => ({ ...prev, photoUrl: event.target.value }))
                          }
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => saveEdit(person.id)}
                          className="rounded-full bg-[color:var(--accent)] px-4 py-2 text-xs font-semibold text-white"
                          disabled={saving}
                        >
                          Salvar
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="rounded-full border border-white/70 px-4 py-2 text-xs font-semibold"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => toggleStatus(person)}
                        className="rounded-full border border-white/70 px-4 py-2"
                        disabled={saving}
                      >
                        {person.status === "active" ? "Bloquear" : "Reativar"}
                      </button>
                      <button
                        type="button"
                        onClick={() => startEdit(person)}
                        className="rounded-full border border-white/70 px-4 py-2"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => removePerson(person)}
                        className="rounded-full border border-white/70 px-4 py-2 text-red-600"
                        disabled={saving}
                      >
                        Excluir
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
