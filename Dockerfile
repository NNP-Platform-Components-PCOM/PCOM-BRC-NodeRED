# syntax=docker/dockerfile:1.7
#
# PCOM - BRC - NodeRED
# --------------------
# Node-RED runtime for the Nubo Native Platform (NNP), built on the PCOM
# Node-RED builder base. Bundles the NNP custom nodes (vendored, installed from
# a local path), a curated set of contrib nodes, default flows and branding.
#
# Build:
#   docker build -t pcom-brc-nodered:runtime-3.1.0-v2 .

ARG base_image=ghcr.io/nnp-platform-components-pcom/pcom-brc-nodered-build
ARG base_version=build-18-v1

# ---- Build stage: install node modules (incl. vendored NNP nodes) -----------
FROM ${base_image}:${base_version} AS build

WORKDIR /usr/src/node-user
COPY package.json ./
COPY vendor ./vendor
RUN chown -R node-user:root /usr/src/node-user
USER node-user
RUN npm install --unsafe-perm --no-update-notifier --no-fund --omit=dev \
    && npm uninstall node-red-node-gpio || true \
    && cp -R node_modules prod_node_modules

# ---- Release stage ----------------------------------------------------------
FROM ${base_image}:${base_version} AS release

# --- OCI image metadata (populated by CI, overridable at build time) ---------
ARG BUILD_DATE
ARG VCS_REF
ARG VERSION="runtime-3.1.0-v2"
ARG NODE_RED_VERSION=3.1.0

LABEL org.opencontainers.image.title="pcom-brc-nodered" \
      org.opencontainers.image.description="NNP Node-RED runtime on the PCOM Node-RED builder base." \
      org.opencontainers.image.vendor="Nubo Native Platform" \
      org.opencontainers.image.source="https://github.com/NNP-Platform-Components-PCOM/PCOM-BRC-NodeRED" \
      org.opencontainers.image.url="https://github.com/NNP-Platform-Components-PCOM/PCOM-BRC-NodeRED" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.created="${BUILD_DATE}"

RUN addgroup --system appgroup && adduser --system --ingroup appgroup --home /home/appuser appuser
ENV HOME=/home/appuser
RUN npm config set cache /data/.npm --global
RUN mkdir -p /data /data/node_modules && chown -R appuser:appgroup /data && chmod -R 775 /data

COPY --chown=appuser:appgroup flows.json /data/
COPY --chown=appuser:appgroup settings.js /data/
ADD  --chown=appuser:appgroup icons /data/icons
COPY --chown=appuser:appgroup settings.js /tmp/
ADD  --chown=appuser:appgroup icons /tmp/icons
COPY --from=build --chown=appuser:appgroup /usr/src/node-user/prod_node_modules /usr/src/node-user/node_modules

WORKDIR /usr/src/node-user
COPY --chown=appuser:appgroup --chmod=0755 scripts/entrypoint.sh ./entrypoint.sh
RUN sed -i 's/\r$//' ./entrypoint.sh
RUN chown -R appuser:appgroup /usr/src/node-user

# Custom deploy-button + favicon branding.
COPY icons/save.svg   /usr/src/node-user/node_modules/@node-red/editor-client/public/red/images/deploy-flows-o.svg
COPY icons/save.svg   /usr/src/node-user/node_modules/@node-red/editor-client/public/red/images/deploy-flows.svg
COPY icons/save.svg   /usr/src/node-user/node_modules/@node-red/editor-client/public/red/images/deploy-full-o.svg
COPY icons/save.svg   /usr/src/node-user/node_modules/@node-red/editor-client/public/red/images/deploy-full.svg
COPY icons/save.svg   /usr/src/node-user/node_modules/@node-red/editor-client/public/red/images/deploy-nodes-o.svg
COPY icons/save.svg   /usr/src/node-user/node_modules/@node-red/editor-client/public/red/images/deploy-nodes.svg
COPY icons/reload.svg /usr/src/node-user/node_modules/@node-red/editor-client/public/red/images/deploy-reload.svg
COPY icons/favicon.ico /usr/src/node-user/node_modules/@node-red/editor-client/public/favicon.ico

ENV NODE_RED_VERSION=$NODE_RED_VERSION \
    NODE_PATH=/usr/src/node-user/node_modules:/data/node_modules \
    PATH=/usr/src/node-user/node_modules/.bin:${PATH} \
    FLOWS=flows.json \
    SETTINGS=/data/settings.js

EXPOSE 1880
USER appuser
ENTRYPOINT ["./entrypoint.sh"]
