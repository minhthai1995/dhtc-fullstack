# Tasks — Feature: P6 · AWS Production Deploy

**Tổng thời gian ước tính:** ~17-19 giờ
**Status:** 🟢 Approved — bắt đầu Phase 0

> - Mỗi task = 1 commit, ≤30 phút
> - Conventional Commits, subject ≤72 chars
> - Tick khi xong: `- [x] T1 ✅ <sha>`

---

## Phase 0 — Manual prerequisites (1.5h)

- [ ] **T0.1** (20') — AWS account mới riêng cho DHTC. Enable MFA root. Tạo IAM admin user `tn-admin` + access key. Lưu credentials Secrets Manager local hoặc 1Password.
  - Commit: N/A (manual)

- [ ] **T0.2** (15') — AWS Budgets: monthly cost alert $80 forecast, email tới owner. AWS Cost Anomaly Detection enable.
  - Commit: N/A (manual)

- [ ] **T0.3** (10') — Local: `aws configure --profile dhtcdanang` set Singapore. Install Terraform 1.7+ (`brew install terraform`).
  - Commit: N/A (local)

- [ ] **T0.4** (15') — Route 53: tạo hosted zone `dhtcdanang.com`. Copy 4 NS records từ AWS. Vào registrar gốc → set NS → wait propagation (~5-30 phút).
  - Commit: N/A (manual)

- [ ] **T0.5** (15') — Verify NS propagation: `dig NS dhtcdanang.com` → trả về AWS nameservers.
  - Commit: N/A (verify)

## Phase 1 — Bootstrap state backend (1h)

- [ ] **T1** (20') — Tạo `infra/bootstrap/bootstrap.sh`: AWS CLI tạo S3 bucket `dhtcdanang-tf-state` (versioned, encrypted, block public) + DynamoDB table `dhtcdanang-tf-lock` (LockID hash key, PAY_PER_REQUEST). Idempotent (check exists trước create).
  - Commit: `feat(infra): bootstrap script for tf state + lock`

- [ ] **T2** (10') — Tạo `infra/bootstrap/README.md`: chicken-and-egg explanation + run instructions.
  - Commit: `docs(infra): bootstrap readme`

- [ ] **T3** (15') — Run bootstrap.sh + verify S3 + DynamoDB exists trong AWS console.
  - Commit: N/A (one-time apply)

## Phase 2 — Terraform skeleton (1h)

- [ ] **T4** (20') — `infra/terraform/{versions,providers,backend,variables,outputs}.tf` skeleton. Providers: default ap-southeast-1 + alias `us_east_1`.
  - Commit: `feat(infra): terraform skeleton + s3 backend`

- [ ] **T5** (15') — `terraform init` + verify state init thành công + `dhtcdanang-tf-lock` có entry.
  - Commit: N/A (verify)

- [ ] **T6** (15') — `infra/terraform/envs/prod/{terraform.tfvars,backend.hcl}` + `main.tf` composition root skeleton (chưa module nào).
  - Commit: `feat(infra): prod env tfvars + composition root`

## Phase 3 — Network + Secrets (1.5h)

- [ ] **T7** (20') — Module `network/`: data default VPC + 3 security groups (alb-sg, task-sg, db-sg).
  - Commit: `feat(infra): network module with security groups`

- [ ] **T8** (20') — Module `secrets/`: aws_secretsmanager_secret + version với JSON placeholder. Output secret_arn.
  - Commit: `feat(infra): secrets manager module`

- [ ] **T9** (15') — `terraform plan + apply` Phase 3. Verify console: 1 secret + 3 SGs created. Manual populate secret values qua AWS Console (db_password TF-generated, FB tokens copy từ `.env`).
  - Commit: N/A (apply + manual)

## Phase 4 — RDS Postgres (1h)

- [ ] **T10** (25') — Module `rds-postgres/`: db_instance + parameter_group + subnet_group. Master password = random_password resource → stored in Secrets Manager. `publicly_accessible=true` tạm cho migration.
  - Commit: `feat(infra): rds postgres module`

- [ ] **T11** (15') — `terraform apply` Phase 4. Verify RDS endpoint reachable từ local (`psql $endpoint -U postgres`).
  - Commit: N/A (apply)

- [ ] **T12** (20') — `infra/scripts/migrate-data.sh`: pg_dump local → psql restore RDS + `alembic upgrade head`. Run script. Verify tables + data trong RDS.
  - Commit: `feat(infra): data migration script + initial restore`

## Phase 5 — ECR + ECS Fargate + ALB (2h)

- [ ] **T13** (15') — Module `ecr/`: repository + lifecycle policy (keep 10).
  - Commit: `feat(infra): ecr repository module`

- [ ] **T14** (25') — Refine `backend/Dockerfile`: multi-stage Python 3.12-slim, install uv, copy app, `CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]`. Add HEALTHCHECK.
  - Commit: `feat(backend): production dockerfile`

- [ ] **T15** (15') — Local build + push first image: `docker build -t dhtcdanang-backend:test . && docker push ${ecr_url}:test`.
  - Commit: N/A (verify)

- [ ] **T16** (25') — Module `ecs-fargate/`: cluster + task_definition (image, secrets from secretsmanager, log_group) + service. desired_count=1, no LB attach yet.
  - Commit: `feat(infra): ecs fargate cluster + task + service`

- [ ] **T17** (25') — Module `alb/`: lb + target_group (IP type port 8001 health `/health`) + listeners (80 redirect 443, 443 forward TG). ACM cert (ap-southeast-1) for `api.dhtcdanang.com` with DNS validation.
  - Commit: `feat(infra): alb module with acm cert`

- [ ] **T18** (15') — ECS service attach load_balancer = target_group. Apply. Verify task RUNNING + healthy in target group.
  - Commit: `feat(infra): wire ecs service to alb`

## Phase 6 — Frontend S3 + CloudFront (1.5h)

- [ ] **T19** (20') — Module `s3-frontend/`: bucket + block-public + OAC + bucket policy CloudFront read.
  - Commit: `feat(infra): s3 frontend bucket module`

- [ ] **T20** (25') — Module `cloudfront/`: ACM cert (us-east-1 alias) `app.dhtcdanang.com` + distribution với SPA fallback function.
  - Commit: `feat(infra): cloudfront distribution module`

- [ ] **T21** (15') — `infra/scripts/deploy-frontend.sh`: `npm run build && aws s3 sync dist/ s3://app-dhtcdanang-com/ --delete && aws cloudfront create-invalidation`.
  - Commit: `feat(infra): frontend deploy script`

- [ ] **T22** (15') — Run deploy-frontend.sh. Verify `https://app.dhtcdanang.com` load FE.
  - Commit: N/A (verify)

## Phase 7 — Route 53 records (30')

- [ ] **T23** (15') — Module `route53/`: A ALIAS `api.dhtcdanang.com → alb`, A ALIAS `app.dhtcdanang.com → cloudfront`, `www → app` redirect.
  - Commit: `feat(infra): route53 dns records`

- [ ] **T24** (15') — `terraform apply` + DNS propagation check + curl `https://api.dhtcdanang.com/health` returns 200.
  - Commit: N/A (verify)

## Phase 8 — CI/CD GitHub Actions (1.5h)

- [ ] **T25** (20') — Module `iam-github-oidc/`: OIDC provider + role + least-privilege policy (ECR push, ECS update-service, S3 sync, CF invalidate).
  - Commit: `feat(infra): github oidc role for deploys`

- [ ] **T26** (25') — `.github/workflows/deploy-backend.yml`: on push main, build → push ECR tagged `${{github.sha}}` → ECS task def register new revision → service update.
  - Commit: `ci: backend deploy workflow via oidc`

- [ ] **T27** (20') — `.github/workflows/deploy-frontend.yml`: on push main (FE changes), npm build → S3 sync → CF invalidate.
  - Commit: `ci: frontend deploy workflow`

- [ ] **T28** (15') — Trigger both workflows manually. Verify deploy success in Actions tab + `api.dhtcdanang.com/health` reflects new image.
  - Commit: N/A (verify)

## Phase 9 — Monitoring + harden (1h)

- [ ] **T29** (20') — Module `monitoring/`: CloudWatch alarms (ECS CPU, RDS conn, ALB 5xx) + AWS Budgets $80.
  - Commit: `feat(infra): cloudwatch alarms + budget`

- [ ] **T30** (15') — Tighten RDS: set `publicly_accessible=false` qua TF var override → apply. Verify FE/BE vẫn chạy.
  - Commit: `chore(infra): make rds private after migration`

- [ ] **T31** (15') — Verify Secrets Manager not exposed: `aws secretsmanager get-secret-value --secret-id dhtcdanang/prod/app` returns ARN only without value if no IAM access. Check ECS task can read.
  - Commit: N/A (security verify)

## Phase 10 — Meta wiring + go-live (45')

- [ ] **T32** (15') — Meta dev console: update Webhook Callback URL → `https://api.dhtcdanang.com/api/v1/webhook/facebook`. Re-verify. Re-subscribe Page.
  - Commit: N/A (Meta console)

- [ ] **T33** (15') — End-to-end smoke test: tester gửi tin nhắn → log CloudWatch shows inbound → RDS `chat_messages` row → `fb_profiles` enriched.
  - Commit: N/A (verify)

- [ ] **T34** (15') — Kill ngrok tunnel. Notify team URL mới. Update `handoff.md` với production URLs.
  - Commit: `docs: handoff P6 — production live on dhtcdanang.com`

## Phase 11 — Polish (30')

- [ ] **T35** (15') — `infra/README.md`: full runbook (bootstrap → plan → apply → deploy → rollback → destroy).
  - Commit: `docs(infra): readme runbook`

- [ ] **T36** (15') — Tick all spec 08 tasks, update `checklist.md`, commit handoff.
  - Commit: `docs: P6 complete + checklist`

---

## Tổng kết (điền sau)

| | Dự kiến | Thực tế |
|--|---------|---------|
| Tasks | 36 | _TBD_ |
| Manual (T0.x, T3, T9, T11-12, T15, T22, T24, T28, T31-33) | 12 | _TBD_ |
| Code commits | 24 | _TBD_ |
| TF modules | 11 | _TBD_ |
| Files mới | ~35 (TF + scripts + workflows) | _TBD_ |
| Files edit | 3 (Dockerfile, handoff, README) | _TBD_ |
| Thời gian | ~17-19h | _TBD_ |
| Cost provisioned | ~$66/mo | _TBD_ |
