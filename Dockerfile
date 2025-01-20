FROM node:22-alpine AS base

RUN npm install -g pnpm

FROM base AS build
WORKDIR /app

COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm run build

EXPOSE 8787

CMD [ "pnpm", "start" ]

