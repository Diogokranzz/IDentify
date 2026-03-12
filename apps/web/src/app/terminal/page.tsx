"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const TERMINAL_KEY = process.env.NEXT_PUBLIC_TERMINAL_KEY || "";
const DETECTOR_INPUT_SIZE = 128;
const DETECTOR_SCORE_THRESHOLD = 0.5;

export default function TerminalPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const faceapiRef = useRef<typeof import("@vladmandic/face-api") | null>(null);
  const [modelsReady, setModelsReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [personName, setPersonName] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  useEffect(() => {
    loadModels();
  }, []);

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
    } catch {
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

  async function scan() {
    if (!videoRef.current) return;
    if (!faceapiRef.current) {
      setError("Modelos ainda não carregados.");
      return;
    }
    setLoading(true);
    setError("");
    setStatus(null);
    setPersonName(null);
    setScore(null);
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
      const response = await fetch(`${API_URL}/faces/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(TERMINAL_KEY ? { "x-terminal-key": TERMINAL_KEY } : {}),
        },
        body: JSON.stringify({ descriptor }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Falha na verificação");
      }

      if (data.matched) {
        setStatus("Acesso liberado");
        setPersonName(data.person?.name || "Visitante");
        setScore(data.score || null);
      } else {
        setStatus("Acesso negado");
        setPersonName(null);
        setScore(data.score || null);
      }
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
    <main className="relative flex min-h-screen items-center justify-center px-6 py-20">
      <div className="absolute inset-0 -z-10">
        <span className="orb orb-a" />
        <span className="orb orb-b" />
        <span className="orb orb-c" />
      </div>

      <section className="glass-card w-full max-w-5xl p-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[color:var(--accent)]">
              Terminal IDentify
            </p>
            <h1 className="mt-3 text-3xl font-semibold">Reconhecimento facial ao vivo</h1>
            <p className="mt-2 text-sm text-[color:var(--ink-soft)]">
              Capture o rosto e simule a liberação da catraca.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 text-xs text-[color:var(--ink-soft)]">
            <Link
              href="/"
              className="rounded-full border border-white/60 px-4 py-2 text-xs font-semibold text-[color:var(--ink)] transition hover:bg-white/50"
            >
              Voltar para a página inicial
            </Link>
            <span>Modelos: {modelsReady ? "Carregados" : "Carregando..."}</span>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-white/60 bg-white/60 p-4">
            <video ref={videoRef} autoPlay playsInline className="h-96 w-full rounded-3xl object-cover" />
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
                onClick={scan}
                className="rounded-full bg-[color:var(--accent)] px-4 py-2 text-xs font-semibold text-white"
                disabled={!modelsReady || loading}
              >
                {loading ? "Verificando..." : "Verificar acesso"}
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-white/60 bg-white/60 p-6">
            <p className="text-sm font-semibold">Resultado</p>
            <div className="mt-4 space-y-2 text-sm">
              <p>
                Status:{" "}
                <span className="font-semibold text-[color:var(--ink)]">
                  {status || "Aguardando"}
                </span>
              </p>
              {personName ? <p>Pessoa: {personName}</p> : null}
              {score !== null ? <p>Confiança: {score}</p> : null}
              {latencyMs !== null ? <p>Tempo de processamento: {latencyMs} ms</p> : null}
            </div>
            {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
          </div>
        </div>
      </section>
    </main>
  );
}
