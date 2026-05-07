#!/bin/sh
set -e

# ── HTTP-only mode (no DOMAIN configured) ────────────────────────────────────
if [ -z "$DOMAIN" ]; then
    echo "[nginx] DOMAIN not set — running in HTTP-only mode"
    cp /etc/nginx/templates/http.conf.template /etc/nginx/conf.d/default.conf
    exec nginx -g 'daemon off;'
fi

# ── HTTPS mode ────────────────────────────────────────────────────────────────
if [ -z "$SSL_EMAIL" ]; then
    echo "[nginx] ERROR: SSL_EMAIL is required when DOMAIN is set"
    exit 1
fi

echo "[nginx] DOMAIN=$DOMAIN — starting with Let's Encrypt SSL"

# Phase 1: start nginx on HTTP so certbot can complete the ACME challenge
cp /etc/nginx/templates/http.conf.template /etc/nginx/conf.d/default.conf
nginx -g 'daemon off;' &
NGINX_PID=$!

# Phase 2: obtain certificate (skip if already present from a previous run)
if [ ! -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]; then
    echo "[certbot] Requesting certificate for $DOMAIN..."
    certbot certonly \
        --webroot \
        --webroot-path=/var/www/certbot \
        --email "$SSL_EMAIL" \
        --agree-tos \
        --no-eff-email \
        --non-interactive \
        -d "$DOMAIN"
    echo "[certbot] Certificate obtained successfully"
fi

# Phase 3: switch nginx to HTTPS config
envsubst '${DOMAIN}' < /etc/nginx/templates/https.conf.template > /etc/nginx/conf.d/default.conf
nginx -s reload
echo "[nginx] Now serving HTTPS for $DOMAIN"

# Phase 4: renewal loop — runs every 12 hours
# certbot renew is a no-op if cert has more than 30 days remaining
trap "kill $NGINX_PID; exit 0" TERM INT
while true; do
    sleep 12h &
    wait $!
    echo "[certbot] Running renewal check..."
    certbot renew \
        --quiet \
        --webroot \
        --webroot-path=/var/www/certbot \
    || echo "[certbot] WARNING: renewal failed — cert unchanged, will retry in 12h"
    nginx -s reload
    # Guard: exit if nginx died so Docker restarts the container
    if ! kill -0 $NGINX_PID 2>/dev/null; then
        echo "[nginx] nginx process died unexpectedly, exiting"
        exit 1
    fi
    echo "[nginx] Config reloaded after renewal check"
done
