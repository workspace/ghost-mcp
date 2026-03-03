FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

FROM node:20-alpine AS production
LABEL org.opencontainers.image.source="https://github.com/workspace/ghost-mcp"
LABEL org.opencontainers.image.description="MCP server for Ghost CMS"
LABEL org.opencontainers.image.licenses="ISC"
RUN addgroup -g 1001 -S nodejs && adduser -S ghostmcp -u 1001 -G nodejs
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=builder /app/dist/ ./dist/
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
USER ghostmcp
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1
CMD ["node", "dist/sse.js"]
