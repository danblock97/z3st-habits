# Base stage with pnpm
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Dependencies stage
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Builder stage
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Accept build arguments
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_SITE_URL
ARG SUPABASE_SERVICE_ROLE_KEY
ARG STRIPE_WEBHOOK_SECRET
ARG STRIPE_SECRET_KEY
ARG STRIPE_PRICE_ID_PRO_MONTHLY
ARG STRIPE_PRICE_ID_PRO_YEARLY
ARG STRIPE_PRICE_ID_PLUS_MONTHLY
ARG STRIPE_PRICE_ID_PLUS_YEARLY

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:-placeholder}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL:-https://z3st.app}
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL:-https://z3st.app}
# Server-side keys needed during build for module evaluation (will be overridden at runtime)
ENV SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY:-placeholder}
ENV STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET:-placeholder}
ENV STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY:-placeholder}
ENV STRIPE_PRICE_ID_PRO_MONTHLY=${STRIPE_PRICE_ID_PRO_MONTHLY:-placeholder}
ENV STRIPE_PRICE_ID_PRO_YEARLY=${STRIPE_PRICE_ID_PRO_YEARLY:-placeholder}
ENV STRIPE_PRICE_ID_PLUS_MONTHLY=${STRIPE_PRICE_ID_PLUS_MONTHLY:-placeholder}
ENV STRIPE_PRICE_ID_PLUS_YEARLY=${STRIPE_PRICE_ID_PLUS_YEARLY:-placeholder}

# Build the application with turbopack
RUN pnpm build

# Runner stage
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Change ownership to nextjs user
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
