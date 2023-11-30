# Use a slim version of node that is compatible with the project
FROM node:20-alpine as builder

# Update the package list and install unzip and zip
# RUN apt-get update && apt-get install -y unzip zip
RUN apk add docker-cli-buildx
# Set the working directory to /app
WORKDIR /app

# Copy the source code into the Docker image
COPY . .

# Install npm dependencies, including esbuild
RUN npm i

# Compile TypeScript files and check for errors
RUN npx tsc --noEmitOnError

# Use esbuild to compile TypeScript files
RUN npx esbuild src/index.ts --bundle --platform=node --outfile=dist/app.js

# Use node to run the compiled JavaScript file
ENTRYPOINT ["node", "dist/app.js"]