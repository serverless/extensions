# This file is used to build the extension's Docker image.

# Use a slim version of node that is compatible with the project
FROM node:20-alpine as builder

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
