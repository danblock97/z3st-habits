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

# Accept build arguments for NEXT_PUBLIC_* vars (must be set at build time)
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_SITE_URL
ARG STRIPE_PRICE_ID_PRO_MONTHLY
ARG STRIPE_PRICE_ID_PRO_YEARLY
ARG STRIPE_PRICE_ID_PLUS_MONTHLY
ARG STRIPE_PRICE_ID_PLUS_YEARLY

# Set build-time environment variables
# NEXT_PUBLIC_* vars are embedded into the bundle at build time
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL:-https://placeholder.supabase.co}
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder}
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:-pk_test_placeholder}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL:-https://z3st.app}
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL:-https://z3st.app}
# Server-side secrets use placeholders during build - will be overridden at runtime
ENV SUPABASE_SERVICE_ROLE_KEY=placeholder
ENV STRIPE_WEBHOOK_SECRET=placeholder
ENV STRIPE_SECRET_KEY=placeholder
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
