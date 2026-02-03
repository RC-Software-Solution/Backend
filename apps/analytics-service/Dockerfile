FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --only=production 2>/dev/null || npm install --omit=dev

COPY . .
EXPOSE 4006

CMD ["node", "index.js"]
