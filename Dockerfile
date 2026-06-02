# ─────────────────────────────────────────────────────────
# Stage 1 – Dependências
# ─────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ─────────────────────────────────────────────────────────
# Stage 2 – Build
# ─────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variáveis necessárias apenas no build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# ─────────────────────────────────────────────────────────
# Stage 3 – Runner (imagem final enxuta)
# ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Dependências nativas (sharp para otimização de imagem)
RUN apk add --no-cache libc6-compat

# Usuário sem privilégios de root
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Copia apenas o que o standalone precisa
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Pasta de uploads gravável pelo usuário nextjs (volume vazio herda esta permissão)
RUN mkdir -p /app/public/uploads/brinquedos /app/public/uploads/eventos /app/public/uploads/comprovantes \
 && chown -R nextjs:nodejs /app/public/uploads

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
