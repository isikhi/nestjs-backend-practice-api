# Stage 1: Build
FROM node:22.20.0-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile

COPY . .

RUN yarn build

# Stage 2: Production Deps
FROM node:22.20.0-alpine AS deps

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install --production --frozen-lockfile

# Stage 3: Production Runtime
FROM node:22.20.0-alpine AS production

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

COPY package.json yarn.lock ./

COPY --from=deps /app/node_modules ./node_modules

COPY --from=builder /app/dist ./dist

# Change ownership to non-root user
RUN chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/v1/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/src/main.js"]
