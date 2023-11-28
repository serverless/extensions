FROM node:20-bookworm as build

WORKDIR /app

COPY . .

RUN npm i && npm run build

FROM node:20-bookworm

COPY --from=build /app/dist/index.mjs /app/index.mjs
COPY --from=build /app/node_modules /app/node_modules

ENTRYPOINT ["node", "/app/index.mjs"]