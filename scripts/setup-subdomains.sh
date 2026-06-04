#!/usr/bin/env bash
# setup-subdomains.sh — First-time setup for 3 frontend subdomains on VPS
# Run ONCE after DNS A records are propagated:
#   admin.dhtcdanang.com     → 103.161.97.176
#   seller.dhtcdanang.com    → 103.161.97.176
#   marketplace.dhtcdanang.com → 103.161.97.176
#
# Usage: bash scripts/setup-subdomains.sh [root@103.161.97.176]
set -euo pipefail

VPS="${1:-root@103.161.97.176}"
NGINX_CONF="/opt/stock-dashboard/nginx/nginx.conf"
CERTBOT_WWW="/opt/stock-dashboard/certbot/www"
CERTBOT_CONF="/opt/stock-dashboard/certbot/conf"
FRONTEND_DIR="/opt/dhtc/frontend/dist"
NGINX_WEBROOT="/var/www/certbot/dhtc"
BACKEND_PORT="8020"

SUBDOMAINS=("admin.dhtcdanang.com" "seller.dhtcdanang.com" "marketplace.dhtcdanang.com")

echo "🌐 Setting up 3 frontend subdomains on $VPS"

ssh "$VPS" bash << REMOTE
set -euo pipefail

NGINX_CONF="$NGINX_CONF"
CERTBOT_WWW="$CERTBOT_WWW"
CERTBOT_CONF="$CERTBOT_CONF"
FRONTEND_DIR="$FRONTEND_DIR"
NGINX_WEBROOT="$NGINX_WEBROOT"
BACKEND_PORT="$BACKEND_PORT"

# ── Ensure frontend dist dir exists ──────────────────────────────
mkdir -p "\$FRONTEND_DIR"
echo "✅ Frontend dir ready: \$FRONTEND_DIR"

# ── Add HTTP blocks for ACME challenge + redirect ─────────────────
for DOMAIN in admin.dhtcdanang.com seller.dhtcdanang.com marketplace.dhtcdanang.com; do
  TAG="DHTC-FE-\${DOMAIN}-HTTP"
  if grep -q "\$TAG" "\$NGINX_CONF"; then
    echo "⚠️  HTTP block for \$DOMAIN already exists — skipping"
  else
    cat >> "\$NGINX_CONF" << EOF

# >>> \$TAG >>>
server {
    listen 80;
    server_name \$DOMAIN;
    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / { return 301 https://\$DOMAIN\\\$request_uri; }
}
# <<< \$TAG <<<
EOF
    echo "✅ HTTP block added for \$DOMAIN"
  fi
done

docker exec stock-nginx nginx -t && docker exec stock-nginx nginx -s reload
echo "✅ Nginx reloaded with HTTP blocks"

# ── Get SSL certs for all 3 subdomains ───────────────────────────
for DOMAIN in admin.dhtcdanang.com seller.dhtcdanang.com marketplace.dhtcdanang.com; do
  if [ -d "$CERTBOT_CONF/live/\$DOMAIN" ]; then
    echo "✅ SSL cert already exists for \$DOMAIN"
  else
    echo "🔐 Getting Let's Encrypt cert for \$DOMAIN..."
    docker run --rm \
      -v "$CERTBOT_CONF:/etc/letsencrypt" \
      -v "$CERTBOT_WWW:/var/www/certbot" \
      certbot/certbot certonly \
      --webroot --webroot-path=/var/www/certbot \
      --email admin@dhtcdanang.com \
      --agree-tos --no-eff-email \
      -d "\$DOMAIN" 2>&1 || {
        echo "⚠️  Certbot failed for \$DOMAIN — DNS may not be propagated yet"
        echo "    Fix DNS then re-run this script"
        exit 1
      }
    echo "✅ SSL cert obtained for \$DOMAIN"
  fi
done

# ── Add HTTPS blocks ──────────────────────────────────────────────
for DOMAIN in admin.dhtcdanang.com seller.dhtcdanang.com marketplace.dhtcdanang.com; do
  TAG="DHTC-FE-\${DOMAIN}-HTTPS"
  if grep -q "\$TAG" "\$NGINX_CONF"; then
    echo "⚠️  HTTPS block for \$DOMAIN already exists — skipping"
  else
    cat >> "\$NGINX_CONF" << EOF

# >>> \$TAG >>>
server {
    listen 443 ssl;
    http2 on;
    server_name \$DOMAIN;

    ssl_certificate /etc/letsencrypt/live/\$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/\$DOMAIN/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_prefer_server_ciphers on;

    root \$NGINX_WEBROOT;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;
    gzip_min_length 1000;

    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Static assets — long cache
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)\$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files \\\$uri =404;
    }

    # API proxy — forward to backend
    location /api/ {
        proxy_pass http://172.18.0.1:\$BACKEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Host              \\\$host;
        proxy_set_header X-Real-IP         \\\$remote_addr;
        proxy_set_header X-Forwarded-For   \\\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\\$scheme;
        proxy_connect_timeout 60s;
        proxy_read_timeout 120s;
        client_max_body_size 10M;
    }

    # WebSocket notifications
    location /api/v1/notifications/ws {
        proxy_pass http://172.18.0.1:\$BACKEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade           \\\$http_upgrade;
        proxy_set_header Connection        "upgrade";
        proxy_set_header Host              \\\$host;
        proxy_set_header X-Real-IP         \\\$remote_addr;
        proxy_set_header X-Forwarded-For   \\\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\\$scheme;
        proxy_read_timeout 86400s;
    }

    # SPA fallback — all non-asset routes serve index.html
    location / {
        try_files \\\$uri \\\$uri/ /index.html;
    }
}
# <<< \$TAG <<<
EOF
    echo "✅ HTTPS block added for \$DOMAIN"
  fi
done

docker exec stock-nginx nginx -t && docker exec stock-nginx nginx -s reload
echo ""
echo "🎉 Done! Verify:"
echo "   curl -sI https://admin.dhtcdanang.com | head -2"
echo "   curl -sI https://seller.dhtcdanang.com | head -2"
echo "   curl -sI https://marketplace.dhtcdanang.com | head -2"
REMOTE
