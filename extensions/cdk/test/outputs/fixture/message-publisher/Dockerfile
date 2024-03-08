# This file is used to build the extension's Docker image.

# Use a slim version of node that is compatible with the project
FROM node:20-alpine as builder

# Set the working directory to /app
WORKDIR /app

# Copy the source code into the Docker image
COPY . .

# Install npm dependencies
RUN npm i

# Use node to run the compiled JavaScript file
ENTRYPOINT ["node", "index.js"]
