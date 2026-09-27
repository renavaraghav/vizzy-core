import type { PageAspectRatio } from "@/types/domain";

const CLOUDFLARE_DIMENSIONS: Record<PageAspectRatio, { width: number; height: number }> = {
  "3:4": { width: 768, height: 1024 },
  "16:9": { width: 1024, height: 576 },
  "1:1": { width: 1024, height: 1024 },
  "4:3": { width: 1024, height: 768 },
  "9:16": { width: 576, height: 1024 },
};

export interface CloudflareGenerationParams {
  prompt: string;
  aspectRatio?: PageAspectRatio;
  optionIndex?: number;
}

let cachedAccountId: string | null = null;

/**
 * Resolves Cloudflare API credentials from environment variables.
 * Supports multiple common naming conventions in .env.local.
 */
export function getCloudflareCredentials() {
  const apiToken =
    process.env.CLOUDFLARE_API_TOKEN ||
    process.env.CLOUDFLARE_API_KEY ||
    process.env.CF_API_TOKEN ||
    process.env.CF_API_KEY ||
    "";

  const accountId =
    process.env.CLOUDFLARE_ACCOUNT_ID ||
    process.env.CF_ACCOUNT_ID ||
    cachedAccountId ||
    "";

  const model =
    process.env.CLOUDFLARE_IMAGE_MODEL ||
    process.env.CF_IMAGE_MODEL ||
    "@cf/black-forest-labs/flux-1-schnell";

  return { apiToken: apiToken.trim(), accountId: accountId.trim(), model: model.trim() };
}

/**
 * If only CLOUDFLARE_API_TOKEN is provided without an account ID,
 * automatically fetch the user's account ID via Cloudflare's /accounts API.
 */
async function resolveAccountId(apiToken: string): Promise<string | null> {
  if (cachedAccountId) return cachedAccountId;
  try {
    const res = await fetch("https://api.cloudflare.com/client/v4/accounts", {
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { result?: Array<{ id: string }> };
    const id = data?.result?.[0]?.id;
    if (id) {
      cachedAccountId = id;
      return id;
    }
  } catch {
    // Fail silently
  }
  return null;
}

/**
 * Generates an image using Cloudflare Workers AI.
 * Returns a Buffer if successful, or null if unconfigured or failed,
 * allowing the caller to fall back to the local SVG/Sharp generator.
 */
export async function generateCloudflareWorkersAIImage({
  prompt,
  aspectRatio = "3:4",
  optionIndex = 0,
}: CloudflareGenerationParams): Promise<Buffer | null> {
  const credentials = getCloudflareCredentials();
  if (!credentials.apiToken) {
    return null;
  }

  let accountId = credentials.accountId;
  if (!accountId) {
    const discovered = await resolveAccountId(credentials.apiToken);
    if (!discovered) {
      return null;
    }
    accountId = discovered;
  }

  const dimensions = CLOUDFLARE_DIMENSIONS[aspectRatio] || { width: 1024, height: 1024 };
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${credentials.model}`;

  // Slightly vary seeds across options for distinct compositions
  const seed = Math.floor(Date.now() / 1000) + optionIndex * 1337;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000); // 25s timeout for AI inference

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${credentials.apiToken}`,
        "Content-Type": "application/json",
        Accept: "image/png, image/jpeg, application/json",
      },
      body: JSON.stringify(
        credentials.model.includes("flux")
          ? { prompt }
          : {
              prompt,
              width: dimensions.width,
              height: dimensions.height,
              num_steps: 20,
              seed,
            },
      ),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return null;
    }

    const contentType = response.headers.get("content-type") || "";

    // Binary image response (standard for some Cloudflare image models)
    if (contentType.includes("image") || contentType.includes("octet-stream")) {
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      if (buffer.length > 32) {
        return buffer;
      }
    }

    // JSON response format with base64 image (standard for @cf/black-forest-labs/flux-1-schnell)
    const data = (await response.json()) as {
      result?: { image?: string; images?: string[] };
      image?: string;
      images?: string[];
      success?: boolean;
    };

    const rawBase64 =
      data?.result?.image ||
      data?.image ||
      (Array.isArray(data?.result?.images) ? data.result.images[0] : null) ||
      (Array.isArray(data?.images) ? data.images[0] : null);

    if (rawBase64 && typeof rawBase64 === "string") {
      // Strip any data URI prefix if present (e.g. data:image/jpeg;base64, or data:image/png;base64,)
      const cleanB64 = rawBase64.replace(/^data:image\/\w+;base64,/, "").trim();
      if (cleanB64) {
        const buffer = Buffer.from(cleanB64, "base64");
        // Ensure buffer contains valid image bytes
        if (buffer.length > 32) {
          return buffer;
        }
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Tests Cloudflare API token connectivity and returns latency and status.
 */
export async function testCloudflareConnection(): Promise<{
  success: boolean;
  status: string;
  latencyMs?: number;
  model: string;
  accountId: string;
}> {
  const credentials = getCloudflareCredentials();
  if (!credentials.apiToken) {
    return {
      success: false,
      status: "Missing API Token in .env.local",
      model: credentials.model,
      accountId: credentials.accountId,
    };
  }

  const accountId = credentials.accountId || (await resolveAccountId(credentials.apiToken));
  if (!accountId) {
    return {
      success: false,
      status: "Missing Account ID in .env.local",
      model: credentials.model,
      accountId: "",
    };
  }

  const startTime = Date.now();
  try {
    const res = await fetch("https://api.cloudflare.com/client/v4/user/tokens/verify", {
      headers: {
        Authorization: `Bearer ${credentials.apiToken}`,
      },
    });
    const latencyMs = Date.now() - startTime;
    if (res.ok) {
      return {
        success: true,
        status: "Active & Verified",
        latencyMs,
        model: credentials.model,
        accountId,
      };
    } else {
      return {
        success: false,
        status: `Token verify returned HTTP ${res.status}`,
        latencyMs,
        model: credentials.model,
        accountId,
      };
    }
  } catch (err) {
    return {
      success: false,
      status: err instanceof Error ? err.message : "Connection failed",
      model: credentials.model,
      accountId,
    };
  }
}
