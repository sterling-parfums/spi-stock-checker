"use client";

import { BrowserMultiFormatReader } from "@zxing/browser";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type StockPayload = {
  barcode: string;
  product?: string;
  productName?: string;
  stock?: number;
  stockItems?: Array<Record<string, unknown>>;
  raw?: unknown;
  error?: string;
  details?: unknown;
};

type ScannerClientProps = {
  userName: string;
  userEmail?: string;
};

const statusStyles: Record<string, string> = {
  idle: "bg-white/10 text-white/70",
  scanning: "bg-[#960000]/25 text-[#ffb3b3]",
  scanned: "bg-emerald-500/15 text-emerald-200",
  error: "bg-rose-500/15 text-rose-200",
};

export default function ScannerClient({
  userName,
  userEmail,
}: ScannerClientProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const lastCodeRef = useRef<string | null>(null);
  const [status, setStatus] = useState<"idle" | "scanning" | "scanned" | "error">(
    "idle",
  );
  const [barcode, setBarcode] = useState<string | null>(null);
  const [stock, setStock] = useState<StockPayload | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState("");
  const responseRef = useRef<HTMLDivElement | null>(null);
  const [cameraEnabled, setCameraEnabled] = useState(true);

  const fetchStock = useCallback(async (code: string) => {
    if (code.length !== 13) {
      setStatus("error");
      setError("Barcode must be exactly 13 characters.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setStock(null);

    try {
      const response = await fetch(`/api/stock?barcode=${encodeURIComponent(code)}`, {
        cache: "no-store",
      });
      const payload: StockPayload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "SAP lookup failed.");
      }

      setStock(payload);
      setStatus("scanned");
      setManualCode("");
      responseRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "SAP lookup failed.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetScan = useCallback(() => {
    lastCodeRef.current = null;
    setBarcode(null);
    setStock(null);
    setError(null);
    setStatus("scanning");
  }, []);

  const submitManual = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const trimmed = manualCode.trim();
      if (!trimmed) return;
      if (trimmed.length !== 13) {
        setStatus("error");
        setError("Barcode must be exactly 13 characters.");
        return;
      }
      lastCodeRef.current = trimmed;
      setBarcode(trimmed);
      await fetchStock(trimmed);
    },
    [fetchStock, manualCode],
  );

  useEffect(() => {
    if (!videoRef.current) return;
    if (!cameraEnabled) {
      controlsRef.current?.stop();
      controlsRef.current = null;
      return;
    }

    const codeReader = new BrowserMultiFormatReader();
    let isMounted = true;

    setStatus("scanning");
    setError(null);

    codeReader
      .decodeFromVideoDevice(undefined, videoRef.current, (result, err, controls) => {
        if (controls && !controlsRef.current) {
          controlsRef.current = controls;
        }

        if (result) {
          const text = result.getText();
          if (lastCodeRef.current === text) {
            return;
          }
          lastCodeRef.current = text;
          setBarcode(text);
          fetchStock(text);
        }

        if (err && (err as { name?: string })?.name !== "NotFoundException") {
          setStatus("error");
          setError("Camera or decode error. Check permissions and retry.");
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setStatus("error");
        setError(err instanceof Error ? err.message : "Camera access failed.");
      });

    return () => {
      isMounted = false;
      controlsRef.current?.stop();
    };
  }, [fetchStock, cameraEnabled]);

  const statusLabel = useMemo(() => {
    if (status === "scanning") return "Scanning camera feed";
    if (status === "scanned") return "Barcode captured";
    if (status === "error") return "Attention needed";
    return "Idle";
  }, [status]);

  return (
    <div className="min-h-screen bg-[#0a0b0f] text-white">
      <div className="relative isolate min-h-screen overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_left,_rgba(150,0,0,0.2),_transparent_55%),radial-gradient(circle_at_right,_rgba(255,170,170,0.15),_transparent_50%)]" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-[34rem] -translate-x-1/2 rounded-full bg-[#960000]/25 blur-3xl" />

        <main className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-6 py-8 lg:gap-8 lg:px-12 lg:py-12">
          <header className="relative z-30 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#960000]/50 bg-[#960000]/20 text-sm font-semibold">
                S
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-white/50">
                  SAP Stock Console
                </p>
                <p className="text-sm text-white/80">Warehouse Scan</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="/auth/logout"
                className="hidden rounded-full border border-white/15 px-4 py-2 text-[10px] uppercase tracking-[0.3em] text-white/70 transition hover:border-white/35 hover:text-white sm:inline-flex"
              >
                Logout
              </a>
              <details className="relative">
                <summary className="list-none">
                  <span className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-white/5 text-xs uppercase tracking-[0.2em] text-white/70 transition hover:border-white/35">
                    {userName.slice(0, 2)}
                  </span>
                </summary>
                <div className="absolute right-0 z-40 mt-3 w-60 rounded-2xl border border-white/10 bg-[#0a0b0f] p-4 text-sm text-white shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-white/50">
                    Signed in
                  </p>
                  <p className="mt-2 text-sm font-semibold text-white">
                    {userName}
                  </p>
                  {userEmail ? (
                    <p className="mt-1 text-xs text-white/60">{userEmail}</p>
                  ) : null}
                  <div className="mt-4 h-px bg-white/10" />
                  <a
                    href="/auth/logout"
                    className="mt-3 inline-flex w-full items-center justify-center rounded-full border border-white/15 px-4 py-2 text-[10px] uppercase tracking-[0.3em] text-white/70 transition hover:border-white/35 hover:text-white"
                  >
                    Logout
                  </a>
                </div>
              </details>
            </div>
          </header>

          <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                    Live Camera
                  </p>
                  <h2 className="mt-2 text-xl font-semibold">
                    Barcode capture
                  </h2>
                </div>
                <div
                  className={`rounded-full px-4 py-2 text-xs uppercase tracking-[0.25em] ${statusStyles[status]}`}
                >
                  {statusLabel}
                </div>
              </div>

              <div className="relative mt-6 overflow-hidden rounded-2xl border border-white/10 bg-black/60">
                {cameraEnabled ? (
                  <>
                    <video
                      ref={videoRef}
                      className="h-[360px] w-full object-cover"
                      muted
                      playsInline
                    />
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <div className="h-40 w-64 rounded-2xl border border-[#ffb3b3]/70 bg-[#960000]/15 shadow-[0_0_30px_rgba(150,0,0,0.35)]" />
                    </div>
                  </>
                ) : (
                  <div className="flex h-[360px] w-full flex-col items-center justify-center gap-3 bg-black/70 text-center text-white/70">
                    <p className="text-sm uppercase tracking-[0.3em] text-white/50">
                      Camera paused
                    </p>
                    <p className="text-base font-semibold text-white">
                      Feed is turned off
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={resetScan}
                  className="rounded-full border border-white/15 bg-white/5 px-5 py-2 text-xs uppercase tracking-[0.3em] text-white/80 transition hover:border-white/35 hover:bg-white/10"
                >
                  Rescan
                </button>
                <button
                  type="button"
                  onClick={() => setCameraEnabled((prev) => !prev)}
                  className="rounded-full border border-white/15 bg-white/5 px-5 py-2 text-xs uppercase tracking-[0.3em] text-white/80 transition hover:border-white/35 hover:bg-white/10"
                >
                  {cameraEnabled ? "Turn off feed" : "Turn on feed"}
                </button>
                <span className="text-xs uppercase tracking-[0.3em] text-white/50">
                  Ensure barcode stays inside the frame
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div
                ref={responseRef}
                className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur"
              >
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                  Last barcode
                </p>
                <p className="mt-3 font-mono text-lg text-white">
                  {barcode ?? "—"}
                </p>
                <div className="mt-4 h-px bg-white/10" />
                <form className="mt-4 flex flex-col gap-3" onSubmit={submitManual}>
                  <label className="text-xs uppercase tracking-[0.3em] text-white/50">
                    Manual entry
                  </label>
                  <input
                    value={manualCode}
                    onChange={(event) => setManualCode(event.target.value)}
                    placeholder="Type or paste barcode"
                    className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-[#960000] focus:outline-none focus:ring-2 focus:ring-[#960000]/40"
                  />
                  <button
                    type="submit"
                    className="rounded-full border border-white/15 bg-white/5 px-5 py-2 text-xs uppercase tracking-[0.3em] text-white/80 transition hover:border-white/35 hover:bg-white/10"
                  >
                    Lookup stock
                  </button>
                </form>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                  SAP Response
                </p>
                {isLoading ? (
                  <p className="mt-4 text-sm text-[#ffb3b3]">
                    Contacting SAP...
                  </p>
                ) : null}
                {error ? (
                  <p className="mt-4 text-sm text-rose-200">{error}</p>
                ) : null}
                {!isLoading && !error && stock ? (
                  <div className="mt-4 space-y-4">
                    <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                      <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                        Product name
                      </p>
                      <p className="mt-2 text-xl font-semibold text-white">
                        {stock.productName ?? stock.product ?? "—"}
                      </p>
                      <p className="mt-2 text-sm text-white/60">
                        Product ID: {stock.product ?? "—"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-[#960000]/40 bg-[#960000]/10 p-4">
                      <p className="text-xs uppercase tracking-[0.3em] text-[#ffb3b3]">
                        Total stock (FG01 / 01)
                      </p>
                      <p className="mt-2 text-3xl font-semibold text-white">
                        {typeof stock.stock === "number"
                          ? stock.stock.toLocaleString()
                          : "—"}
                      </p>
                    </div>
                  </div>
                ) : null}
                {!isLoading && !error && !stock ? (
                  <p className="mt-4 text-sm text-white/60">
                    Scan a barcode to view stock data.
                  </p>
                ) : null}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
