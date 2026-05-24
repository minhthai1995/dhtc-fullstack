# Requirements — Feature: P6 · AWS Production Deploy

**Version:** 1.0
**Status:** 🟢 Approved — bắt đầu thực hiện
**Last updated:** 2026-05-24

---

## Mô tả

Triển khai DHTC full-stack lên AWS Singapore (ap-southeast-1) bằng Terraform IaC, đạt yêu cầu Meta App Review cho permissions Messenger (`pages_messaging`, `pages_manage_metadata`, `pages_show_list`, `pages_manage_engagement`, `pages_read_user_content`, `pages_read_engagement`). Stack ECS Fargate + ALB + RDS + S3/CloudFront. Replace ngrok dev tunnel bằng URL ổn định `api.dhtcdanang.com` + `app.dhtcdanang.com`.

Mục tiêu: production-grade infra để tester thật + Meta reviewer dùng được, KHÔNG bị limit 4-8 tuần Meta review do infra không ổn định.

⚠️ **Budget cap:** $100/tháng (target $60/mo cho Phase 1, headroom $40 cho growth).

---

## Người dùng mục tiêu

- **User chính:** Meta App Review reviewers (cần stable URL, screencast verifiable)
- **User phụ:** Tester DHTC (~5-10 người) inbox Page để chat
- **User vận hành:** admin DHTC dùng `app.dhtcdanang.com` xem CRM
- **Quy mô MVP:** <100 concurrent users, <10 req/min trung bình, peak <100 req/s

---

## Yêu cầu nghiệp vụ

### Phải có (Must have)

- [ ] Terraform IaC trong `/infra/terraform/` — single env `prod`, modules tái sử dụng được
- [ ] State backend: S3 `dhtcdanang-tf-state` (versioned, encrypted) + DynamoDB lock `dhtcdanang-tf-lock`
- [ ] Bootstrap script `/infra/bootstrap/bootstrap.sh` — one-time tạo S3 + DynamoDB, idempotent
- [ ] Backend ECS Fargate task (1 task, 0.5 vCPU / 1 GB), public subnet (skip NAT Gateway)
- [ ] ECR repo `dhtcdanang-backend` với lifecycle policy giữ 10 image gần nhất
- [ ] ALB application load balancer, HTTPS-only, HTTP → HTTPS redirect
- [ ] RDS PostgreSQL 16, db.t4g.micro, Single-AZ, automated backup 7 ngày
- [ ] AWS Secrets Manager: bundle 1 secret `dhtcdanang/prod/app` chứa db_password, fb_page_token, fb_app_secret, fb_verify_token, jwt_secret
- [ ] ECS task IAM role: read-only access tới Secrets Manager + CloudWatch Logs write
- [ ] Frontend: S3 `app.dhtcdanang.com` (private) + CloudFront OAC + ACM cert us-east-1
- [ ] Route 53 hosted zone `dhtcdanang.com`:
  - `api.dhtcdanang.com` → ALB
  - `app.dhtcdanang.com` → CloudFront
  - `www.dhtcdanang.com` → redirect `app.dhtcdanang.com`
- [ ] GitHub Actions CI/CD:
  - `deploy-backend.yml`: build Docker → push ECR → ECS force-new-deployment
  - `deploy-frontend.yml`: npm build → S3 sync → CF invalidate
  - OIDC IAM role (không dùng long-lived access key)
- [ ] CloudWatch alarms: ECS CPU >80%, RDS conn >40, ALB 5xx >1%, billing >$80
- [ ] Meta webhook URL update → `https://api.dhtcdanang.com/api/v1/webhook/facebook`
- [ ] Migration data Postgres local → RDS prod (pg_dump + restore)
- [ ] Runbook `/infra/README.md`: bootstrap → plan → apply → deploy → rollback

### Nên có (Should have)

- [ ] Privacy Policy + ToS + Data Deletion page (host trên `app.dhtcdanang.com/legal/*`) cho Meta App Review
- [ ] WAF Web ACL trên ALB: rate-limit 2000 req/5min/IP (protect webhook flooding)
- [ ] RDS performance insights free tier (7 ngày retention)
- [ ] Cost allocation tag `Project=DHTC` trên tất cả resources

### Không làm (Won't have - Phase 1)

- ❌ Multi-AZ RDS (HA) — defer Phase 2 sau khi có revenue
- ❌ Autoscaling ECS task (min=max=1) — chưa cần với traffic MVP
- ❌ NAT Gateway / private subnet ECS — tiết kiệm $32/mo, public subnet OK với security group đúng
- ❌ Staging environment riêng — defer cho đến khi team >2 dev
- ❌ mTLS cert custom CA — Meta deadline 2026-03-31, defer trước go-live
- ❌ Bastion host — RDS endpoint public tạm thời cho migration data, sau đó tighten security group
- ❌ Backup cross-region — chưa cần với compliance VN

---

## Yêu cầu kỹ thuật

### Stack chốt
- **Compute:** ECS Fargate task `dhtcdanang-prod-backend`, image `dhtcdanang-backend:<git-sha>`
- **Load balancer:** ALB `dhtcdanang-prod-alb`, target group port 8001
- **Database:** RDS Postgres 16.x, db.t4g.micro (ARM Graviton), 20GB gp3 storage
- **Registry:** ECR `dhtcdanang-backend`
- **Frontend:** S3 + CloudFront, ACM cert us-east-1
- **DNS:** Route 53 zone `dhtcdanang.com`
- **Secrets:** Secrets Manager bundle 1 secret
- **Logs:** CloudWatch `/ecs/dhtcdanang-prod-backend` (30 ngày retention)
- **Region:** ap-southeast-1 (Singapore)
- **Region cho ACM CloudFront:** us-east-1 (bắt buộc)
- **Region cho ACM ALB:** ap-southeast-1

### IaC
- Terraform ≥ 1.7, AWS provider `~> 5.0`
- State: S3 backend với DynamoDB lock
- Modules: `network`, `secrets`, `rds-postgres`, `ecr`, `ecs-fargate`, `alb`, `s3-frontend`, `cloudfront`, `route53`, `iam-github-oidc`, `monitoring`
- Composition root: `infra/terraform/main.tf`

---

## Dependencies

- ✅ Domain `dhtcdanang.com` đã sở hữu (user)
- ⏳ AWS account mới cho DHTC + billing alert $80 (T1)
- ⏳ Backend `Dockerfile` parity với `docker-compose.prod.yml` hiện có
- ⏳ Alembic migration chain hoạt động end-to-end với Postgres remote
- ⏳ GitHub repo có write access (cho GitHub Actions OIDC trust)

---

## Risks

| Risk | Mitigation |
|---|---|
| Meta App Review reject vì URL không HTTPS chuẩn | Test webhook handshake trước khi submit (T25) |
| Cost vượt $100/mo | CloudWatch billing alarm $80 + cost tags + monthly review |
| RDS endpoint public exposed | Security group cho phép chỉ EC2/Fargate task SG access; rotate password sau migration data |
| Secrets leak trong Terraform state | Secrets Manager value KHÔNG được output từ TF; state bucket encrypted + IAM-restricted |
| ECS task crash loop | CloudWatch alarm + ECS service rollback on failed health check |
| GitHub Actions có access AWS quá rộng | OIDC role với least-privilege IAM policy (chỉ ECR push + ECS update-service + S3 sync + CF invalidate) |
| Domain transfer NS chậm | Để NS ở registrar gốc, chỉ add Route 53 hosted zone với DNS records → faster, không cần transfer |
| mTLS deadline 2026-03-31 | Track riêng task, defer trước go-live; nếu Meta enforce thì update Caddy/Nginx CA bundle |
| pg_dump → RDS thiếu extension | Verify `uuid-ossp`, `pg_stat_statements` enabled trong RDS parameter group trước migration |

---

## Out of Scope

- Setup CI cho test (chỉ deploy) — defer P7 nếu cần
- Monitoring dashboards Grafana / Datadog — CloudWatch đủ MVP
- Blue/green deployment — ECS rolling update đủ
- Disaster recovery cross-region — chưa cần
