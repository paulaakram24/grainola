# ──────────── Builder ───────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Install everything (incl. devDependencies — we need TypeScript to compile)
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ──────────── Runtime ───────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install only the production deps — smaller image, no TypeScript at runtime
COPY package.json package-lock.json* ./
RUN npm install --omit=dev --no-audit --no-fund

# Copy the compiled JS output from the builder stage
COPY --from=builder /app/dist ./dist

EXPOSE 4000
CMD ["node", "dist/server.js"]
