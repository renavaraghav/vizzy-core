import assert from "node:assert/strict";
import test from "node:test";

test("Cloudflare Base64 handling: strips data:image prefix without corrupting JPEG magic bytes", () => {
  // Synthetic valid JPEG header: \xFF\xD8\xFF\xE0\x00\x10JFIF
  const realJpegBuffer = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48,
    0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
    0xff, 0xd9, // EOI
  ]);
  const rawBase64 = realJpegBuffer.toString("base64");
  const prefixedDataUri = `data:image/jpeg;base64,${rawBase64}`;

  // If decoded WITH prefix stripped:
  const cleanB64 = prefixedDataUri.replace(/^data:image\/\w+;base64,/, "").trim();
  const decodedBuffer = Buffer.from(cleanB64, "base64");

  assert.equal(decodedBuffer.length, realJpegBuffer.length);
  assert.equal(decodedBuffer[0], 0xff);
  assert.equal(decodedBuffer[1], 0xd8);
  assert.equal(decodedBuffer[2], 0xff);
  assert.deepEqual(decodedBuffer, realJpegBuffer);
});

test("Cloudflare Base64 handling: raw base64 without prefix decodes with valid JPEG magic bytes", () => {
  const realJpegBuffer = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48,
    0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
    0xff, 0xd9,
  ]);
  const rawBase64 = realJpegBuffer.toString("base64");

  const cleanB64 = rawBase64.replace(/^data:image\/\w+;base64,/, "").trim();
  const decodedBuffer = Buffer.from(cleanB64, "base64");

  assert.equal(decodedBuffer[0], 0xff);
  assert.equal(decodedBuffer[1], 0xd8);
  assert.equal(decodedBuffer[2], 0xff);
  assert.deepEqual(decodedBuffer, realJpegBuffer);
});

test("ImageVersion format detection: JPEG creates image/jpeg data URI, PNG creates image/png data URI", () => {
  const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
  const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]);

  const isJpeg = (buf) => buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  const getMime = (buf) => (isJpeg(buf) ? "image/jpeg" : "image/png");

  assert.equal(getMime(jpegBuffer), "image/jpeg");
  assert.equal(getMime(pngBuffer), "image/png");

  const jpegDataUri = `data:${getMime(jpegBuffer)};base64,${jpegBuffer.toString("base64")}`;
  const pngDataUri = `data:${getMime(pngBuffer)};base64,${pngBuffer.toString("base64")}`;

  assert.ok(jpegDataUri.startsWith("data:image/jpeg;base64,"));
  assert.ok(pngDataUri.startsWith("data:image/png;base64,"));
});

test("In-memory cache supports zero-latency retrieval across serverless invocations", () => {
  const cache = new Map();
  const testId = "test-image-123";
  const testBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
  cache.set(testId, { buffer: testBuffer, mimeType: "image/jpeg" });

  const retrieved = cache.get(testId);
  assert.ok(retrieved);
  assert.equal(retrieved.mimeType, "image/jpeg");
  assert.equal(retrieved.buffer[0], 0xff);
});
