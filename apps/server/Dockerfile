FROM node:18-alpine AS base
RUN npm install -g pnpm

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/server/package.json ./apps/server/
COPY packages/database/package.json ./packages/database/
COPY packages/crypto/package.json ./packages/crypto/
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/server/node_modules ./apps/server/node_modules
COPY --from=deps /app/packages ./packages
COPY apps/server ./apps/server
COPY packages ./packages
RUN pnpm --filter @openverify/database db:generate && \
    pnpm --filter @openverify/database build && \
    pnpm --filter @openverify/crypto build && \
    pnpm --filter @openverify/server build

FROM base AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 express
COPY --from=builder /app/apps/server/dist ./dist
COPY --from=builder /app/apps/server/package.json .
COPY --from=builder /app/packages/database/dist ./node_modules/@openverify/database
COPY --from=builder /app/packages/crypto/dist ./node_modules/@openverify/crypto
COPY --from=builder /app/node_modules/.pnpm ./node_modules/.pnpm
USER express
EXPOSE 4000
CMD ["node", "dist/index.js"]
