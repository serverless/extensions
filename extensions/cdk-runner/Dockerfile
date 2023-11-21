FROM node:20-alpine

WORKDIR /app
COPY . .
RUN mkdir /.npm && chown -R 501:20 "/.npm"
RUN npm i
RUN npm run build
RUN rm -rf node_modules && rm package.json && rm package-lock.json && rm -rf src
RUN npm install @aws-cdk/cli-lib-alpha@2.109.0-alpha.0
ENTRYPOINT [ "node", "dist/index.js" ]