export type StockPayload = {
  barcode: string;
  product?: string;
  productName?: string;
  stock?: number;
  stockItems?: Array<Record<string, unknown>>;
  baseUom?: string | null;
  baseIsoUom?: string | null;
  alternateUnits?: Array<{
    uom: string;
    isoUom?: string | null;
    quantity?: number | null;
    numerator?: number | null;
    denominator?: number | null;
    ratio?: number | null;
  }>;
  raw?: unknown;
  error?: string;
  details?: unknown;
};
