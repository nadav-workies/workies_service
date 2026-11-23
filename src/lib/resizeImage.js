// Shrinks a raster image to maxWidth (keeps transparency). SVG and small files pass through.
export async function resizeImage(file, maxWidth = 480) {
  if (file.type === "image/svg+xml") return file;
  const bitmap = await createImageBitmap(file);
  if (bitmap.width <= maxWidth) return file;
  const canvas = document.createElement("canvas");
  canvas.width = maxWidth;
  canvas.height = Math.round(bitmap.height * (maxWidth / bitmap.width));
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const type = file.type === "image/webp" ? "image/webp" : "image/png";
  const blob = await new Promise(r => canvas.toBlob(r, type, 0.92));
  return new File([blob], file.name.replace(/\.\w+$/, type === "image/webp" ? ".webp" : ".png"), { type });
}