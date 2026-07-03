// Client-side image compression: resize + convert to WebP before upload, so the
// site only ever stores/serves small optimized files. Runs entirely in the browser.

const DEFAULTS = { maxDim: 1600, quality: 0.8 };

/** Compress an image File to a WebP Blob. Throws on non-image / decode failure. */
export async function compressToWebp(file, opts = {}) {
  const { maxDim, quality } = { ...DEFAULTS, ...opts };
  if (!file || !file.type?.startsWith("image/")) {
    throw new Error("Please choose an image file.");
  }

  // Decode with EXIF orientation applied where supported (phone photos); fall
  // back to an <img> load if createImageBitmap or its options aren't supported.
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" }).catch(() => null);
  const source = bitmap ?? (await loadViaImg(file));

  const width = source.naturalWidth || source.width;
  const height = source.naturalHeight || source.height;
  if (!width || !height) throw new Error("Could not read that image.");

  const scale = Math.min(1, maxDim / Math.max(width, height));
  const w = Math.max(1, Math.round(width * scale));
  const h = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d").drawImage(source, 0, 0, w, h);
  if (bitmap?.close) bitmap.close();

  const blob = await new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Could not process that image."))),
      "image/webp",
      quality
    )
  );
  return blob;
}

// Fallback decode for browsers without createImageBitmap orientation support.
function loadViaImg(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not load that image."));
    };
    img.src = url;
  });
}
