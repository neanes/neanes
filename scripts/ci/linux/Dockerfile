FROM node:24-bookworm-slim AS node

FROM ubuntu:24.04

COPY --from=node /usr/local /usr/local

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates dbus fonts-dejavu-core fonts-liberation fonts-noto-color-emoji \
    g++ git libasound2t64 libatk-bridge2.0-0t64 libgbm1 libgtk-3-0t64 libnss3 \
    libxss1 make python3 xauth xvfb \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --uid 1001 --create-home --shell /bin/bash tester \
    && corepack enable npm

ENV COREPACK_HOME=/opt/corepack
WORKDIR /workspace
COPY package.json package-lock.json electron-builder.json ./
RUN npm ci \
    && node -e "require('electron')" \
    && mkdir -p /artifacts/tmp \
    && chown -R tester:tester /workspace /artifacts /opt/corepack \
    && chown root:root node_modules/electron/dist/chrome-sandbox \
    && chmod 4755 node_modules/electron/dist/chrome-sandbox

COPY --chown=tester:tester . .
ENV CI=true TZ=Etc/UTC TMPDIR=/artifacts/tmp
USER tester

ENTRYPOINT ["dbus-run-session", "--", "xvfb-run", "--auto-servernum", "--server-args=-screen 0 1280x1024x24", "bash", "scripts/ci/linux/run.sh"]
CMD ["all"]
