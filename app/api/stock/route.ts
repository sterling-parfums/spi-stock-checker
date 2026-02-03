import { NextRequest, NextResponse } from "next/server";

const resolveProductUrl = (barcode: string) => {
  const baseUrl = process.env.SAP_BASE_API_URL ?? "";
  if (!baseUrl) return null;

  const path =
    "/sap/opu/odata4/sap/api_product/srvd_a2x/sap/product/0002/Product";
  const url = new URL(baseUrl.replace(/\/+$/, "") + path);
  const filterField =
    process.env.SAP_PRODUCT_FILTER_FIELD ?? "ProductStandardID";
  url.searchParams.set("$filter", `${filterField} eq '${barcode}'`);
  url.searchParams.set("$select", "Product");
  url.searchParams.set(
    "$expand",
    "_ProductBasicText($select=ProductLongText),_ProductUnitOfMeasure",
  );
  return url.toString();
};

const resolveStockUrl = (product: string) => {
  const baseUrl = process.env.SAP_BASE_API_URL ?? "";
  if (!baseUrl) return null;

  const path = "/sap/opu/odata/sap/API_MATERIAL_STOCK_SRV/A_MaterialStock";
  const url = new URL(baseUrl.replace(/\/+$/, "") + path);
  url.searchParams.set("$filter", `Material eq '${product}'`);
  url.searchParams.set("$expand", "to_MatlStkInAcctMod");
  url.searchParams.set(
    "$select",
    "to_MatlStkInAcctMod/MatlWrhsStkQtyInMatlBaseUnit,to_MatlStkInAcctMod/StorageLocation,to_MatlStkInAcctMod/InventoryStockType",
  );
  return url.toString();
};

const extractProduct = (payload: unknown): string | null => {
  if (!payload || typeof payload !== "object") return null;
  const obj = payload as Record<string, unknown>;
  const direct = obj.Product;
  if (typeof direct === "string") return direct;

  const value = obj.value;
  if (Array.isArray(value) && value.length > 0) {
    const candidate = (value[0] as Record<string, unknown>)?.Product;
    if (typeof candidate === "string") return candidate;
  }

  const d = obj.d as Record<string, unknown> | undefined;
  const results = d?.results;
  if (Array.isArray(results) && results.length > 0) {
    const candidate = (results[0] as Record<string, unknown>)?.Product;
    if (typeof candidate === "string") return candidate;
  }

  return null;
};

const extractProductName = (payload: unknown): string | null => {
  if (!payload || typeof payload !== "object") return null;
  const obj = payload as Record<string, unknown>;

  const value = obj.value;
  if (Array.isArray(value) && value.length > 0) {
    const first = value[0] as Record<string, unknown>;
    const basicText = first._ProductBasicText;
    if (Array.isArray(basicText) && basicText.length > 0) {
      const longText = (basicText[0] as Record<string, unknown>)
        ?.ProductLongText;
      if (typeof longText === "string") return longText;
    } else if (basicText && typeof basicText === "object") {
      const nested = basicText as Record<string, unknown>;
      const longText = nested.ProductLongText;
      if (typeof longText === "string") return longText;
    }
  }

  const d = obj.d as Record<string, unknown> | undefined;
  const results = d?.results;
  if (Array.isArray(results) && results.length > 0) {
    const first = results[0] as Record<string, unknown>;
    const basicText = first._ProductBasicText as
      | { results?: Array<Record<string, unknown>> }
      | undefined;
    if (Array.isArray(basicText?.results) && basicText.results.length > 0) {
      const longText = basicText.results[0]?.ProductLongText;
      if (typeof longText === "string") return longText;
    }
  }

  return null;
};

const extractStockItems = (
  payload: unknown,
): Array<Record<string, unknown>> => {
  if (!payload || typeof payload !== "object") return [];
  const obj = payload as Record<string, unknown>;

  const value = obj.value;
  if (Array.isArray(value) && value.length > 0) {
    const first = value[0] as Record<string, unknown>;
    const expanded = first?.to_MatlStkInAcctMod;
    if (Array.isArray(expanded))
      return expanded as Array<Record<string, unknown>>;
  }

  const d = obj.d as Record<string, unknown> | undefined;
  const results = d?.results;
  if (Array.isArray(results) && results.length > 0) {
    const first = results[0] as Record<string, unknown>;
    const expanded = first?.to_MatlStkInAcctMod as
      | { results?: Array<Record<string, unknown>> }
      | undefined;
    if (Array.isArray(expanded?.results)) return expanded.results;
  }

  return [];
};

const normalizeNumber = (value: unknown): number | null => {
  if (typeof value === "number") return Number.isNaN(value) ? null : value;
  if (value === null || value === undefined) return null;
  const parsed = Number.parseFloat(String(value));
  return Number.isNaN(parsed) ? null : parsed;
};

const extractProductUoms = (payload: unknown): {
  baseUom: string | null;
  baseIsoUom: string | null;
  units: Array<{
    uom: string;
    isoUom: string | null;
    numerator: number | null;
    denominator: number | null;
    ratio: number | null;
  }>;
} => {
  if (!payload || typeof payload !== "object") {
    return { baseUom: null, baseIsoUom: null, units: [] };
  }
  const obj = payload as Record<string, unknown>;

  const value = obj.value;
  let first: Record<string, unknown> | undefined;
  if (Array.isArray(value) && value.length > 0) {
    first = value[0] as Record<string, unknown>;
  }

  if (!first) {
    const d = obj.d as Record<string, unknown> | undefined;
    const results = d?.results;
    if (Array.isArray(results) && results.length > 0) {
      first = results[0] as Record<string, unknown>;
    }
  }

  if (!first) {
    return { baseUom: null, baseIsoUom: null, units: [] };
  }

  const rawUnits = first._ProductUnitOfMeasure;
  let units: Array<Record<string, unknown>> = [];
  if (Array.isArray(rawUnits)) {
    units = rawUnits as Array<Record<string, unknown>>;
  } else if (rawUnits && typeof rawUnits === "object") {
    const nested = rawUnits as Record<string, unknown>;
    const nestedValue = nested.value;
    if (Array.isArray(nestedValue)) {
      units = nestedValue as Array<Record<string, unknown>>;
    } else if (Array.isArray((nested as { results?: unknown }).results)) {
      units = (nested as { results: Array<Record<string, unknown>> }).results;
    } else {
      units = [nested as Record<string, unknown>];
    }
  }

  const mappedUnits = units
    .map((unit) => {
      const uom =
        (typeof unit.AlternativeUnit === "string" && unit.AlternativeUnit) ||
        (typeof unit.AlternativeSAPUnit === "string" &&
          unit.AlternativeSAPUnit) ||
        (typeof unit.AlternativeISOUnit === "string" &&
          unit.AlternativeISOUnit) ||
        (typeof unit.AlternativeUnitOfMeasure === "string" &&
          unit.AlternativeUnitOfMeasure) ||
        (typeof unit.UnitOfMeasure === "string" && unit.UnitOfMeasure) ||
        (typeof unit.ProductUnitOfMeasure === "string" &&
          unit.ProductUnitOfMeasure) ||
        (typeof unit.UoM === "string" && unit.UoM) ||
        null;

      if (!uom) return null;

      const isoUom =
        (typeof unit.AlternativeISOUnit === "string" &&
          unit.AlternativeISOUnit) ||
        (typeof unit.ISOUnit === "string" && unit.ISOUnit) ||
        null;

      const numerator = normalizeNumber(unit.QuantityNumerator);
      const denominator = normalizeNumber(unit.QuantityDenominator);
      const ratio =
        numerator !== null && denominator !== null && denominator !== 0
          ? numerator / denominator
          : null;

      return {
        uom,
        isoUom,
        numerator,
        denominator,
        ratio,
      };
    })
    .filter((unit): unit is NonNullable<typeof unit> => Boolean(unit));

  const baseUom =
    (typeof first.BaseUnit === "string" && first.BaseUnit) ||
    (typeof units[0]?.BaseUnit === "string" && units[0].BaseUnit) ||
    null;

  const baseUnitFromRatio =
    mappedUnits.find(
      (unit) => unit.numerator === 1 && unit.denominator === 1,
    ) ?? null;

  const baseIsoUom =
    (typeof first.BaseISOUnit === "string" && first.BaseISOUnit) ||
    (typeof units[0]?.BaseISOUnit === "string" && units[0].BaseISOUnit) ||
    baseUnitFromRatio?.isoUom ||
    null;

  return { baseUom, baseIsoUom, units: mappedUnits };
};

const sumWarehouseStock = (items: Array<Record<string, unknown>>) => {
  return items.reduce((total, item) => {
    const location = item?.StorageLocation;
    if (location !== "FG01") return total;
    if (item?.InventoryStockType !== "01") return total;
    const raw = item?.MatlWrhsStkQtyInMatlBaseUnit;
    const num =
      typeof raw === "number" ? raw : Number.parseFloat(String(raw ?? 0));
    if (Number.isNaN(num)) return total;
    return total + num;
  }, 0);
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const barcode = searchParams.get("barcode");

  if (!barcode) {
    return NextResponse.json(
      { error: "Missing barcode query parameter." },
      { status: 400 },
    );
  }

  const productUrl = resolveProductUrl(barcode);
  if (!productUrl) {
    return NextResponse.json(
      { error: "SAP_API_URL is not configured on the server." },
      { status: 500 },
    );
  }

  console.log("[SAP] Product URL:", productUrl);

  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  const basicUser = process.env.SAP_BASIC_AUTH_USER;
  const basicPass = process.env.SAP_BASIC_AUTH_PASS;
  const basicToken = process.env.SAP_BASIC_AUTH;
  if (basicUser && basicPass) {
    headers.Authorization = `Basic ${Buffer.from(
      `${basicUser}:${basicPass}`,
    ).toString("base64")}`;
  } else if (basicToken) {
    headers.Authorization = basicToken.startsWith("Basic ")
      ? basicToken
      : `Basic ${basicToken}`;
  } else {
    const token = process.env.SAP_API_TOKEN;
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  try {
    const productResponse = await fetch(productUrl, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const productPayload = await productResponse.json().catch(() => null);

    if (!productResponse.ok) {
      return NextResponse.json(
        {
          error: "SAP product request failed.",
          details: productPayload,
          status: productResponse.status,
        },
        { status: 502 },
      );
    }

    const product = extractProduct(productPayload);
    if (!product) {
      const value = (productPayload as { value?: unknown })?.value;
      if (Array.isArray(value) && value.length === 0) {
        return NextResponse.json(
          { error: "Barcode not found.", details: productPayload },
          { status: 404 },
        );
      }

      const d = (productPayload as { d?: { results?: unknown[] } })?.d;
      if (Array.isArray(d?.results) && d?.results.length === 0) {
        return NextResponse.json(
          { error: "Barcode not found.", details: productPayload },
          { status: 404 },
        );
      }

      return NextResponse.json(
        {
          error: "SAP product response missing Product key.",
          details: productPayload,
          raw: {
            product: productPayload,
          },
        },
        { status: 502 },
      );
    }

    const productName = extractProductName(productPayload);
    const { baseUom, baseIsoUom, units } = extractProductUoms(productPayload);

    const stockUrl = resolveStockUrl(product);
    if (!stockUrl) {
      return NextResponse.json(
        { error: "SAP_API_URL is not configured on the server." },
        { status: 500 },
      );
    }

    console.log("[SAP] Stock URL:", stockUrl);

    const stockResponse = await fetch(stockUrl, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const stockPayload = await stockResponse.json().catch(() => null);

    if (!stockResponse.ok) {
      return NextResponse.json(
        {
          error: "SAP stock request failed.",
          details: stockPayload,
          status: stockResponse.status,
        },
        { status: 502 },
      );
    }

    const items = extractStockItems(stockPayload);
    const stock = sumWarehouseStock(items);
    const alternateUnits = units
      .filter((unit) => unit.uom !== baseUom)
      .map((unit) => {
        const numerator = unit.numerator;
        const denominator = unit.denominator;
        const quantity =
          numerator !== null && denominator !== null && numerator !== 0
            ? stock * (denominator / numerator)
            : null;
        return {
          uom: unit.uom,
          isoUom: unit.isoUom ?? unit.uom,
          quantity,
          numerator,
          denominator,
          ratio: unit.ratio,
        };
      });

    return NextResponse.json({
      barcode,
      product,
      productName,
      baseUom,
      baseIsoUom,
      alternateUnits,
      stock,
      stockItems: items,
      raw: {
        product: productPayload,
        stock: stockPayload,
      },
    });
  } catch (error) {
    const err = error as {
      message?: string;
      cause?: { message?: string; code?: string };
      code?: string;
    };
    return NextResponse.json(
      {
        error: "SAP request failed.",
        details: {
          message: err?.message ?? "Unknown error.",
          code: err?.code,
          cause: err?.cause?.message,
          causeCode: err?.cause?.code,
        },
      },
      { status: 502 },
    );
  }
}
