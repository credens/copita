// Puerto de shopy/apps/web/src/lib/image-optimize.ts sin cambios: valida
// tipo/tamaño, achica a un máximo de 2000px y reencodea a WebP en el
// navegador antes de subir (salvo GIF, para no perder la animación).
export async function optimizeImage(file: File, maxBytes: number): Promise<File> {
  if (file.size > maxBytes) throw new Error(`${file.name} supera el límite de ${Math.round(maxBytes / 1024 / 1024)} MB`);
  if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) throw new Error(`${file.name} no tiene un formato permitido`);
  if (file.type === "image/gif") return file;

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("No se pudo procesar la imagen");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.84));
  if (!blob || blob.size >= file.size) return file;
  return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.webp`, { type: "image/webp", lastModified: Date.now() });
}
