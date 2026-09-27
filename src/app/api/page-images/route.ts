import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { InferenceClient } from "@huggingface/inference";
import { NextResponse } from "next/server";
import type { PageAspectRatio } from "@/types/domain";
import { renderGraphicNovelArtwork } from "./graphic-novel-renderer";
import {
  generateCloudflareWorkersAIImage,
  getCloudflareCredentials,
} from "@/services/cloudflare-ai";

export const runtime = "nodejs";

const IMAGE_DIMENSIONS: Record<PageAspectRatio, { width: number; height: number }> = {
  "3:4": { width: 768, height: 1024 },
  "16:9": { width: 1024, height: 576 },
  "1:1": { width: 768, height: 768 },
  "4:3": { width: 1024, height: 768 },
  "9:16": { width: 576, height: 1024 },
};

interface GenerateRequest {
  pageId?: unknown;
  prompt?: unknown;
  aspectRatio?: unknown;
  optionCount?: unknown;
  parentVersionId?: unknown;
  jobId?: unknown;
  revision?: unknown;
  mockLatencyMs?: unknown;
}

export async function POST(request: Request) {
  let body: GenerateRequest;
  try {
    body = (await request.json()) as GenerateRequest;
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  const pageId = typeof body.pageId === "string" ? body.pageId.trim() : "";
  const aspectRatio = (body.aspectRatio as PageAspectRatio) || "3:4";
  const optionCount = Number(body.optionCount ?? 1);
  const parentVersionId =
    typeof body.parentVersionId === "string" && body.parentVersionId.trim()
      ? body.parentVersionId.trim()
      : null;
  const jobId = typeof body.jobId === "string" && body.jobId.trim() ? body.jobId.trim() : null;
  const revision = typeof body.revision === "number" ? body.revision : null;

  const mockLatencyHeader = request.headers.get("x-mock-latency-ms");
  const mockLatencyMs =
    typeof body.mockLatencyMs === "number"
      ? body.mockLatencyMs
      : mockLatencyHeader
        ? parseInt(mockLatencyHeader, 10) || 0
        : 0;

  if (mockLatencyMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, Math.min(mockLatencyMs, 10000)));
  }

  if (!pageId || pageId.length > 200 || !prompt || prompt.length > 20000) {
    return NextResponse.json({ error: "Enter a prompt under 20,000 characters." }, { status: 400 });
  }
  if (!Object.hasOwn(IMAGE_DIMENSIONS, aspectRatio)) {
    return NextResponse.json({ error: "Choose a supported image aspect ratio." }, { status: 400 });
  }
  if (!Number.isInteger(optionCount) || optionCount < 1 || optionCount > 3) {
    return NextResponse.json({ error: "Generate between 1 and 3 image options at a time." }, { status: 400 });
  }

  const imageDirectory =
    process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME
      ? path.join(tmpdir(), "vizzy-images")
      : path.join(process.cwd(), ".vizzy-images");
  await mkdir(imageDirectory, { recursive: true });
  const generationBatchId = randomUUID();

  let generatedBuffers: Buffer[] = [];
  let generationSource: "cloudflare-ai" | "huggingface" | "procedural" = "procedural";
  let notice = "Generated with local graphic novel artwork engine.";

  // Attempt 1: Cloudflare Workers AI using .env.local credentials
  const cfCredentials = getCloudflareCredentials();
  if (cfCredentials.apiToken) {
    try {
      const results = await Promise.all(
        Array.from({ length: optionCount }, (_, index) =>
          generateCloudflareWorkersAIImage({
            prompt,
            aspectRatio,
            optionIndex: index,
          }),
        ),
      );

      const validBuffers = results.filter((buf): buf is Buffer => buf !== null && buf.length > 0);
      if (validBuffers.length > 0) {
        generatedBuffers = validBuffers;
        generationSource = "cloudflare-ai";
        notice = `Generated with Cloudflare Workers AI (${cfCredentials.model}).`;
      }
    } catch {
      // Gracefully fall through to other providers or local generator
    }
  }

  // Attempt 2: Hugging Face if HF_TOKEN is configured and Cloudflare was not used
  const hfToken = process.env.HF_TOKEN;
  if (!generatedBuffers.length && hfToken) {
    try {
      const client = new InferenceClient(hfToken);
      const dimensions = IMAGE_DIMENSIONS[aspectRatio];
      const model = process.env.HF_IMAGE_MODEL || "black-forest-labs/FLUX.1-dev";
      generatedBuffers = await Promise.all(
        Array.from({ length: optionCount }, async () => {
          const image = await client.textToImage(
            {
              model,
              provider: "auto",
              inputs: prompt,
              parameters: dimensions,
            },
            { outputType: "blob" },
          );
          return Buffer.from(await image.arrayBuffer());
        }),
      );
      generationSource = "huggingface";
      notice = "Generated with Hugging Face image model.";
    } catch {
      // Fall through to procedural generator
    }
  }

  // Attempt 3: Local Procedural Graphic Novel & Storyboard Artwork Generator (Sharp + SVG fallback)
  if (!generatedBuffers.length) {
    try {
      generatedBuffers = await Promise.all(
        Array.from({ length: optionCount }, async (_, index) => {
          return await renderGraphicNovelArtwork({
            prompt,
            aspectRatio,
            optionIndex: index,
            totalOptions: optionCount,
          });
        }),
      );
      generationSource = "procedural";
      notice = cfCredentials.apiToken
        ? "Cloudflare Workers AI request failed; fell back to local graphic novel art engine."
        : "Local graphic novel art engine (add CLOUDFLARE_API_TOKEN to .env.local for Cloudflare Workers AI).";
    } catch (renderError) {
      const msg = renderError instanceof Error ? renderError.message : "Failed to generate artwork";
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }

  // Save each image as a PNG file in .vizzy-images
  const versions = await Promise.all(
    generatedBuffers.map(async (buffer, index) => {
      const id = randomUUID();
      await writeFile(path.join(imageDirectory, `${id}.png`), buffer);
      return {
        id,
        pageId,
        imageUrl: `/api/page-images/${id}`,
        prompt,
        createdAt: new Date().toISOString(),
        selected: index === 0,
        parentVersionId,
        generationBatchId,
        generationSource,
        status: "generated" as const,
      };
    }),
  );

  return NextResponse.json({
    generationBatchId,
    jobId,
    revision,
    versions,
    generationSource,
    notice,
  });
}