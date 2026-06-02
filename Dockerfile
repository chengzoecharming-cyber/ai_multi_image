FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
RUN apk add --no-cache vips-dev
ENV PRISMA_CLI_BINARY_TARGETS=linux-musl-openssl-3.0.x
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# 清除可能缓存的 debian 引擎，强制重新生成 musl 引擎
RUN rm -rf node_modules/.prisma node_modules/@prisma/client
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
RUN apk add --no-cache vips
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3002
ENV HOSTNAME=0.0.0.0

# 只带运行所需文件
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3002
CMD ["npm","run","start"]
