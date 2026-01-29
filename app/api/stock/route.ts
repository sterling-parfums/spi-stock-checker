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
    "_ProductBasicText($select=ProductLongText)",
  );
  return url.toString();
};

const resolveStockUrl = (product: string) => {
  const baseUrl = process.env.SAP_BASE_API_URL ?? "";
  if (!baseUrl) return null;

  const path =
    "/sap/opu/odata/sap/API_MATERIAL_STOCK_SRV/A_MaterialStock";
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

const extractStockItems = (payload: unknown): Array<Record<string, unknown>> => {
  if (!payload || typeof payload !== "object") return [];
  const obj = payload as Record<string, unknown>;

  const value = obj.value;
  if (Array.isArray(value) && value.length > 0) {
    const first = value[0] as Record<string, unknown>;
    const expanded = first?.to_MatlStkInAcctMod;
    if (Array.isArray(expanded)) return expanded as Array<Record<string, unknown>>;
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

  const apiKeyHeader = process.env.SAP_API_KEY_HEADER;
  const apiKeyValue = process.env.SAP_API_KEY_VALUE;
  if (apiKeyHeader && apiKeyValue) {
    headers[apiKeyHeader] = apiKeyValue;
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
      return NextResponse.json(
        {
          error: "SAP product response missing Product key.",
          details: productPayload,
        },
        { status: 502 },
      );
    }

    const productName = extractProductName(productPayload);

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

    return NextResponse.json({
      barcode,
      product,
      productName,
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
