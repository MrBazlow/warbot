# ================ #
#    Base Stage    #
# ================ #

FROM node:19-alpine as base

RUN corepack enable pnpm
RUN corepack prepare pnpm@latest --activate

# ======================== #
#    Dependencies Stage    #
# ======================== #

FROM base as dependencies

WORKDIR /opt/app
COPY package.json .
COPY tsconfig.json .
COPY src ./src
RUN pnpm install

# ================= #
#    Build Stage    #
# ================= #

FROM base as build

WORKDIR /opt/app
COPY --from=dependencies /opt/app .
RUN pnpm build
RUN pnpm prune --prod

# ================== #
#    Deploy Stage    #
# ================== #

FROM base as deploy

ENV NODE_ENV="production"

WORKDIR /opt/app
COPY --from=build /opt/app/dist ./dist
COPY --from=build /opt/app/node_modules ./node_modules
COPY --from=build /opt/app/package.json ./package.json

RUN chown node:node .

USER node

CMD [ "node", "dist/index.js" ]