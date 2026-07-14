// POST /api/admin/upload?name=<base>  → store a compressed WebP in Vercel Blob.
// The body is the raw image/webp bytes (bodyParser disabled). The client compresses
// to WebP before upload, so payloads stay small. Returns { url } — a public CDN URL.
import { put } from "@vercel/blob";
import { withApi, HttpError } from "../../lib/server/http.js";
import { requireAdmin } from "../../lib/server/auth.js";

// Don't parse the body — we want the raw image bytes.
export const config = { api: { bodyParser: false } };

const MAX_BYTES = 8 * 1024 * 1024; // safety cap; compressed WebP is far smaller

async function getRawBody(req) {
  if (req.rawBody) return req.rawBody; // provided by the dev plugin
  const chunks = [];
  for await (const chunk of req) chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  return Buffer.concat(chunks);
}

const cleanName = (s) =>
  String(s || "image")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "image";

export default withApi({
  async POST(req) {
    requireAdmin(req);

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      throw new HttpError(500, "Image storage isn't configured yet (missing BLOB_READ_WRITE_TOKEN).");
    }

    const body = await getRawBody(req);
    if (!body || body.length === 0) throw new HttpError(400, "No image data received");
    if (body.length > MAX_BYTES) throw new HttpError(413, "Image is too large");

    // Verify the bytes really are WebP ("RIFF"...."WEBP"), not just trust the
    // client — the blob is served publicly under our name with this extension.
    if (body.length < 12 || body.toString("ascii", 0, 4) !== "RIFF" || body.toString("ascii", 8, 12) !== "WEBP") {
      throw new HttpError(400, "File is not a WebP image");
    }

    const key = `inventory/${cleanName(req.query?.name)}.webp`;
    const { url } = await put(key, body, {
      access: "public",
      contentType: "image/webp",
      addRandomSuffix: true, // avoid collisions on same-named uploads
      token,
    });
    return { url };
  },
});
