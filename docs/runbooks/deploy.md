# Runbook: Deploy to VPS (Docker + nginx)

**Target:** Ubuntu 22.04 VPS (DigitalOcean, Hetzner, AWS EC2, v.v.)

---

## Prerequisites trên server

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Install nginx (reverse proxy trước Docker)
sudo apt install -y nginx certbot python3-certbot-nginx
```

---

## 1. Chuẩn bị env trên server

```bash
# Tạo thư mục app
mkdir -p ~/app && cd ~/app

# Copy .env.example → .env và điền values thật
cp backend/.env.example .env

# Chỉnh sửa .env
nano .env
```

`.env` cần điền (KHÔNG commit file này):
```bash
DATABASE_URL=postgresql+asyncpg://app:<strong_password>@postgres:5432/app
JWT_SECRET=<random_64_char_string>          # openssl rand -hex 32
CORS_ORIGINS=["https://yourdomain.com"]
DEBUG=false
ENVIRONMENT=production
```

---

## 2. Build và start

```bash
# Clone hoặc rsync code lên server
git clone https://github.com/your/repo.git app
cd app

# Build production images
make build

# Start (production compose)
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Chạy migrations lần đầu
docker compose exec api uv run alembic upgrade head

# Smoke test
curl http://localhost:8000/api/v1/health
```

---

## 3. Nginx reverse proxy

Tạo file `/etc/nginx/sites-available/app`:
```nginx
server {
    server_name yourdomain.com;

    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# HTTPS via Let's Encrypt
sudo certbot --nginx -d yourdomain.com
```

---

## 4. Deploy update (zero-downtime)

```bash
# Pull new code
git pull origin main

# Pre-deploy check
make deploy-check

# Rebuild và restart
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build api frontend

# Migrate nếu có migration mới
docker compose exec api uv run alembic upgrade head

# Verify
curl https://yourdomain.com/api/v1/health
```

---

## 5. Rollback

```bash
# Rollback migration
docker compose exec api uv run alembic downgrade -1

# Rollback code
git revert HEAD --no-edit
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

---

## 6. Logs

```bash
docker compose logs api --tail=50 -f
docker compose logs frontend --tail=20
docker compose logs postgres --tail=20

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## Checklist trước khi go live

- [ ] `make deploy-check` → tất cả pass
- [ ] `.env` trên server đã điền đủ, KHÔNG phải `.env.example`
- [ ] `JWT_SECRET` là random 64+ char string (không phải `dev_secret`)
- [ ] Database URL trỏ đúng
- [ ] CORS_ORIGINS = domain thật
- [ ] HTTPS đã cấu hình (certbot)
- [ ] Postgres port không expose ra ngoài
- [ ] `DEBUG=false`, `ENVIRONMENT=production`
