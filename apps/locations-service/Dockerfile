FROM node:20-alpine

# Set the working directory in the container
WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

# Copy the rest of the application code
COPY . .

EXPOSE 4004

CMD ["node", "index.js"]
