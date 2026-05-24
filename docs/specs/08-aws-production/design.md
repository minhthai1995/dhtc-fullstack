# Design — P6 · AWS Production Deploy

**Status:** 🔴 Draft
**Last updated:** 2026-05-24

---

## Architecture overview

```
                                  ┌─────────────────────┐
       Route 53 Public Zone ──────▶│   dhtcdanang.com    │
       (NS: AWS)                   └──────────┬──────────┘
                                              │
              ┌───────────────────────────────┼───────────────────────────────┐
              │                               │                               │
       app.dhtcdanang.com          api.dhtcdanang.com               www.dhtcdanang.com
              │                               │                               │
              ▼                               ▼                               ▼
     ┌────────────────┐              ┌────────────────┐              ┌────────────────┐
     │  CloudFront    │              │  ALB (HTTPS)   │              │  S3 redirect   │
     │  + ACM us-e-1  │              │  + ACM ap-se-1 │              │  → app.dhtc... │
     └───────┬────────┘              └────────┬───────┘              └────────────────┘
             │ OAC                            │
             ▼                                ▼
     ┌────────────────┐              ┌────────────────────────┐
     │ S3 private     │              │  ECS Fargate Service   │
     │ app-dhtcdanang │              │  (1 task, public subnet│
     └────────────────┘              │   public IP, no NAT)   │
                                     │  ┌──────────────────┐  │
                                     │  │ Container :8001  │  │
                                     │  │ FastAPI uvicorn  │  │
                                     │  └────────┬─────────┘  │
                                     └───────────┼────────────┘
                                                 │
                       ┌─────────────────────────┼─────────────────────────┐
                       ▼                         ▼                         ▼
              ┌────────────────┐       ┌────────────────┐         ┌────────────────┐
              │ RDS Postgres   │       │ Secrets Mgr    │         │ CloudWatch     │
              │ db.t4g.micro   │       │ /prod/app      │         │ Logs + Alarms  │
              │ Single-AZ      │       └────────────────┘         └────────────────┘
              │ private SG     │
              └────────────────┘
```

---

## Folder structure `/infra/`

```
infra/
├── README.md                       # Runbook
├── bootstrap/
│   ├── bootstrap.sh                # One-time S3 + DynamoDB creation
│   └── README.md                   # Chicken-and-egg explanation
├── terraform/
│   ├── versions.tf                 # TF ≥1.7, AWS ~> 5.0
│   ├── providers.tf                # Default ap-southeast-1 + alias us-east-1
│   ├── backend.tf                  # S3 backend block
│   ├── variables.tf                # project_name, domain, db_size, etc.
│   ├── outputs.tf                  # api_url, db_endpoint, cdn_url, alb_dns
│   ├── main.tf                     # Composition root
│   ├── modules/
│   │   ├── network/                # data "aws_vpc" "default" + 3 SGs
│   │   ├── secrets/                # secretsmanager_secret + version
│   │   ├── rds-postgres/           # db_instance + parameter_group + subnet_group
│   │   ├── ecr/                    # ecr_repository + lifecycle
│   │   ├── ecs-fargate/            # cluster + task_def + service + log_group
│   │   ├── alb/                    # lb + target_group + http/https listeners
│   │   ├── s3-frontend/            # bucket + OAC
│   │   ├── cloudfront/             # distribution + cert (us-east-1 alias)
│   │   ├── route53/                # records (api/app/www)
│   │   ├── iam-github-oidc/        # OIDC provider + role + policy
│   │   └── monitoring/             # cloudwatch_metric_alarm × N + billing
│   └── envs/
│       └── prod/
│           ├── terraform.tfvars    # project=dhtcdanang, domain=dhtcdanang.com
│           └── backend.hcl         # key=prod/terraform.tfstate
└── scripts/
    ├── deploy-backend.sh           # Build + push ECR + ECS force-new-deployment (local)
    ├── deploy-frontend.sh          # npm build + S3 sync + CF invalidate (local)
    └── migrate-data.sh             # pg_dump local → restore RDS
```

---

## Module breakdown

### `network/`
- Read default VPC + default public subnets (3 AZs)
- 3 Security Groups:
  - `alb-sg`: ingress 80/443 from 0.0.0.0/0; egress all
  - `task-sg`: ingress 8001 from alb-sg only; egress all (needed for ECR pull, Secrets Manager, Graph API)
  - `db-sg`: ingress 5432 from task-sg + (temporary) admin IP for migration; egress none

### `secrets/`
- 1 `aws_secretsmanager_secret` named `dhtcdanang/prod/app`
- `aws_secretsmanager_secret_version` với JSON bundle:
  ```json
  {
    "db_password": "...",
    "fb_page_access_token": "...",
    "fb_app_secret": "...",
    "fb_webhook_verify_token": "...",
    "jwt_secret_key": "..."
  }
  ```
- Values KHÔNG hardcoded trong TF — initial = "PLACEHOLDER", admin update qua console sau apply
- Output: `secret_arn` để task def reference

### `rds-postgres/`
- `aws_db_instance` Postgres 16.x, db.t4g.micro, 20GB gp3, encrypted
- `aws_db_subnet_group` từ default subnets
- `aws_db_parameter_group`: enable `pg_stat_statements`, `log_min_duration_statement=1000`
- Backup window 18:00-19:00 UTC (1AM-2AM VN), retention 7 days
- `publicly_accessible = true` tạm cho migration; sau migration set false (manual via console hoặc TF var toggle)
- Master password: random TF resource → stored in Secrets Manager
- Skip final snapshot trong prod tfvars (cần override = false trước khi destroy thật)

### `ecr/`
- `aws_ecr_repository` `dhtcdanang-backend`, scan_on_push, image_tag_mutability=IMMUTABLE
- Lifecycle: keep last 10 tagged images, expire untagged after 1 day

### `ecs-fargate/`
- `aws_ecs_cluster` `dhtcdanang-prod`, Container Insights on
- `aws_ecs_task_definition`:
  - CPU 512 (0.5 vCPU), memory 1024 (1 GB)
  - Network mode `awsvpc`
  - Container image: `${ecr_url}:${image_tag}` (default `latest`, override per deploy)
  - Port mapping 8001
  - Secrets from Secrets Manager (mounted as env vars: `DATABASE_URL` composed, `FACEBOOK_PAGE_ACCESS_TOKEN`, etc.)
  - Health check: `curl -f http://localhost:8001/health || exit 1`
  - Logs to CloudWatch `/ecs/dhtcdanang-prod-backend`
- `aws_ecs_service`:
  - desired_count = 1
  - launch_type FARGATE
  - assign_public_ip = true
  - subnets = default public subnets
  - security_groups = [task-sg]
  - load_balancer attach to alb target_group
  - health_check_grace_period 60s
  - deployment_minimum_healthy_percent 0 (1 task only, allow brief downtime on deploy)
  - deployment_maximum_percent 200 (allow 2 tasks during rolling update)

### `alb/`
- `aws_lb` `dhtcdanang-prod-alb`, application, public subnets, security_groups=[alb-sg]
- `aws_lb_target_group` IP type, port 8001, health_check path `/health` interval 30s
- `aws_lb_listener` 80 → redirect to 443
- `aws_lb_listener` 443 → forward to target_group, cert from ACM (ap-southeast-1)

### `s3-frontend/`
- `aws_s3_bucket` `app-dhtcdanang-com` (kebab, no dot for OAC compat)
- Block all public access
- Versioning enabled
- Bucket policy allow CloudFront OAC `s3:GetObject`

### `cloudfront/`
- ACM cert request in us-east-1 (provider alias) for `app.dhtcdanang.com`
- DNS validation via Route 53
- `aws_cloudfront_distribution`:
  - Origin: S3 bucket via OAC (S3 origin access control)
  - Default cache behavior: GET/HEAD, redirect HTTP → HTTPS, compress
  - SPA fallback: CloudFront Function on viewer-request rewriting non-asset paths → `/index.html`
  - Aliases: `app.dhtcdanang.com`
  - Price class PriceClass_200 (excludes most expensive regions)

### `route53/`
- `aws_route53_zone` `dhtcdanang.com`
- Records:
  - `api.dhtcdanang.com` A ALIAS → ALB
  - `app.dhtcdanang.com` A ALIAS → CloudFront
  - `www.dhtcdanang.com` A → S3 redirect bucket (or CNAME → app, depending)
  - ACM validation records (auto)

### `iam-github-oidc/`
- `aws_iam_openid_connect_provider` for `token.actions.githubusercontent.com`
- `aws_iam_role` `dhtcdanang-github-deploy` with trust policy restricting to `repo:<owner>/<repo>:ref:refs/heads/main`
- Policy: ECR push + ECS update-service + S3 sync `app-dhtcdanang-com` + CloudFront invalidation

### `monitoring/`
- ECS CPU >80% 5min × 2 datapoints
- RDS conn >40 (db.t4g.micro max 87)
- ALB 5xx count >5 in 5min
- AWS Budgets monthly $80 forecast alert

---

## Key decisions

| Decision | Choice | Rationale |
|---|---|---|
| Compute | ECS Fargate (vs EC2) | User chọn — container-native, zero-downtime, autoscale-ready |
| Subnet for tasks | Public (vs private+NAT) | NAT Gateway $32/mo. Public subnet OK: task-sg restricts ingress to ALB only; egress unrestricted for ECR/Secrets/Graph |
| Database | RDS Single-AZ (vs Multi-AZ) | Multi-AZ +$15/mo. MVP có thể chịu ~5 phút downtime nếu AZ fail. Upgrade khi có SLA cam kết |
| State backend | S3 + DynamoDB lock | HashiCorp recommended. Bootstrap qua script (chicken-and-egg) |
| Bootstrap | Shell script (vs meta-TF module) | One-time, đơn giản hơn meta-module + local state migration |
| Image tagging | IMMUTABLE + git-sha | Audit traceability + rollback dễ (revert to prev sha) |
| Secrets in TF | Placeholder + manual fill | KHÔNG commit secret. TF chỉ tạo container, admin populate value qua AWS Console |
| Domain NS | Route 53 hosted zone, NS giữ ở registrar | Faster setup, không cần transfer; chỉ delegate `api`/`app`/`www` records |
| ACM CloudFront region | us-east-1 (provider alias) | CloudFront yêu cầu cert ở us-east-1 (limitation) |
| Multi-env | Single `prod` | Per requirements — defer staging |
| CI/CD auth | GitHub OIDC (vs IAM access key) | Best practice 2024+: no long-lived credentials, scoped to repo+branch |

---

## Migration path: ECS → larger scale (documented for Phase 2)

Khi traffic vượt 1 task capacity:
1. ECS service `desired_count` 1 → 2, `deployment_minimum_healthy_percent` 50
2. Enable autoscaling target tracking CPU 70%
3. RDS Single-AZ → Multi-AZ (push apply, brief downtime)
4. Add CloudFront in front of ALB (cache `/api/products/*` GETs)
5. (Optional) Add Aurora Serverless v2 nếu DB > db.t4g.medium

Migration EC2 trong tương lai (nếu cần): N/A — đi từ Fargate scale lên Fargate hoặc EKS.

---

## Security model

- **Public attack surface:** ALB :443, CloudFront :443. Mọi thứ khác private hoặc IAM-controlled.
- **Database:** Private SG, chỉ task-sg access (sau migration). Master password random 32-char trong Secrets Manager.
- **Secrets:** Mọi token/key ở Secrets Manager, KHÔNG trong TF state, KHÔNG trong env vars hiển thị, KHÔNG commit `.env` lên Git.
- **IAM:** ECS task role least-privilege (read 1 secret + write 1 log group); GitHub OIDC role scoped to deploy actions only.
- **Webhook signature:** App-level HMAC-SHA256 verify (đã có trong `webhooks.py`).
- **Rate limit:** ALB request limit per IP (Phase 1: skip; Phase 1.5: add WAF managed rule `AWSManagedRulesCommonRuleSet` + rate limit 2000/5min).

---

## Cost estimate (Singapore, on-demand, no RI)

| Service | Spec | $/mo |
|---|---|---|
| Fargate compute | 0.5 vCPU + 1GB always-on | $14.97 |
| ALB | 1 LCU avg | $22.27 |
| RDS db.t4g.micro | Single-AZ Postgres | $14.60 |
| RDS storage gp3 | 20GB + 7d backup | $2.30 |
| ECR | <1GB images | $0.10 |
| Route 53 zone + queries | 1 zone, 1M queries | $0.90 |
| S3 + CloudFront | 5GB + free tier egress | $0.30 |
| Secrets Manager | 1 secret | $0.40 |
| Data transfer out | ~50GB | $4.50 |
| CloudWatch | Free tier 5GB logs + 10 alarms | $0 |
| ACM certs | Free | $0 |
| **Subtotal** | | **$60.34** |
| VAT 10% (invoice VN) | | $6.03 |
| **Total** | | **~$66.37/mo** |

Headroom đến $100: ~$34. Cover:
- Multi-AZ RDS (+$15)
- WAF (+$5 + $0.60/M req)
- Performance Insights long retention (+$7)
- Spike egress 200GB (+$13)
