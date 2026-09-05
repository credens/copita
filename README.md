# Copita

Micro-mecenazgo para creadores de contenido: cada "copita" es un aporte chico (base ~$1 USD, cobrado en ARS al tipo de cambio del día), pago único o suscripción mensual ("Club de Copita"), con Mercado Pago repartiendo el pago entre el creador y la plataforma en el mismo cobro.

Ver [ROADMAP.md](../ROADMAP.md) para el plan completo por fases. Este repo implementa:

- **Fase 0-3** (fundaciones, onboarding, cobro de copita suelta): funcional de punta a punta.
- **Fase 4** (suscripciones): funcional, con una salvedad importante — ver abajo.
- **Fase 5-8** (contenido exclusivo, dashboard interno, descubrimiento, legales): scaffolding con contenido placeholder, pendientes de decisiones de negocio.

## Setup

```bash
npm install
cp .env.example .env   # completar credenciales de Mercado Pago y DB
npm run db:generate
npm run db:migrate
npm run dev
```

## ⚠️ Límite real de las suscripciones (Fase 4)

La API de Checkout Pro de Mercado Pago soporta `marketplace_fee` para repartir un pago único entre el creador y Copita en el mismo cobro. **La API de suscripciones (Preapproval) no tiene ese campo** — no hay forma de que Mercado Pago divida automáticamente un cobro recurrente entre dos cuentas.

Por eso, para el Club de Copita:

1. La suscripción se cobra **completa** a la cuenta del creador (vía `Preapproval` con su `access_token`).
2. La comisión de Copita sobre cada cobro recurrente queda registrada como `Commission` con estado `PENDING` — no se descuenta sola.
3. La liquidación de esa comisión hoy es un **proceso manual/aparte** (ej. débito periódico a la cuenta del creador, o descuento acordado). El panel de administración (Fase 6, `/admin`) lista la comisión pendiente por creador para poder liquidarla — no hay automatización de cobro todavía.

Si Mercado Pago libera una forma de aplicar `application_fee`/split sobre `Preapproval` en el futuro, este es el lugar para revisitar (`src/lib/mercadopago-subscriptions.ts`).

## Botón de arrepentimiento y baja de servicio

Requeridos por Disposición 954/2025 (visibles desde el primer acceso, en lugar destacado) y Disposición 3/2026 (verificación de identidad razonable, sin convertirla en barrera). Implementados en `/arrepentimiento` y `/baja`, enlazados en una barra fija en todo el sitio (`RootLayout`) y en una sección propia de la home.

Como el aportante no tiene cuenta ni login, la única verificación disponible es el email con el que pagó — cualquiera que lo conozca puede buscar y accionar sobre esos registros. Es la misma barrera (baja) que ya existe para todo lo demás en el producto, y una verificación más dura (DNI, código por SMS) agregaría fricción que la Disposición 3/2026 prohíbe. Si esto no es suficiente para el caso de uso real, hay que sumar una verificación por email (link de confirmación) antes de ejecutar la acción — hoy no existe infraestructura de envío de mail en el proyecto.

**Importante:** el plazo de 10 días corridos que usa `/arrepentimiento` (`src/lib/consumer-rights.ts`) es el piso general de la Ley 24.240 art. 34 — no verifiqué si Disposición 954/2025 fija un plazo distinto para este tipo de producto. Confirmar antes de lanzar.

## Moneda

Mercado Pago Argentina liquida en ARS. Un creador define el precio de su copita en **USD de referencia** (por defecto 1). Al momento del cobro, `src/lib/fx.ts` resuelve la cotización oficial del día (dolarapi.com, con fallback a `USD_ARS_FALLBACK_RATE`) y `src/lib/pricing.ts` calcula el monto real en ARS, redondeado a un número prolijo.

## Subida de avatar/banner

Avatar y banner se suben directo a S3 (o compatible: MinIO, R2, DO Spaces) vía URL prefirmada — el servidor de Next.js nunca ve los bytes del archivo, solo firma el `PUT` (`src/lib/storage.ts`, mismo patrón que `shopy`). El navegador optimiza la imagen antes de subir (máx. 2000px, reencodeada a WebP) en `src/lib/image-optimize.ts`.

Sin `S3_*` configurado en el entorno, la carga falla con un mensaje claro en el panel — el resto del sitio sigue andando igual.

## Multa por contenido +18 no declarado

No hay clasificador de contenido automático — un admin flaguea manualmente desde `/admin` cuando detecta +18 sin declarar (`ContentViolation`, `src/lib/content-violations.ts`). Devenga **10 USD de referencia por día** (el equivalente a "10 copitas" al valor base, no al precio particular del creador) desde que se detecta hasta que se resuelve.

Cómo se cobra de verdad: Copita no puede debitarle plata a un creador fuera de una transacción — el dinero nunca pasa por una cuenta de Copita. Así que la deuda pendiente se suma como un extra sobre el `marketplace_fee` normal en las **próximas copitas reales** del creador (tope: 90% de lo que quede después de la comisión normal, para no dejarlo en $0 en una sola copita — ver `checkout/copita/route.ts`). Si esa copita se reembolsa, lo cobrado por la multa también se revierte (webhook).

Declarar el perfil como +18 en `/panel/perfil` resuelve la multa sola y corta que siga creciendo — lo ya devengado se sigue debiendo y cobrando igual.

## Tests

Tres niveles, cada uno cubre lo que el anterior no puede:

- **Unit** (`apps/web/src/lib/*.test.ts`): funciones puras — fee, redondeo de precio, cifrado, hash de contraseña, cotización FX (con `fetch` mockeado). No tocan base de datos ni red real.
- **Integración** (`apps/web/tests/integration/*.test.ts`): llaman a los route handlers reales (`register`, `login`, `checkout/copita`, `webhooks/mercadopago`, cancelación/reembolso de `self-service`) contra una base Postgres de verdad, con `fetch` mockeado solo para las llamadas salientes a Mercado Pago. Corren contra `TEST_DATABASE_URL`, nunca contra `DATABASE_URL`. **Quedan afuera a propósito** las rutas que dependen de `cookies()`/`headers()` de Next (`/api/panel/perfil`, la conexión OAuth de Mercado Pago) — esas APIs solo funcionan dentro de un request real de Next, así que las cubre el e2e.
- **E2E** (`apps/web/e2e/*.spec.ts`, Playwright): recorre la app real en un navegador (registro → panel → editar perfil → perfil público → logout) contra un `next dev` levantado para el test. No depende de credenciales reales de Mercado Pago — verifica el estado "no conectado".

Setup local:

```bash
createdb copita_test
cp .env.test.example .env.test   # ajustá TEST_DATABASE_URL si tu Postgres no usa el usuario "postgres"
DATABASE_URL="$(grep TEST_DATABASE_URL .env.test | cut -d= -f2- | tr -d '"')" npx prisma migrate deploy --schema packages/db/prisma/schema.prisma
npx playwright install chromium

npm run test:unit
npm run test:integration
npm run test:e2e        # o npm test para unit+integración
```

`.env.test` nunca se commitea (mismo trato que `.env`) porque el usuario/host de Postgres varía por máquina — `.env.test.example` es la plantilla. CI (`.github/workflows/ci.yml`) no depende de ningún archivo `.env*`: define sus propias variables contra un contenedor de Postgres efímero.
