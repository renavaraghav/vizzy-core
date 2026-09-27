import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

export const runtime = "nodejs";

// Instant SVG placeholder when image is not found or still generating
function createPlaceholderSvg(title: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
    <rect width="800" height="600" fill="#181917" />
    <rect x="20" y="20" width="760" height="560" fill="none" stroke="#ffffff" stroke-opacity="0.1" stroke-width="2" />
    <circle cx="400" cy="270" r="45" fill="#777fd7" fill-opacity="0.15" />
    <path d="M400 245 L408 265 L430 268 L414 282 L418 303 L400 292 L382 303 L386 282 L370 268 L392 265 Z" fill="#777fd7" />
    <text x="400" y="360" fill="#c5c5bf" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="600" text-anchor="middle">
      ${title}
    </text>
    <text x="400" y="390" fill="#777672" font-family="system-ui, -apple-system, sans-serif" font-size="13" text-anchor="middle">
      Generate an illustration in the studio to view it here
    </text>
  </svg>`;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ imageId: string }> },
) {
  const { imageId } = await params;

  if (!imageId || imageId.length > 250) {
    return new Response("Invalid image identifier", {
      status: 400,
      headers: { "Content-Type": "text/plain" },
    });
  }

  // Prevent directory traversal
  const safeId = path.basename(imageId).replace(/[^a-zA-Z0-9_-]/g, "");

  // 1. Check in-memory cache first (same serverless container instance)
  if (typeof globalThis !== "undefined") {
    const cache = (globalThis as Record<string, unknown>).__vizzyImageCache as
      | Map<string, { buffer: Buffer; mimeType: string }>
      | undefined;
    const cached = cache?.get(safeId);
    if (cached) {
      return new Response(new Uint8Array(cached.buffer), {
        status: 200,
        headers: {
          "Content-Type": cached.mimeType,
          "Content-Length": String(cached.buffer.byteLength),
          "Cache-Control": "public, max-age=86400, immutable",
        },
      });
    }
  }

  const imageDirectories = [
    path.join(process.cwd(), ".vizzy-images"),
    path.join(tmpdir(), "vizzy-images"),
  ];

  // Check candidate filenames: .jpg, .png, or exact safeId across directories
  const candidatePaths: string[] = [];
  for (const dir of imageDirectories) {
    candidatePaths.push(
      path.join(dir, `${safeId}.jpg`),
      path.join(dir, `${safeId}.png`),
      path.join(dir, safeId),
    );
  }

  let resolvedPath: string | null = null;
  for (const candidate of candidatePaths) {
    if (existsSync(candidate)) {
      resolvedPath = candidate;
      break;
    }
  }

  // If image does not exist, return an immediate clean 404 with SVG fallback
  if (!resolvedPath) {
    const svg = createPlaceholderSvg("Page Artwork Not Found");
    return new Response(svg, {
      status: 404,
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "no-cache",
      },
    });
  }

  try {
    // Read file with a 3-second hard timeout to guarantee no hanging
    const readPromise = readFile(resolvedPath);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("File read timeout")), 3000),
    );

    const fileBuffer = await Promise.race([readPromise, timeoutPromise]);
    // Detect image format from magic bytes (JPEG starts with 0xFF 0xD8 0xFF)
    const isJpeg =
      fileBuffer.length > 3 &&
      fileBuffer[0] === 0xff &&
      fileBuffer[1] === 0xd8 &&
      fileBuffer[2] === 0xff;
    const contentType = isJpeg
      ? "image/jpeg"
      : resolvedPath.endsWith(".jpg")
        ? "image/jpeg"
        : "image/png";

    return new Response(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(fileBuffer.byteLength),
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error reading image file";
    return new Response(msg, {
      status: 500,
      headers: { "Content-Type": "text/plain" },
    });
  }
}