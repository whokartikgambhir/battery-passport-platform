FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src

ENV NODE_ENV=production
EXPOSE 5000

# healthcheck needs curl
RUN apk add --no-cache curl
HEALTHCHECK --interval=15s --timeout=3s --start-period=20s --retries=5 \
  CMD curl -fsS http://localhost:5000/health || exit 1

CMD ["node", "src/index.js"]
