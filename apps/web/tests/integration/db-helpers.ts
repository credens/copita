// Guarda de seguridad + bootstrap para tests de integración: exige un
// TEST_DATABASE_URL explícito que contenga "test" en el nombre y que sea
// distinto de DATABASE_URL, para que nunca corran contra una base real por
// accidente (mismo patrón que shopy/tests/integration/tenant-isolation.test.ts).
const testUrl = process.env.TEST_DATABASE_URL;
const productionUrl = process.env.DATABASE_URL;
export const integrationTestsSafe = Boolean(testUrl && testUrl !== productionUrl && /test/i.test(testUrl));

if (integrationTestsSafe) process.env.DATABASE_URL = testUrl;

process.env.TOKEN_ENCRYPTION_KEY ||= "0".repeat(64);
process.env.SESSION_SECRET ||= "test-session-secret-not-for-production";
process.env.APP_URL ||= "http://localhost:3000";
process.env.MP_WEBHOOK_SECRET ||= "test-webhook-secret";

export async function getTestDb() {
  const { db } = await import("@copita/db");
  return db;
}
