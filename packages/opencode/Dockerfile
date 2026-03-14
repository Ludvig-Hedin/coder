FROM oven/bun:1.3.10

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ ripgrep && rm -rf /var/lib/apt/lists/*

COPY package.json bun.lock ./
COPY patches ./patches

COPY packages/opencode/package.json ./packages/opencode/
COPY packages/ui/package.json ./packages/ui/
COPY packages/util/package.json ./packages/util/
COPY packages/sdk/js/package.json ./packages/sdk/js/
COPY packages/plugin/package.json ./packages/plugin/
COPY packages/script/package.json ./packages/script/
COPY packages/slack/package.json ./packages/slack/
COPY packages/function/package.json ./packages/function/
COPY packages/web/package.json ./packages/web/
COPY packages/storybook/package.json ./packages/storybook/
COPY packages/desktop/package.json ./packages/desktop/
COPY packages/desktop-electron/package.json ./packages/desktop-electron/
COPY packages/app/package.json ./packages/app/
COPY packages/console/app/package.json ./packages/console/app/
COPY packages/console/core/package.json ./packages/console/core/
COPY packages/console/function/package.json ./packages/console/function/
COPY packages/console/mail/package.json ./packages/console/mail/
COPY packages/console/resource/package.json ./packages/console/resource/

RUN bun install

COPY packages ./packages

WORKDIR /app/packages/opencode

ENV NODE_ENV=production

RUN chmod +x ./start.sh

EXPOSE 4096

CMD ["./start.sh"]
