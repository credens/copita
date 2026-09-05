# Copita — Roadmap

Micro-mecenazgo para creadores de contenido: cada "copita" = ~$1 USD (o su equivalente en ARS), pago único o suscripción mensual, con Mercado Pago repartiendo el pago entre el creador y la plataforma en el mismo cobro.

Referencia de diseño: [artifact con las 4 direcciones visuales](https://claude.ai/code/artifact/05ea9a33-5af2-4b94-8d48-245a42949e0b) (Brindis / Almacén / Recibo / Club). **Elegida: Recibo** — neobrutalista, off-white con bordes negros gruesos, sombra dura, pop coral y un sticker de precio pegado. El artifact abre en esa variante por defecto.

Implementación de pagos con split ya resuelta y funcionando en un proyecto hermano: [`../shopy`](../shopy). Ese código es la base de las fases 2 y 3 de abajo — no reinventar, portar y adaptar.

---

## Fase 0 — Decisiones antes de escribir código

- [x] Elegir dirección visual → **Recibo** (neobrutalista: off-white, bordes negros, sombra dura, coral, sticker de precio) — implementada en `apps/web/src/app/globals.css`
- [x] Elegir stack → **copiado de shopy**: monorepo `apps/web` (Next.js App Router) + `packages/db` (`@copita/db`, Prisma)
- [x] Moneda: **precio en USD de referencia por creador, cobrado en ARS al tipo de cambio oficial del día** (dolarapi.com, con fallback fijo por env). Ver `src/lib/fx.ts` y `src/lib/pricing.ts`.
- [x] Comisión de Copita: **5% fijo** (`PLATFORM_FEE_RATE_BPS = 500`), configurable por creador vía `feeType`/`feeValue`/`feeMin`/`feeMax` igual que shopy.
- [x] Suscripciones mensuales **sí entran** en el alcance inicial — con la salvedad de Fase 4 (ver abajo).

## Fase 1 — Fundaciones del proyecto ✅

- [x] Scaffold del monorepo (`apps/web`, `packages/db`) con la config de `shopy` (tsconfig, eslint, prisma workspace)
- [x] Modelo de datos en Prisma (`packages/db/prisma/schema.prisma`):
  - `User` hace de creador + cuenta de auth en uno (perfil público + campos `mp*` + fee, sin la capa Tenant/Store/Membership de shopy — acá no hace falta)
  - `Copita` (aporte suelto): monto ARS, referencia USD, cotización usada, mensaje, remitente, estado de pago
  - `Subscription` / `SubscriptionPayment` (Club de Copita)
  - `Commission`: por copita o por pago de suscripción, con estado `PENDING` / `COLLECTED` / `REVERSED`
  - `PaymentEvent`: idempotencia de webhooks (pagos y preapprovals)
- [x] Auth de creadores con email + contraseña (sesión firmada HMAC en cookie, `src/lib/auth.ts`) — sin magic link ni verificación de email por ahora, para no sumar infraestructura de mail que el alcance no pedía
- [x] `.env.example` con `MP_CLIENT_ID`, `MP_CLIENT_SECRET`, `MP_WEBHOOK_SECRET`, `APP_URL`, `TOKEN_ENCRYPTION_KEY`, `DATABASE_URL`, más las nuevas `USD_ARS_FALLBACK_RATE` y `PLATFORM_ADMIN_EMAILS`

## Fase 2 — Onboarding de creadores + perfil público ✅

- [x] Registro y claim de username (`copita.ar/tunombre`) — `/registro`, `/api/auth/register`
- [x] Conectar Mercado Pago vía OAuth + PKCE, portado de shopy y adaptado a `User` (sin `Store`):
  - `src/app/api/integrations/mercadopago/connect/route.ts`
  - `src/app/api/integrations/mercadopago/callback/route.ts`
  - `src/lib/secrets.ts` (cifrado AES-256-GCM de los tokens)
- [x] Página pública de perfil (`/[username]`): banner, avatar, tags, "Invitar una copita", muro de apoyos recientes
- [x] Editor de perfil (`/panel/perfil`): foto, bio, tags, precio de la copita, activar/desactivar y precio del club

## Fase 3 — Cobro de una copita suelta ✅

- [x] Endpoint de checkout (`/api/checkout/copita`): preferencia de Checkout Pro con `marketplace_fee`, probado end-to-end contra la API real de Mercado Pago
- [x] Refresco automático de tokens vencidos — `src/lib/mercadopago.ts` (`sellerAccessToken`)
- [x] Webhook de Mercado Pago (`/api/webhooks/mercadopago`) con validación de firma `x-signature` + reconciliación idempotente

**Flujo técnico del split (referencia interna — esto no va en el sitio, es solo para quien programa):**

1. Cada creador conecta su propia cuenta por OAuth (`state` + PKCE). Access y refresh token quedan cifrados con AES-256-GCM — Copita nunca ve ni mueve esa plata.
2. El cobro se crea con la cuenta del creador: Copita arma la preferencia de Checkout Pro usando el `access_token` del creador y agrega `marketplace_fee` (la comisión de Copita) en el mismo request.
3. Mercado Pago separa la plata al cobrar: de un solo pago salen la comisión de MP, el `marketplace_fee` de Copita y el resto directo a la cuenta del creador. Nadie mueve un CVU a mano.
4. Un webhook confirma antes de acreditar: Mercado Pago avisa por `x-signature` (HMAC), Copita valida la firma, pide el pago real a la API y recién ahí marca la copita como cobrada.
- [ ] Mensaje/nombre opcional del que manda la copita, visible en el muro público
- [x] Página de agradecimiento post-pago (éxito / pendiente / fallido) — `/[username]/gracias`
- [x] Panel del creador: historial de copitas recibidas y comisión retenida — `/panel/copitas`

## Fase 4 — Suscripción mensual ("Club de Copita") ⚠️

Confirmado contra la documentación oficial: **Preapproval no admite `marketplace_fee` / `application_fee`** — no hay forma de que Mercado Pago reparta un cobro recurrente entre creador y Copita en el mismo pago (a diferencia de Checkout Pro). Ver el límite documentado en el `README.md` del código.

- [x] Investigar límites reales de suscripciones + split → confirmado que no existe split nativo en Preapproval
- [x] Modelar `Subscription` / `SubscriptionPayment` (creador, aportante, monto, estado, próxima fecha de cobro)
- [x] Webhook de autorización / renovación / cancelación de suscripción (`subscription_preapproval`, `subscription_authorized_payment`)
- [ ] Beneficios exclusivos por nivel de suscripción (acceso a posts/adelantos bloqueados) → sigue en Fase 5
- [ ] **Pendiente real:** proceso de liquidación de la comisión de suscripción (hoy queda como `Commission` en estado `PENDING`, visible en `/admin`, sin cobro automatizado)

## Fase 5 — Contenido exclusivo y comunidad (scaffold)

- [x] Modelo `Post` con visibilidad `PUBLIC` / `CLUB` y página `/[username]/club` — **falta** el control de acceso real por membresía activa del aportante (hoy solo lista posts públicos, ver nota en la página)
- [ ] Notificaciones al creador (email o push) por cada copita nueva
- [ ] Exportar/objetar historial de copitas (para que el creador lleve su propia contabilidad)

## Fase 6 — Operación de la plataforma (vos, como dueño) (parcial)

- [x] Dashboard interno (`/admin`, gateado por `PLATFORM_ADMIN_EMAILS`): comisión cobrada y pendiente, copitas totales, MRR, creadores conectados
- [ ] Página de estado de cada creador (conectado a MP / pendiente / con error de token)
- [ ] Proceso de soporte para pagos rechazados o reembolsos (existe endpoint de cancelación de suscripción en `/api/panel/suscripcion`, falta flujo de soporte completo)
- [ ] Facturación propia: como plataforma cobrando comisión en Argentina, definir con un contador si corresponde monotributo/factura por la comisión retenida — **decisión de negocio, no técnica, sigue pendiente**

## Fase 7 — Descubrimiento y crecimiento (parcial)

- [x] Página "Explorar creadores" (`/explorar`) — lista creadores conectados; falta categorías/tags como filtro real
- [ ] Buscador de perfiles
- [ ] SEO básico de perfiles públicos (OG tags, sitemap)
- [ ] Botón/widget embebible para poner en otros sitios ("mandame una copita")

## Fase 8 — Pulido de lanzamiento (placeholders)

- [ ] Términos y condiciones, política de privacidad, política de reembolsos → páginas creadas (`/terminos`, `/privacidad`, `/reembolsos`) con contenido de **borrador**, marcadas como pendientes de asesoría legal
- [ ] Analítica de producto (altas de creadores, conversión de visita → copita)
- [ ] Responsive / accesibilidad del perfil público y el checkout
- [x] Aplicar la dirección **Recibo** al sitio real — implementada en `apps/web/src/app/globals.css` y usada en todas las páginas

---

## Riesgos y preguntas abiertas

- **Moneda:** resuelto — se cobra en ARS al tipo de cambio oficial del día (`src/lib/fx.ts`), redondeado a un monto prolijo. Riesgo aceptado: el precio percibido en ARS varía día a día.
- **Suscripciones + split:** resuelto (negativamente) — confirmado que Mercado Pago **no** permite `marketplace_fee` sobre Preapproval. La suscripción se cobra completa a nombre del creador y la comisión de Copita queda pendiente de liquidar aparte (ver `README.md`). Sigue siendo un proceso manual sin automatizar.
- **KYC del creador:** Mercado Pago exige que la cuenta del creador esté verificada para recibir pagos vía marketplace — sumar un chequeo de estado de cuenta en el onboarding, no asumir que "conectar" ya garantiza poder cobrar.
- **Impuestos sobre tu comisión:** cobrar un % de cada copita es un ingreso real de la plataforma — validar con un contador el régimen impositivo antes de lanzar a producción, no solo la parte técnica.

## Variables de entorno (de referencia, ver `shopy/docs/phase-2-payments.md`)

```env
MP_CLIENT_ID="..."
MP_CLIENT_SECRET="..."
MP_WEBHOOK_SECRET="..."
APP_URL="https://copita.ar"
TOKEN_ENCRYPTION_KEY="64-caracteres-hexadecimales"
DATABASE_URL="postgres://..."
```

La Redirect URL en Mercado Pago debe ser `${APP_URL}/api/integrations/mercadopago/callback`. El webhook debe apuntar a `${APP_URL}/api/webhooks/mercadopago` y escuchar eventos **Payment** y **Order**.
