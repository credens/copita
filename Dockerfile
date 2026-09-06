# Build de la imagen (necesita npm workspaces + el output "standalone" de
# Next.js — ver apps/web/next.config.mjs). No depende de una base de datos
# alcanzable durante el build: /explorar es force-dynamic justamente para
# evitarlo (ver apps/web/src/app/explorar/page.tsx).
#
# Uso:
#   docker build -t copita .
#   docker run -p 3000:3000 --env-file .env copita
#
# O más simple con todo junto (app + Postgres): ver docker-compose.yml.

FROM node:22-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/db/package.json packages/db/package.json
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# next build necesita poder resolver @prisma/client, que sale de generar el
# cliente contra el schema — no necesita una base alcanzable para esto.
RUN npm run db:generate
RUN npm run build
RUN npm run build:jobs

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 copita

COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=copita:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=copita:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/packages/db/prisma ./packages/db/prisma
COPY --from=builder --chown=copita:nodejs /app/dist-jobs ./dist-jobs

USER copita
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Migra contra la base real (DATABASE_URL del entorno) antes de levantar el
# servidor standalone — mismo prisma pineado que usa el deploy por PM2.
CMD ["sh", "-c", "npx --yes prisma@6.19.3 migrate deploy --schema packages/db/prisma/schema.prisma && node apps/web/server.js"]
