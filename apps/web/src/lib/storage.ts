import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";

// Adaptado de shopy/apps/web/src/lib/storage.ts. Copita no tiene noción de
// tenant/tienda: el namespace de cada archivo es directamente el creador
// (users/{userId}/{kind}/...), no hace falta una capa extra.
export const IMAGE_TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" } as const;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const IMAGE_CONTENT_TYPES = Object.keys(IMAGE_TYPES) as [keyof typeof IMAGE_TYPES, ...Array<keyof typeof IMAGE_TYPES>];

export const UPLOAD_KINDS = ["avatar", "banner"] as const;
export type UploadKind = (typeof UPLOAD_KINDS)[number];

function config() {
  const endpoint = process.env.S3_ENDPOINT;
  const region = process.env.S3_REGION ?? "us-east-1";
  const bucket = process.env.S3_BUCKET;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  const publicUrl = process.env.S3_PUBLIC_URL;
  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey || !publicUrl) throw new Error("Storage S3 no configurado");
  return { endpoint, region, bucket, accessKeyId, secretAccessKey, publicUrl: publicUrl.replace(/\/$/, "") };
}

function client(value: ReturnType<typeof config>) {
  return new S3Client({
    region: value.region,
    endpoint: value.endpoint,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
    credentials: { accessKeyId: value.accessKeyId, secretAccessKey: value.secretAccessKey },
  });
}

export function storageReady() {
  try {
    config();
    return true;
  } catch {
    return false;
  }
}

function keyPrefix(userId: string, kind: UploadKind) {
  return `users/${userId}/${kind}`;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function createImageUpload(input: { userId: string; kind: UploadKind; contentType: keyof typeof IMAGE_TYPES; contentLength: number }) {
  const value = config();
  const key = `${keyPrefix(input.userId, input.kind)}/${randomUUID()}.${IMAGE_TYPES[input.contentType]}`;
  const command = new PutObjectCommand({
    Bucket: value.bucket,
    Key: key,
    ContentType: input.contentType,
    ContentLength: input.contentLength,
    CacheControl: "public, max-age=31536000, immutable",
  });
  const uploadUrl = await getSignedUrl(client(value), command, { expiresIn: 300, signableHeaders: new Set(["content-type", "content-length"]) });
  return { uploadUrl, publicUrl: `${value.publicUrl}/${key}`, expiresIn: 300 };
}

// Best-effort: si falla (URL de otro storage, ya borrada, etc.) el llamador
// puede ignorarlo — no vale la pena romper el guardado del perfil por esto.
export async function deleteOwnedImage(input: { userId: string; kind: UploadKind; url: string }) {
  const value = config();
  const prefix = `${value.publicUrl}/`;
  if (!input.url.startsWith(prefix)) return;
  const key = input.url.slice(prefix.length);
  const escapedPrefix = escapeRegex(keyPrefix(input.userId, input.kind));
  if (!new RegExp(`^${escapedPrefix}/[a-f0-9-]+\\.(jpg|png|webp|gif)$`).test(key)) return;
  await client(value).send(new DeleteObjectCommand({ Bucket: value.bucket, Key: key }));
}
