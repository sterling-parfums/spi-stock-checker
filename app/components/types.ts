export type StockPayload = {
  barcode: string;
  product?: string;
  productName?: string;
  stock?: number;
  stockItems?: Array<Record<string, unknown>>;
  raw?: unknown;
  error?: string;
  details?: unknown;
};
