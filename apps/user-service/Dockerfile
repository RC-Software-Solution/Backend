# Use an official Node.js runtime as a parent image
FROM node:18

# Set the working directory in the container
WORKDIR /apps

# Copy the package.json and package-lock.json files
COPY package*.json ./

# Install any dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Make port 4001 available to the world outside this container
EXPOSE 4001

# Define the command to run your app using node
CMD ["node", "index.js"]
