# Checklist — P6 · AWS Production Deploy

**Status:** 🔴 Pending

---

## Acceptance criteria (go/no-go cho App Review)

### Infrastructure
- [ ] `terraform plan` clean (0 changes) sau apply lần cuối
- [ ] `terraform state list` ≥ 30 resources
- [ ] State trong S3 `dhtcdanang-tf-state`, encrypted, versioned
- [ ] DynamoDB lock table exists + functional
- [ ] All resources tagged `Project=DHTC`, `Environment=prod`, `ManagedBy=terraform`

### DNS + Cert
- [ ] `dig NS dhtcdanang.com` → 4 AWS nameservers
- [ ] `dig A api.dhtcdanang.com` → ALB DNS
- [ ] `dig A app.dhtcdanang.com` → CloudFront DNS
- [ ] ACM cert `api.dhtcdanang.com` ISSUED in ap-southeast-1
- [ ] ACM cert `app.dhtcdanang.com` ISSUED in us-east-1
- [ ] `curl -I https://api.dhtcdanang.com/health` → HTTP/2 200, valid cert
- [ ] `curl -I https://app.dhtcdanang.com` → HTTP/2 200, valid cert
- [ ] HTTP → HTTPS redirect works (`curl -I http://api.dhtcdanang.com` → 301)

### Application
- [ ] ECS service status: 1/1 RUNNING + STEADY_STATE
- [ ] Target group health: 1/1 healthy
- [ ] Container logs visible in CloudWatch `/ecs/dhtcdanang-prod-backend`
- [ ] Backend reads secrets from Secrets Manager (not hardcoded env)
- [ ] Backend can connect RDS (verify `/health` returns DB status)
- [ ] Frontend loads on `app.dhtcdanang.com` + admin login works
- [ ] Backend API reachable from FE (`POST /api/v1/auth/login` from app.dhtcdanang.com to api.dhtcdanang.com works, CORS ok)

### Database
- [ ] RDS endpoint NOT publicly accessible after migration
- [ ] Data migrated: all tables exist, row counts match local
- [ ] `alembic current` shows latest revision
- [ ] Automated backups enabled, 7d retention
- [ ] Last automated snapshot < 24h ago

### CI/CD
- [ ] GitHub Actions OIDC role exists, trust policy scoped to repo+main
- [ ] No long-lived AWS access keys in GitHub Secrets
- [ ] Backend workflow: push to main triggers build → ECR push → ECS update (latest run green)
- [ ] Frontend workflow: push triggers build → S3 sync → CF invalidate (latest run green)
- [ ] Rollback procedure documented: re-run workflow with prev sha image tag

### Security
- [ ] Secrets Manager value NOT in TF state (`terraform show | grep -i token` → no matches except ARN)
- [ ] `.env` not in git history (`git log --all --full-history -- backend/.env` → empty)
- [ ] task-sg ingress only from alb-sg
- [ ] db-sg ingress only from task-sg (after T30)
- [ ] alb-sg ingress only 80/443 from internet
- [ ] ECS task role least-privilege (no `*:*` actions)
- [ ] Webhook signature verification active (FB_APP_SECRET set in Secrets Manager)

### Monitoring
- [ ] 4 CloudWatch alarms in OK state: ECS CPU, RDS conn, ALB 5xx, billing $80
- [ ] CloudWatch Logs retention set 30 days (not infinite)
- [ ] Email subscription confirmed for SNS alarm topic

### Meta integration
- [ ] Meta dev console Webhook URL = `https://api.dhtcdanang.com/api/v1/webhook/facebook`
- [ ] GET handshake returns challenge with HTTP 200
- [ ] Page subscribed to `messages`, `messaging_postbacks`, `feed`, `mentions`
- [ ] Send test message from tester → log appears in CloudWatch within 5s
- [ ] `chat_messages` row created in RDS
- [ ] `fb_profiles` row enriched with Graph data
- [ ] ngrok tunnel STOPPED (no shadow webhook)

---

## Go-live checklist (the day)

1. [ ] Backup local Postgres: `pg_dump > backup-pre-prod.sql`
2. [ ] Final `terraform apply` review with team
3. [ ] Migrate data: `infra/scripts/migrate-data.sh`
4. [ ] Verify all acceptance criteria above
5. [ ] Update Meta webhook URL
6. [ ] Send team announcement with production URLs
7. [ ] Monitor CloudWatch for 2 hours post go-live
8. [ ] Tag git release: `git tag v1.0.0-prod && git push --tags`

---

## Rollback plan

### Application-level (bad deploy)
- ECS console → service → Update → Revision = previous task def revision → force new deployment
- Or: re-run GitHub Actions with previous git sha checked out

### Infrastructure-level (bad TF change)
- `terraform plan` to see drift
- `git revert <bad-commit>` + `terraform apply`
- For destructive changes (RDS, ALB): `terraform state rm` then import old resource

### Database (bad migration / data loss)
- RDS automated snapshot restore: console → Snapshots → Restore → new instance
- Update Secrets Manager `db_endpoint` to new instance
- Force ECS new deployment to pick up new endpoint
- (Max ~30 min recovery time)

### Domain (DNS issue)
- Worst case: revert NS at registrar back to default → load balancer behind ngrok again
- Less drastic: TTL 60s on records → fast switch

### Full disaster (account compromise)
- Bootstrap script is idempotent → re-run in clean account
- TF state in S3: restore previous version (versioning on)
- Restore RDS snapshot to new region

---

## Post-launch monitoring (first 7 days)

- [ ] Daily check: CloudWatch dashboard + cost forecast
- [ ] Daily check: ECS task restart count (should be 0)
- [ ] Daily check: ALB 5xx rate (should be <0.1%)
- [ ] Day 3: review CloudWatch Logs Insights query top errors
- [ ] Day 7: cost actual vs forecast review
- [ ] Day 7: decide if Multi-AZ RDS upgrade needed
