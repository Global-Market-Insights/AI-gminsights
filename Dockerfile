# Install dependencies only when needed
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm i

# Rebuild the source code only when needed
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
COPY --from=builder /app/components ./components
COPY --from=builder /app/hooks ./hooks
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/postcss.config.js ./postcss.config.js
COPY --from=builder /app/test-extraction.js ./test-extraction.js
COPY --from=builder /app/types ./types
COPY --from=builder /app/app ./app
COPY --from=builder /app/data ./data
COPY --from=builder /app/next.config.js ./next.config.js
COPY --from=builder /app/tailwind.config.js ./tailwind.config.js
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/utils ./utils
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["npm", "start"]

