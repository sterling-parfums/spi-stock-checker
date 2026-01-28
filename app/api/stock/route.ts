import { NextRequest, NextResponse } from "next/server";

const resolveSapUrl = (barcode: string) => {
  const baseUrl = process.env.SAP_BASE_API_URL ?? "";
  if (!baseUrl) return null;

  const path =
    "/sap/opu/odata4/sap/api_product/srvd_a2x/sap/product/0002/Product";
  const url = new URL(baseUrl.replace(/\/+$/, "") + path);
  const filterField =
    process.env.SAP_PRODUCT_FILTER_FIELD ?? "ProductStandardID";
  url.searchParams.set("$filter", `${filterField} eq '${barcode}'`);
  return url.toString();
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

  const sapUrl = resolveSapUrl(barcode);
  if (!sapUrl) {
    return NextResponse.json(
      { error: "SAP_API_URL is not configured on the server." },
      { status: 500 },
    );
  }

  console.log("[SAP] Request URL:", sapUrl);

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
    const response = await fetch(sapUrl, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "SAP request failed.",
          details: payload,
          status: response.status,
        },
        { status: 502 },
      );
    }

    return NextResponse.json({ barcode, stock: payload });
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
