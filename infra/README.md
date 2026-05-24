# DHTC Đà Nẵng — Production Infrastructure

Terraform-managed AWS infrastructure for `dhtcdanang.com`. Target cost: ~$66/mo.

## Stack

| Layer | Service | Notes |
|---|---|---|
| Compute | ECS Fargate (1 task, 0.5 vCPU / 1 GB) | public subnet, no NAT |
| Load balancer | ALB | ACM cert in `ap-southeast-1` |
| Database | RDS Postgres 16 `db.t4g.micro` Single-AZ | gp3, encrypted, 7-day backups |
| Frontend | S3 + CloudFront (OAC, SPA fallback) | ACM cert in `us-east-1` |
| DNS | Route 53 | hosted zone for `dhtcdanang.com` |
| Secrets | Secrets Manager (one JSON bundle) | injected into ECS task |
| CI/CD | GitHub Actions via OIDC | no long-lived AWS keys |
| Monitoring | CloudWatch alarms + AWS Budgets ($80) | SNS → email |

Region: **`ap-southeast-1`** (Singapore — closest to VN).

## Layout

```
infra/
├── bootstrap/              # One-time: creates TF state bucket + lock table via AWS CLI
│   ├── bootstrap.sh
│   └── README.md
├── terraform/
│   ├── versions.tf         # provider versions
│   ├── providers.tf        # default ap-southeast-1 + alias us_east_1 (for CloudFront ACM)
│   ├── backend.tf          # S3 remote state — values from envs/prod/backend.hcl
│   ├── variables.tf        # root inputs
│   ├── outputs.tf          # api_url, app_url, ecr_repo, etc.
│   ├── main.tf             # composition root (wires all 11 modules)
│   ├── envs/prod/
│   │   ├── backend.hcl     # -backend-config for `terraform init`
│   │   └── terraform.tfvars
│   └── modules/
│       ├── network/                # default VPC + 3 SGs
│       ├── secrets/                # Secrets Manager bundle
│       ├── rds-postgres/           # RDS instance + param/subnet groups
│       ├── ecr/                    # backend image repo + lifecycle
│       ├── alb/                    # ALB + target group + ACM (ap-southeast-1)
│       ├── ecs-fargate/            # cluster + task def + service + log group
│       ├── s3-frontend/            # SPA bucket (no public access)
│       ├── cloudfront/             # distribution + ACM (us-east-1) + bucket policy
│       ├── route53/                # A ALIAS records (api/app/www)
│       ├── iam-github-oidc/        # OIDC provider + deploy role + policy
│       └── monitoring/             # CW alarms + SNS + AWS Budgets
└── scripts/
    ├── migrate-data.sh     # pg_dump local → restore RDS → alembic upgrade
    └── deploy-frontend.sh  # local fallback for npm build + S3 sync + CF invalidate
```

## First-time deploy

### 0 · Phase 0 manual prerequisites (1.5h)

These can't be Terraformed — they're billing/DNS root-of-trust items:

1. Create dedicated AWS account, enable MFA on root, create IAM user `tn-admin` with admin policy and an access key.
2. AWS Budgets: monthly alert at $80, Cost Anomaly Detection on.
3. Local: `aws configure --profile dhtcdanang` (set region `ap-southeast-1`). Install Terraform 1.7+.
4. Route 53 → create hosted zone `dhtcdanang.com`. Copy the 4 NS records and paste them into your domain registrar. Wait for propagation (`dig NS dhtcdanang.com` should return AWS nameservers).

### 1 · Bootstrap state backend (one time)

```bash
cd infra/bootstrap
AWS_PROFILE=dhtcdanang ./bootstrap.sh
```

Creates `dhtcdanang-tf-state` (S3, versioned, encrypted) and `dhtcdanang-tf-lock` (DynamoDB) in `ap-southeast-1`. Idempotent.

### 2 · Fill in prod vars

Edit `infra/terraform/envs/prod/terraform.tfvars`:

```hcl
alert_email = "you@example.com"
github_repo = "thaifdv/DHTC-fullstack"
# Leave db_publicly_accessible=true and admin_ingress_cidr=0.0.0.0/0 for now —
# we'll tighten after Phase 9.
```

### 3 · Init + apply

```bash
cd infra/terraform
terraform init -backend-config=envs/prod/backend.hcl
terraform plan -var-file=envs/prod/terraform.tfvars -out=plan.out
terraform apply plan.out
```

First apply takes ~10-15 minutes (RDS provisioning + ACM DNS validation dominate). Outputs include `api_url`, `app_url`, `ecr_repository_url`, `github_deploy_role_arn`, `route53_name_servers`.

### 4 · Populate secrets

Terraform writes placeholder values for `FB_*`, `OPENAI_API_KEY`, etc. Open the secret in AWS Console → Retrieve secret value → Edit → paste real values from `backend/.env`. **Never** commit the populated JSON; the `lifecycle.ignore_changes` on the secret version prevents Terraform from clobbering manual edits.

### 5 · Migrate data

```bash
export RDS_HOST="$(cd infra/terraform && terraform output -raw rds_endpoint | cut -d: -f1)"
export RDS_PASSWORD="$(aws secretsmanager get-secret-value \
    --profile dhtcdanang \
    --secret-id dhtcdanang-prod/app \
    --query 'SecretString' --output text | jq -r .DATABASE_PASSWORD)"
./infra/scripts/migrate-data.sh
```

### 6 · Push first backend image

```bash
ECR_URL="$(cd infra/terraform && terraform output -raw ecr_repository_url)"
aws ecr get-login-password --profile dhtcdanang --region ap-southeast-1 \
  | docker login --username AWS --password-stdin "${ECR_URL}"
docker build -t "${ECR_URL}:initial" -f backend/Dockerfile backend/
docker push "${ECR_URL}:initial"

# Point the task def at the new image and force redeploy
aws ecs update-service \
  --profile dhtcdanang --region ap-southeast-1 \
  --cluster dhtcdanang-prod-cluster \
  --service dhtcdanang-prod-backend \
  --force-new-deployment
```

### 7 · Deploy frontend

```bash
./infra/scripts/deploy-frontend.sh
```

### 8 · Wire GitHub Actions

In the GitHub repo settings → Secrets and variables → Actions:

- Add `AWS_DEPLOY_ROLE_ARN` = `terraform output -raw github_deploy_role_arn`

Push to `main` → both workflows fire automatically.

### 9 · Harden

Once everything's green, flip RDS private:

```hcl
# envs/prod/terraform.tfvars
db_publicly_accessible = false
admin_ingress_cidr     = "x.x.x.x/32"   # not strictly needed once private, but keep tight
```

```bash
terraform apply -var-file=envs/prod/terraform.tfvars
```

### 10 · Update Meta webhook

Meta App dashboard → Messenger → Webhooks → Callback URL → `https://api.dhtcdanang.com/api/v1/webhook/facebook`. Verify, then resubscribe the Page.

## Daily ops

| Action | Command |
|---|---|
| Plan a change | `terraform plan -var-file=envs/prod/terraform.tfvars` |
| Apply | `terraform apply -var-file=envs/prod/terraform.tfvars` |
| Inspect state | `terraform state list` |
| Tail backend logs | `aws logs tail /ecs/dhtcdanang-prod-backend --follow --profile dhtcdanang` |
| Force redeploy backend | `aws ecs update-service --cluster dhtcdanang-prod-cluster --service dhtcdanang-prod-backend --force-new-deployment` |
| Roll back backend | Re-tag a previous ECR image as `latest` and force redeploy, **or** point the task def at the old SHA |
| Roll back frontend | `aws s3 sync s3://app-dhtcdanang-com-backup s3://app-dhtcdanang-com --delete` (if you keep a backup) **or** revert the commit and let CI redeploy |
| Cost check | `aws ce get-cost-and-usage --time-period Start=$(date -v1d +%F),End=$(date +%F) --granularity DAILY --metrics UnblendedCost` |

## Rollback ladder

1. **App regression** → `aws ecs update-service ... --task-definition <previous-revision>`
2. **Bad infra change** → `git revert` the TF commit, `terraform apply`
3. **Data corruption** → restore from RDS automated backup (point-in-time, 7-day window)
4. **Total reset** → `terraform destroy` (RDS has `deletion_protection=true` — disable explicitly first; final snapshot is taken automatically)

## Destroy

```bash
# Disable RDS deletion protection first
terraform apply -var-file=envs/prod/terraform.tfvars \
    -replace=module.rds.aws_db_instance.this   # only if you want a fresh snapshot
# Or edit modules/rds-postgres/main.tf: deletion_protection=false → apply → destroy

terraform destroy -var-file=envs/prod/terraform.tfvars
```

S3 state bucket and DynamoDB lock table are **not** managed by Terraform — destroy them manually if you're fully deprovisioning:

```bash
aws s3 rb s3://dhtcdanang-tf-state --force
aws dynamodb delete-table --table-name dhtcdanang-tf-lock
```

## Cost guard

CloudWatch alarms email you at 80% actual and 100% forecasted of the $80 monthly budget. The biggest variable is data transfer out of CloudFront — if you ever see a spike, check `aws ce get-cost-and-usage-with-resources` to find the culprit.
