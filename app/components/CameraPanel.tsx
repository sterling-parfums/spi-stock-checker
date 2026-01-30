import type { RefObject } from "react";

const statusStyles: Record<string, string> = {
  idle: "bg-white/10 text-white/70",
  scanning: "bg-[#960000]/25 text-[#ffb3b3]",
  scanned: "bg-emerald-500/15 text-emerald-200",
  error: "bg-rose-500/15 text-rose-200",
};

type CameraPanelProps = {
  videoRef: RefObject<HTMLVideoElement | null>;
  status: "idle" | "scanning" | "scanned" | "error";
  statusLabel: string;
  onRescan: () => void;
};

export default function CameraPanel({
  videoRef,
  status,
  statusLabel,
  onRescan,
}: CameraPanelProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">
            Live Camera
          </p>
          <h2 className="mt-2 text-xl font-semibold">Barcode capture</h2>
        </div>
        <div
          className={`rounded-full px-4 py-2 text-xs uppercase tracking-[0.25em] ${statusStyles[status]}`}
        >
          {statusLabel}
        </div>
      </div>

      <div className="relative mt-6 overflow-hidden rounded-2xl border border-white/10 bg-black/60">
        <video
          ref={videoRef}
          className="h-[360px] w-full object-cover"
          muted
          playsInline
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-1 w-full bg-[#ffb3b3] shadow-[0_0_18px_rgba(150,0,0,0.6)]" />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onRescan}
          className="rounded-full border border-white/15 bg-white/5 px-5 py-2 text-xs uppercase tracking-[0.3em] text-white/80 transition hover:border-white/35 hover:bg-white/10"
        >
          Rescan
        </button>
        <span className="text-xs uppercase tracking-[0.3em] text-white/50">
          Ensure barcode stays inside the frame
        </span>
      </div>
    </div>
  );
}
