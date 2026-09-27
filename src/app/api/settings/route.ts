import { NextResponse } from "next/server";
import { getCloudflareCredentials, testCloudflareConnection } from "@/services/cloudflare-ai";

export async function GET() {
  const credentials = getCloudflareCredentials();
  const tokenMasked = credentials.apiToken
    ? `${credentials.apiToken.slice(0, 8)}••••••••${credentials.apiToken.slice(-4)}`
    : null;
  const accountIdMasked = credentials.accountId
    ? `${credentials.accountId.slice(0, 6)}••••••••${credentials.accountId.slice(-4)}`
    : null;

  return NextResponse.json({
    cloudflare: {
      configured: Boolean(credentials.apiToken && credentials.accountId),
      hasApiToken: Boolean(credentials.apiToken),
      hasAccountId: Boolean(credentials.accountId),
      tokenMasked,
      accountIdMasked,
      model: credentials.model,
    },
    engine: {
      primary: "Cloudflare Workers AI",
      primaryModel: credentials.model,
      fallback: "Local Sharp + SVG Comic Ink Generator",
      offlineReady: true,
    },
    version: "0.1.0-mvp",
  });
}

export async function POST() {
  const result = await testCloudflareConnection();
  return NextResponse.json(result);
}
