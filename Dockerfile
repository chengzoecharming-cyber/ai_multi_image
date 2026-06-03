FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache openssl
ENV PRISMA_CLI_BINARY_TARGETS=linux-musl-openssl-3.0.x
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
RUN apk add --no-cache openssl vips-dev
ENV PRISMA_CLI_BINARY_TARGETS=linux-musl-openssl-3.0.x
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# 清除已有客户端，强制按当前 schema 与 musl 目标重新生成
RUN rm -rf node_modules/.prisma node_modules/@prisma/client
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
RUN apk add --no-cache openssl vips
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3002
ENV HOSTNAME=0.0.0.0
ENV PRISMA_CLI_BINARY_TARGETS=linux-musl-openssl-3.0.x

# 只带运行所需文件
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3002
CMD ["npm","run","start"]
