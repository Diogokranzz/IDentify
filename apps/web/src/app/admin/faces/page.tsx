"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const DETECTOR_INPUT_SIZE = 128;
const DETECTOR_SCORE_THRESHOLD = 0.5;

type Person = {
  id: string;
  name: string;
  block: string;
  area: string;
  status: string;
};

export default function FaceEnrollPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const faceapiRef = useRef<typeof import("@vladmandic/face-api") | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [persons, setPersons] = useState<Person[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [modelsReady, setModelsReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

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
    loadModels();
  }, [token]);

  async function loadPersons() {
    try {
      const response = await fetch(`${API_URL}/persons`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Falha ao carregar pessoas");
      const data = await response.json();
      setPersons(data.data || []);
      if (data.data?.length && !selectedId) {
        setSelectedId(data.data[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
    }
  }

  async function loadModels() {
    try {
      if (!faceapiRef.current) {
        await import("@tensorflow/tfjs-backend-webgl");
        faceapiRef.current = await import("@vladmandic/face-api");
      }
      const faceapi = faceapiRef.current;
      const tfAny = faceapi.tf as unknown as {
        enableProdMode?: () => void;
        setBackend?: (backend: string) => Promise<void>;
        ready?: () => Promise<void>;
      };
      if (typeof tfAny.enableProdMode === "function") {
        tfAny.enableProdMode();
      }
      if (typeof tfAny.setBackend === "function") {
        await tfAny.setBackend("webgl");
      }
      if (typeof tfAny.ready === "function") {
        await tfAny.ready();
      }
      await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
      await faceapi.nets.faceLandmark68TinyNet.loadFromUri("/models");
      await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
      await warmupModels(faceapi);
      setModelsReady(true);
    } catch (err) {
      setError("Falha ao carregar modelos faciais.");
    }
  }

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 480 }, height: { ideal: 360 }, facingMode: "user" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setError("Não foi possível acessar a câmera.");
    }
  }

  async function captureAndEnroll() {
    if (!token || !selectedId) return;
    if (!videoRef.current) return;
    if (!faceapiRef.current) {
      setError("Modelos ainda não carregados.");
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");
    setLatencyMs(null);
    try {
      const faceapi = faceapiRef.current;
      const options = new faceapi.TinyFaceDetectorOptions({
        inputSize: DETECTOR_INPUT_SIZE,
        scoreThreshold: DETECTOR_SCORE_THRESHOLD,
      });
      const started = performance.now();
      const result = await faceapi
        .detectSingleFace(videoRef.current, options)
        .withFaceLandmarks(true)
        .withFaceDescriptor();
      const ended = performance.now();
      setLatencyMs(Math.round(ended - started));

      if (!result) {
        throw new Error("Nenhum rosto detectado.");
      }

      const descriptor = Array.from(result.descriptor);
      const response = await fetch(`${API_URL}/faces/enroll`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ personId: selectedId, descriptor }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Falha ao cadastrar rosto");
      }
      setMessage("Rosto cadastrado com sucesso.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  async function warmupModels(faceapi: typeof import("@vladmandic/face-api")) {
    const canvas = document.createElement("canvas");
    canvas.width = DETECTOR_INPUT_SIZE;
    canvas.height = DETECTOR_INPUT_SIZE;
    const options = new faceapi.TinyFaceDetectorOptions({
      inputSize: DETECTOR_INPUT_SIZE,
      scoreThreshold: DETECTOR_SCORE_THRESHOLD,
    });
    try {
      await faceapi.detectSingleFace(canvas, options);
    } catch {
      // ignore warmup errors
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
              Cadastro facial
            </p>
            <h1 className="mt-3 text-3xl font-semibold">Vincular rosto ao cadastro</h1>
            <p className="mt-2 text-sm text-[color:var(--ink-soft)]">
              Selecione a pessoa, abra a câmera e capture o rosto.
            </p>
          </div>
          <Link
            href="/admin/painel"
            className="rounded-full border border-white/60 px-4 py-2 text-xs font-semibold"
          >
            Voltar
          </Link>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-3xl border border-white/60 bg-white/60 p-6">
            <p className="text-sm font-semibold">Câmera</p>
            <div className="mt-4 overflow-hidden rounded-3xl border border-white/70 bg-white/80">
              <video ref={videoRef} autoPlay playsInline className="h-80 w-full object-cover" />
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={startCamera}
                className="rounded-full border border-white/70 px-4 py-2 text-xs font-semibold"
              >
                Abrir câmera
              </button>
              <button
                type="button"
                onClick={captureAndEnroll}
                className="rounded-full bg-[color:var(--accent)] px-4 py-2 text-xs font-semibold text-white"
                disabled={!modelsReady || loading}
              >
                {loading ? "Processando..." : "Capturar e cadastrar"}
              </button>
            </div>
            <p className="mt-3 text-xs text-[color:var(--ink-soft)]">
              Modelos: {modelsReady ? "Carregados" : "Carregando..."}
            </p>
            {latencyMs !== null ? (
              <p className="mt-1 text-xs text-[color:var(--ink-soft)]">
                Tempo de processamento: {latencyMs} ms
              </p>
            ) : null}
          </div>

          <div className="rounded-3xl border border-white/60 bg-white/60 p-6">
            <p className="text-sm font-semibold">Selecionar pessoa</p>
            <select
              className="mt-3 w-full rounded-2xl border border-white/70 bg-white/70 px-4 py-3 text-sm"
              value={selectedId}
              onChange={(event) => setSelectedId(event.target.value)}
            >
              {persons.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name} • {person.area}
                </option>
              ))}
            </select>
            <div className="mt-6 space-y-2 text-xs text-[color:var(--ink-soft)]">
              <p>Registros carregados: {persons.length}</p>
              <p>Selecione uma pessoa ativa para evitar bloqueio.</p>
            </div>
          </div>
        </div>

        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </section>
    </main>
  );
}
