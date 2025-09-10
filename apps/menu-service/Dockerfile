# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy the package.json and package-lock.json files
COPY package.json package-lock.json ./

# Install any dependencies
RUN npm ci

# Copy the rest of the application code
COPY . .

# Expose the service port
EXPOSE 4005

# Define the default command (docker-compose overrides to nodemon for dev)
CMD ["node", "index.js"]
