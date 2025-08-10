FROM node:20-alpine

WORKDIR /app

# Install deps
COPY package*.json ./
RUN npm install --omit=dev

# Copy source
COPY src ./src

ENV NODE_ENV=production
EXPOSE 5003

CMD ["node", "src/index.js"]
