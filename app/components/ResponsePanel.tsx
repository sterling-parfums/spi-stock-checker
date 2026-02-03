import type { RefObject } from "react";
import type { StockPayload } from "./types";

type ResponsePanelProps = {
  containerRef: RefObject<HTMLDivElement | null>;
  barcode: string | null;
  stock: StockPayload | null;
  isLoading: boolean;
  error: string | null;
  onRescan: () => void;
};

export default function ResponsePanel({
  containerRef,
  barcode,
  stock,
  isLoading,
  error,
  onRescan,
}: ResponsePanelProps) {
  return (
    <div
      ref={containerRef}
      className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur"
    >
      <p className="text-xs uppercase tracking-[0.3em] text-white/50">
        SAP Response
      </p>
      {isLoading ? (
        <p className="mt-4 text-sm text-[#ffb3b3]">Contacting SAP...</p>
      ) : null}
      {error ? <p className="mt-4 text-sm text-rose-200">{error}</p> : null}
      {!isLoading && !error && stock ? (
        <div className="mt-4 space-y-4">
          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">
              Scanned barcode
            </p>
            <p className="mt-2 font-mono text-lg text-white">
              {barcode ?? "—"}
            </p>
          </div>
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
                : "—"}{" "}
              <span className="text-lg font-semibold text-white/60">
                {stock.baseIsoUom ?? ""}
              </span>
            </p>
            {stock.alternateUnits && stock.alternateUnits.length > 0 ? (
              <details className="mt-4">
                <summary className="group flex cursor-pointer list-none items-center justify-between gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/70 transition hover:border-white/30 hover:bg-white/10">
                  Alternate UOMs
                  <span className="text-white/40 transition group-open:rotate-180">
                    ▾
                  </span>
                </summary>
                <div className="mt-3 space-y-2 text-sm text-white/70">
                  <div className="flex items-baseline gap-6 px-3 text-[10px] uppercase tracking-[0.3em] text-white/40">
                    <span>UoM</span>
                    <span>Quantity</span>
                  </div>
                  {stock.alternateUnits.map((unit) => (
                    <div
                      key={`${unit.uom}-${unit.numerator ?? "na"}-${unit.denominator ?? "na"}`}
                      className="flex items-baseline gap-6 rounded-xl border border-white/10 bg-black/30 px-3 py-2"
                    >
                      <span className="text-white/50">
                        {unit.isoUom ?? "—"}
                      </span>
                      <span className="text-white/60">
                        {typeof unit.quantity === "number"
                          ? unit.quantity.toLocaleString()
                          : "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </details>
            ) : null}
          </div>
        </div>
      ) : null}
      {!isLoading && !error && !stock ? (
        <p className="mt-4 text-sm text-white/60">
          Scan a barcode to view stock data.
        </p>
      ) : null}
      <div className="mt-6">
        <button
          type="button"
          onClick={onRescan}
          className="rounded-full border border-white/15 bg-white/5 px-5 py-2 text-xs uppercase tracking-[0.3em] text-white/80 transition hover:border-white/35 hover:bg-white/10"
        >
          Rescan
        </button>
      </div>
    </div>
  );
}
