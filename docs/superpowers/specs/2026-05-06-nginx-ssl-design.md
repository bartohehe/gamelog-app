# Nginx Reverse Proxy with Automatic SSL — Design Spec

**Date:** 2026-05-06  
**Status:** Approved

---

## Goal

Add an Nginx reverse proxy to the Docker Compose stack that:
- Routes all traffic through a single entry point (replaces direct host ports on frontend/backend)
- Runs HTTP-only when `DOMAIN` env var is empty (default, suitable for LAN/local dev)
- Automatically obtains and renews a Let's Encrypt certificate when `DOMAIN` is set

Self-hosters with a domain get HTTPS for free; those without get a clean HTTP setup with zero extra steps.

---

## Architecture

```
Internet
    │
    ▼
nginx :80 (always)
nginx :443 (when DOMAIN is set)
    │
    ├── /api/*  ──►  backend:8080  (Docker-internal network)
    └── /*      ──►  frontend:80   (Docker-internal network)
```

Frontend and backend no longer expose ports on the host. Only nginx is reachable from outside.

---

## New Files

```
docker/
  nginx/
    Dockerfile              # nginx:alpine + certbot
    entrypoint.sh           # startup orchestration script
    templates/
      http.conf.template    # HTTP-only nginx config (no DOMAIN)
      https.conf.template   # HTTPS nginx config (with DOMAIN)
```

---

## Docker Compose Changes

### New service: `nginx`

```yaml
nginx:
  build: ./docker/nginx
  container_name: gamelog-nginx
  ports:
    - "80:80"
    - "443:443"
  environment:
    - DOMAIN=${DOMAIN:-}
    - SSL_EMAIL=${SSL_EMAIL:-}
  volumes:
    - certbot-certs:/etc/letsencrypt
    - certbot-webroot:/var/www/certbot
  depends_on:
    - frontend
    - backend
  networks:
    - gamelog-network
  restart: unless-stopped
```

### Modified services

- `frontend`: remove `ports` (only internal network access)
- `backend`: remove `ports` (only internal network access)

### New volumes

```yaml
certbot-certs:
certbot-webroot:
```

---

## Environment Variables

| Variable    | Default  | Required when         | Description                          |
|-------------|----------|-----------------------|--------------------------------------|
| `DOMAIN`    | *(empty)*| —                     | Empty = HTTP only; set = Let's Encrypt |
| `SSL_EMAIL` | *(empty)*| `DOMAIN` is set       | Email for Let's Encrypt registration |

Added to `.env`:
```
DOMAIN=
SSL_EMAIL=
```

---

## Nginx Configuration Templates

### `http.conf.template` (HTTP-only mode)

Proxies `/api/` → backend and `/*` → frontend. Includes `/.well-known/acme-challenge/` location pointing to the certbot webroot volume — harmless when certbot isn't running, but means the same template is reused as the initial config during HTTPS cert issuance.
Includes standard proxy headers (`X-Real-IP`, `X-Forwarded-For`, `X-Forwarded-Proto`).

### `https.conf.template` (HTTPS mode)

Two server blocks:
1. `listen 80` — serves `/.well-known/acme-challenge/` from webroot volume; all other requests redirect 301 → HTTPS
2. `listen 443 ssl` — TLS 1.2/1.3, Mozilla Modern cipher suite, same proxy rules as HTTP template

Both templates use `${DOMAIN}` substituted by `envsubst` at container start.

---

## Entrypoint Script Logic

```
START
  │
  ├─ DOMAIN empty?
  │     └─ YES → generate http.conf, exec nginx (HTTP-only, done)
  │
  └─ NO (DOMAIN set)
        ├─ generate http.conf (HTTP + ACME location, same template as HTTP-only mode)
        ├─ start nginx in background
        ├─ cert exists already? → skip certbot
        │       └─ NO → certbot certonly --webroot -d $DOMAIN --email $SSL_EMAIL
        ├─ generate https.conf
        ├─ nginx -s reload (now serving HTTPS)
        └─ renewal loop: sleep 12h → certbot renew --quiet → nginx -s reload
```

Certbot uses `--webroot` mode (HTTP-01 challenge). Port 80 must be reachable from the internet for initial cert issuance.

---

## Dockerfile

```dockerfile
FROM nginx:alpine
RUN apk add --no-cache certbot
COPY templates/ /etc/nginx/templates/
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
```

---

## Error Handling

- `certbot` failure (e.g. DNS not propagated, port 80 blocked) → script exits with error; container restarts (`restart: unless-stopped`); existing certs preserved in named volume
- Renewal failure → logged to stdout; nginx keeps running with existing (possibly expiring) cert
- `SSL_EMAIL` missing when `DOMAIN` set → script prints error and exits

---

## Self-Hoster Setup

**HTTP-only (default):**
```
docker compose up -d
# access at http://<server-ip>
```

**HTTPS with Let's Encrypt:**
```
# .env
DOMAIN=gamelog.example.com
SSL_EMAIL=admin@example.com

docker compose up -d
# access at https://gamelog.example.com
```

Port 80 and 443 must be open in firewall/router for Let's Encrypt to work.
