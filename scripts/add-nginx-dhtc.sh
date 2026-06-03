#!/usr/bin/env bash
# add-nginx-dhtc.sh — Add api.dhtcdanang.com server block to stock-nginx + get SSL
# Run this AFTER DNS A record api.dhtcdanang.com → 103.161.97.176 is propagated
# Usage: ./scripts/add-nginx-dhtc.sh <VPS_HOST>
set -euo pipefail

VPS="${1:-root@103.161.97.176}"
DOMAIN="api.dhtcdanang.com"
BACKEND_PORT="8020"
NGINX_CONF="/opt/stock-dashboard/nginx/nginx.conf"
CERTBOT_WWW="/opt/stock-dashboard/certbot/www"
CERTBOT_CONF="/opt/stock-dashboard/certbot/conf"

echo "🌐 Adding nginx block for $DOMAIN → localhost:$BACKEND_PORT"

ssh "$VPS" bash << REMOTE
set -euo pipefail

DOMAIN="$DOMAIN"
BACKEND_PORT="$BACKEND_PORT"
NGINX_CONF="$NGINX_CONF"

# ── Check DNS resolves before SSL ─────────────────────────────
RESOLVED_IP=\$(dig +short \$DOMAIN 2>/dev/null | tail -1)
echo "DNS: \$DOMAIN → \$RESOLVED_IP"

# ── Add HTTP-only block first (needed for ACME challenge) ─────
# Check if already added
if grep -q "server_name \$DOMAIN" "\$NGINX_CONF"; then
  echo "⚠️  Block for \$DOMAIN already exists in nginx.conf — skipping add"
else
  cat >> "\$NGINX_CONF" << 'NGINX_HTTP'

# >>> DHTC-API-MANAGED >>>
server {
    listen 80;
    server_name api.dhtcdanang.com;
    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / { return 301 https://api.dhtcdanang.com\$request_uri; }
}
# <<< DHTC-API-MANAGED-HTTP <<<
NGINX_HTTP

  echo "✅ HTTP block added"
fi

# ── Reload nginx ──────────────────────────────────────────────
docker exec stock-nginx nginx -t && docker exec stock-nginx nginx -s reload
echo "✅ Nginx reloaded"

# ── Get SSL cert ──────────────────────────────────────────────
echo "🔐 Getting Let's Encrypt cert for \$DOMAIN..."
docker run --rm \
  -v "$CERTBOT_CONF:/etc/letsencrypt" \
  -v "$CERTBOT_WWW:/var/www/certbot" \
  certbot/certbot certonly \
  --webroot --webroot-path=/var/www/certbot \
  --email admin@dhtcdanang.com \
  --agree-tos --no-eff-email \
  -d "\$DOMAIN" 2>&1 || {
    echo "⚠️  Certbot failed — DNS may not be propagated yet. Run again later."
    exit 1
  }
echo "✅ SSL cert obtained"

# ── Add HTTPS block ───────────────────────────────────────────
if ! grep -q "DHTC-API-MANAGED-HTTPS" "\$NGINX_CONF"; then
  cat >> "\$NGINX_CONF" << 'NGINX_HTTPS'

# >>> DHTC-API-MANAGED-HTTPS >>>
server {
    listen 443 ssl;
    http2 on;
    server_name api.dhtcdanang.com;

    ssl_certificate /etc/letsencrypt/live/api.dhtcdanang.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.dhtcdanang.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_prefer_server_ciphers on;

    client_max_body_size 10M;
    large_client_header_buffers 4 16k;

    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Facebook webhook — needs 30s+ timeout
    location /api/v1/webhook/ {
        proxy_pass http://172.18.0.1:8020;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }

    # WebSocket for notifications
    location /api/v1/notifications/ws {
        proxy_pass http://172.18.0.1:8020;
        proxy_http_version 1.1;
        proxy_set_header Upgrade           $http_upgrade;
        proxy_set_header Connection        "upgrade";
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    # All other API
    location / {
        proxy_pass http://172.18.0.1:8020;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_read_timeout 120s;
    }
}
# <<< DHTC-API-MANAGED-HTTPS <<<
NGINX_HTTPS
  echo "✅ HTTPS block added"
fi

docker exec stock-nginx nginx -t && docker exec stock-nginx nginx -s reload
echo ""
echo "🎉 Done! Test:"
echo "   curl https://\$DOMAIN/api/v1/health"
REMOTE
