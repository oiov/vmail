FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="${PNPM_HOME}:${PATH}"
RUN corepack enable

FROM base AS build
COPY . /usr/src/app
WORKDIR /usr/src/app
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm prune --prod
RUN pnpm run remix:build

FROM base AS remix
COPY --from=build /usr/src/app /usr/src/app
WORKDIR /usr/src/app/apps/remix
EXPOSE 3000
CMD ["pnpm", "start"]