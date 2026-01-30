type ManualEntryCardProps = {
  barcode: string | null;
  manualCode: string;
  onManualCodeChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

export default function ManualEntryCard({
  barcode,
  manualCode,
  onManualCodeChange,
  onSubmit,
}: ManualEntryCardProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
      <p className="text-xs uppercase tracking-[0.3em] text-white/50">
        Last barcode
      </p>
      <p className="mt-3 font-mono text-lg text-white">{barcode ?? "—"}</p>
      <div className="mt-4 h-px bg-white/10" />
      <form className="mt-4 flex flex-col gap-3" onSubmit={onSubmit}>
        <label className="text-xs uppercase tracking-[0.3em] text-white/50">
          Manual entry
        </label>
        <input
          value={manualCode}
          onChange={(event) => onManualCodeChange(event.target.value)}
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
  );
}
