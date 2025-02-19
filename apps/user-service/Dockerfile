# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy the package.json and package-lock.json files
COPY package.json package-lock.json ./

# Install any dependencies
RUN npm ci --only=production

# Copy the rest of the application code
COPY . .

# Make port 4001 available to the world outside this container
EXPOSE 4001

# Define the command to run your app using node
CMD ["node", "index.js"]
