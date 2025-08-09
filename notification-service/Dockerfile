FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY src ./src
ENV NODE_ENV=production
EXPOSE 5003
CMD ["node", "src/index.js"]
