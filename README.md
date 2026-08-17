# PCOM - BRC - NodeRED

**Base Runtime Component: Node-RED** — the NNP Node-RED runtime, built on the
PCOM Node-RED builder base. Bundles the NNP custom nodes, a curated set of
contrib nodes, default flows and branding. Serves the editor on port **1880**.

## Image

Published to Docker Hub on every push to `main`:

```
docker.io/nubons/pcom-brc-nodered:runtime-3.1.0-v2
docker.io/nubons/pcom-brc-nodered:latest
```

Architecture: `linux/amd64`.

## Run

```bash
docker run --rm -p 1880:1880 \
  docker.io/nubons/pcom-brc-nodered:runtime-3.1.0-v2
# open http://localhost:1880
```

## Custom nodes

The NNP custom nodes are vendored under `vendor/` and installed from a local
path at build time (no external registry needed):

| Package | Node type |
|---------|-----------|
| `node-red-nnp-monitor` | `nnp-monitor` |
| `node-red-nnp-seturl` | `nnp-setURL` |

## Build locally

```bash
docker build -t pcom-brc-nodered:runtime-3.1.0-v2 .
```

## CI/CD

`.github/workflows/build.yml` is a thin caller for the shared
[`PCOM-CICD`](https://github.com/NNP-Platform-Components-PCOM/PCOM-CICD)
reusable pipeline: build with Buildx, publish to **GHCR** with SBOM +
provenance, sign with **cosign keyless** (OIDC), and scan with Trivy and Grype
(results in the **Security** tab). Pull requests build and scan without
publishing.
