"use client";

import Link from "next/link";

const phases = [
  {
    title: "Fase 1 — MVP Operacional",
    items: [
      "Cadastro de pessoas, blocos e áreas.",
      "Captura facial com cadastro e verificação em tempo real.",
      "Painel admin com auditoria básica e logs de acesso.",
    ],
  },
  {
    title: "Fase 2 — Segurança Avançada",
    items: [
      "2FA obrigatório e políticas de senha.",
      "Alertas de comportamento suspeito.",
      "Melhorias de antifraude e bloqueios automatizados.",
    ],
  },
  {
    title: "Fase 3 — Integração com Catracas",
    items: [
      "Integração com múltiplos modelos de catraca.",
      "SDK para fabricantes e gateways de comunicação.",
      "Mecanismos offline e fallback de autorização.",
    ],
  },
  {
    title: "Fase 4 — Inteligência e Escala",
    items: [
      "Dashboards de operação e BI.",
      "Modelos de risco e score de confiança por ambiente.",
      "Clusterização e otimização de performance em larga escala.",
    ],
  },
];

export default function RoadmapPage() {
  return (
    <main className="relative min-h-screen px-6 py-20">
      <div className="absolute inset-0 -z-10">
        <span className="orb orb-a" />
        <span className="orb orb-b" />
        <span className="orb orb-c" />
      </div>

      <section className="glass-card mx-auto flex w-full max-w-5xl flex-col gap-10 p-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[color:var(--accent)]">
              Roadmap
            </p>
            <h1 className="mt-3 text-3xl font-semibold">Evolução do IDentify</h1>
            <p className="mt-2 text-sm text-[color:var(--ink-soft)]">
              Visão de fases para entregar o sistema completo com integração real às catracas.
            </p>
          </div>
          <Link
            href="/"
            className="rounded-full border border-white/60 px-4 py-2 text-xs font-semibold"
          >
            Voltar para a página inicial
          </Link>
        </header>

        <div className="grid gap-6">
          {phases.map((phase) => (
            <div
              key={phase.title}
              className="rounded-3xl border border-white/60 bg-white/60 p-6"
            >
              <p className="text-lg font-semibold">{phase.title}</p>
              <ul className="mt-3 grid gap-2 text-sm text-[color:var(--ink-soft)]">
                {phase.items.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
