// Large photographs are decoded and resized in the browser before transfer.
// There is no input byte ceiling; server requests only carry the publication derivative.
export async function prepareMediaUpload(file, preset = "landscape") {
  if (!file || !/\.(jpe?g|png|webp)$/i.test(file.name) || file.size < 1)
    throw new Error("Choose a JPEG, PNG or WebP photograph.");
  const dimensions = {
    landscape: [1600, 1000],
    square: [1200, 1200],
    portrait: [1000, 1400],
  };
  if (!dimensions[preset]) throw new Error("Choose an image format.");
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
    const [w, h] = dimensions[preset];
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#f6f6f3";
    ctx.fillRect(0, 0, w, h);
    const scale = Math.min(w / bitmap.width, h / bitmap.height);
    ctx.drawImage(
      bitmap,
      (w - bitmap.width * scale) / 2,
      (h - bitmap.height * scale) / 2,
      bitmap.width * scale,
      bitmap.height * scale,
    );
    return canvas.toDataURL("image/jpeg", 0.88).split(",")[1];
  } catch {
    throw new Error(
      "This image could not be decoded by your browser. Try the original JPEG, PNG or WebP export.",
    );
  } finally {
    bitmap?.close();
  }
}
