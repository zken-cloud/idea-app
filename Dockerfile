# Stage 1: Build
FROM node:20-slim AS builder

WORKDIR /app

# Install openssl for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including prisma CLI)
RUN npm ci && npm cache clean --force

# Generate Prisma Client
RUN npx prisma generate

# Copy application code
COPY . .

# Build application
RUN npm run build

# Stage 2: Production
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install openssl for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 --ingroup nodejs nextjs

# Set home directory
ENV HOME=/home/nextjs
RUN mkdir -p $HOME && chown -R nextjs:nodejs $HOME

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown -R nextjs:nodejs .next

# Copy standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

# Install Prisma for runtime CLI usage (schema provisioning)
RUN npm install prisma@5.11.0 --omit=dev && npm cache clean --force

# Copy start script
COPY --from=builder /app/start.sh ./
RUN chmod +x start.sh

# Change ownership of /app and /home/nextjs to nextjs user
RUN chown -R nextjs:nodejs /app && chown -R nextjs:nodejs /home/nextjs

USER nextjs

EXPOSE 3000

ENV PORT=3000

# Run start script
CMD ["./start.sh"]
