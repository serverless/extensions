# Use a slim version of node that is compatible with the project
FROM node:20-slim as builder

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install npm dependencies
RUN npm install

# Copy the source code into the Docker image
COPY . .

# Use a slim version for the production image
FROM node:20-slim

# Set the working directory to /app
WORKDIR /app

# Copy built node modules and binaries without including the entire node_modules directory
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app .

# Set entrypoint to run the application
ENTRYPOINT ["node", "src/index.js"]
