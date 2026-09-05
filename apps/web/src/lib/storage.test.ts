import assert from "node:assert/strict";
import test from "node:test";

function setFakeS3Env() {
  process.env.S3_ENDPOINT = "https://s3.fake-region.example.com";
  process.env.S3_REGION = "fake-region";
  process.env.S3_BUCKET = "copita-test-bucket";
  process.env.S3_ACCESS_KEY_ID = "FAKEKEYID";
  process.env.S3_SECRET_ACCESS_KEY = "fake-secret-access-key";
  process.env.S3_PUBLIC_URL = "https://cdn.fake.example.com/";
}

function clearS3Env() {
  for (const key of ["S3_ENDPOINT", "S3_REGION", "S3_BUCKET", "S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY", "S3_PUBLIC_URL"]) delete process.env[key];
}

test("storageReady is false without S3 env vars and true once configured", async () => {
  clearS3Env();
  const { storageReady } = (await import(`./storage.ts?case=${Math.random()}`)) as typeof import("./storage");
  assert.equal(storageReady(), false);
  setFakeS3Env();
  assert.equal(storageReady(), true);
  clearS3Env();
});

// getSignedUrl calcula la firma SigV4 localmente — no pega contra la red —
// así que se puede probar con credenciales falsas sin un S3 real.
test("createImageUpload arma una URL firmada y una publicUrl con el prefijo users/{userId}/{kind}", async () => {
  setFakeS3Env();
  const { createImageUpload } = (await import(`./storage.ts?case=${Math.random()}`)) as typeof import("./storage");

  const result = await createImageUpload({ userId: "user_123", kind: "avatar", contentType: "image/webp", contentLength: 12345 });

  assert.match(result.uploadUrl, /^https:\/\/copita-test-bucket\.s3\.fake-region\.example\.com\//);
  assert.match(result.uploadUrl, /X-Amz-Signature=/);
  assert.match(result.publicUrl, /^https:\/\/cdn\.fake\.example\.com\/users\/user_123\/avatar\/[0-9a-f-]+\.webp$/);
  assert.equal(result.expiresIn, 300);

  clearS3Env();
});

test("createImageUpload usa la extensión correcta según el content type", async () => {
  setFakeS3Env();
  const { createImageUpload } = (await import(`./storage.ts?case=${Math.random()}`)) as typeof import("./storage");

  const png = await createImageUpload({ userId: "user_456", kind: "banner", contentType: "image/png", contentLength: 1 });
  assert.match(png.publicUrl, /\.png$/);

  clearS3Env();
});

test("createImageUpload rechaza cuando falta configuración S3", async () => {
  clearS3Env();
  const { createImageUpload } = (await import(`./storage.ts?case=${Math.random()}`)) as typeof import("./storage");
  await assert.rejects(() => createImageUpload({ userId: "user_789", kind: "avatar", contentType: "image/jpeg", contentLength: 1 }), /Storage S3 no configurado/);
});

test("deleteOwnedImage no intenta borrar una URL que no pertenece al bucket configurado", async () => {
  setFakeS3Env();
  const { deleteOwnedImage } = (await import(`./storage.ts?case=${Math.random()}`)) as typeof import("./storage");
  // No debe lanzar ni intentar una llamada real: la URL no matchea el publicUrl configurado.
  await deleteOwnedImage({ userId: "user_123", kind: "avatar", url: "https://otro-storage.example.com/algo.jpg" });
  clearS3Env();
});

test("deleteOwnedImage no intenta borrar una URL de otro usuario o kind", async () => {
  setFakeS3Env();
  const { deleteOwnedImage } = (await import(`./storage.ts?case=${Math.random()}`)) as typeof import("./storage");
  await deleteOwnedImage({ userId: "user_123", kind: "avatar", url: "https://cdn.fake.example.com/users/otro-user/avatar/abc.jpg" });
  await deleteOwnedImage({ userId: "user_123", kind: "avatar", url: "https://cdn.fake.example.com/users/user_123/banner/abc.jpg" });
  clearS3Env();
});
