FROM node:24-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:24-bookworm-slim AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_SITE_URL=https://richrussiancommunity.com
ARG NEXT_PUBLIC_RRC_TELEGRAM
ARG NEXT_PUBLIC_RRC_EMAIL
ARG NEXT_PUBLIC_RRC_VK
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_RRC_TELEGRAM=$NEXT_PUBLIC_RRC_TELEGRAM
ENV NEXT_PUBLIC_RRC_EMAIL=$NEXT_PUBLIC_RRC_EMAIL
ENV NEXT_PUBLIC_RRC_VK=$NEXT_PUBLIC_RRC_VK
RUN npm run build

FROM node:24-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/scripts/backup-accounts.mjs ./scripts/backup-accounts.mjs
RUN mkdir -p .next/cache var && chown -R node:node .next/cache var && chmod 700 var
USER node
EXPOSE 3000
CMD ["node", "server.js"]
