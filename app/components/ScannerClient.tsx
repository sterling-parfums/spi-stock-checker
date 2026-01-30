"use client";

import { BrowserMultiFormatOneDReader } from "@zxing/browser";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CameraPanel from "./CameraPanel";
import ManualEntryCard from "./ManualEntryCard";
import ResponsePanel from "./ResponsePanel";
import ScannerAppBar from "./ScannerAppBar";
import type { StockPayload } from "./types";

type ScannerClientProps = {
  userName: string;
  userEmail?: string;
};

export default function ScannerClient({
  userName,
  userEmail,
}: ScannerClientProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const lastCodeRef = useRef<string | null>(null);
  const [status, setStatus] = useState<
    "idle" | "scanning" | "scanned" | "error"
  >("idle");
  const [barcode, setBarcode] = useState<string | null>(null);
  const [stock, setStock] = useState<StockPayload | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState("");
  const responseRef = useRef<HTMLDivElement | null>(null);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const audioContextRef = useRef<AudioContext | null>(null);
  const requestIdRef = useRef(0);

  const playBeep = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      const context = audioContextRef.current;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = 880;
      gain.gain.setValueAtTime(0.001, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.12);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.13);
    } catch {
      // Ignore audio failures (e.g., autoplay restrictions)
    }
  }, []);

  const fetchStock = useCallback(async (code: string) => {
    if (code.length !== 13) {
      setStatus("error");
      setError("Barcode must be exactly 13 characters.");
      return;
    }
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setError(null);
    setStock(null);

    try {
      const response = await fetch(
        `/api/stock?barcode=${encodeURIComponent(code)}`,
        {
          cache: "no-store",
        },
      );
      const payload: StockPayload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "SAP lookup failed.");
      }

      if (requestId !== requestIdRef.current) {
        return;
      }
      setStock(payload);
      setStatus("scanned");
      setCameraEnabled(false);
      setManualCode("");
      playBeep();
      responseRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    } catch (err) {
      if (requestId !== requestIdRef.current) {
        return;
      }
      setStatus("error");
      setError(err instanceof Error ? err.message : "SAP lookup failed.");
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const resetScan = useCallback(() => {
    lastCodeRef.current = null;
    requestIdRef.current += 1;
    setBarcode(null);
    setStock(null);
    setError(null);
    setStatus("scanning");
    setIsLoading(false);
    setCameraEnabled(true);
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

    const codeReader = new BrowserMultiFormatOneDReader();
    let isMounted = true;

    setStatus("scanning");
    setError(null);

    codeReader
      .decodeFromVideoDevice(
        undefined,
        videoRef.current,
        (result, err, controls) => {
          if (controls && !controlsRef.current) {
            controlsRef.current = controls;
          }

          if (result) {
            const text = result.getText();
            console.log("[Scanner] decoded barcode", text);
            if (lastCodeRef.current === text) {
              return;
            }
            lastCodeRef.current = text;
            setBarcode((b) => text || b);
            setCameraEnabled(false);
            fetchStock(text);
          }
        },
      )
      .catch((err) => {
        if (!isMounted) return;
        console.error("[Scanner] start error", err);
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
          <ScannerAppBar userName={userName} userEmail={userEmail} />

          <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            {cameraEnabled && (
              <CameraPanel
                videoRef={videoRef}
                status={status}
                statusLabel={statusLabel}
                onRescan={resetScan}
              />
            )}

            <div className="flex flex-col gap-6">
              {cameraEnabled && (
                <ManualEntryCard
                  barcode={barcode}
                  manualCode={manualCode}
                  onManualCodeChange={setManualCode}
                  onSubmit={submitManual}
                />
              )}

              {!cameraEnabled && (
                <ResponsePanel
                  containerRef={responseRef}
                  barcode={barcode}
                  stock={stock}
                  isLoading={isLoading}
                  error={error}
                  onRescan={resetScan}
                />
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
