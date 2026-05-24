# Terraform State Bootstrap

One-time provisioning of the S3 state bucket + DynamoDB lock table that the Terraform `s3` backend depends on. This is **chicken-and-egg**: Terraform can't manage the resources its own backend lives in, so we create them with AWS CLI before `terraform init`.

## Prerequisites

- AWS CLI v2 configured with profile `dhtcdanang` (see Phase 0 T0.3)
- `aws sts get-caller-identity --profile dhtcdanang` returns your IAM user

## Run

```bash
cd infra/bootstrap
AWS_PROFILE=dhtcdanang ./bootstrap.sh
```

Idempotent — safe to re-run if interrupted.

## What it creates

| Resource | Name | Purpose |
|---|---|---|
| S3 bucket | `dhtcdanang-tf-state` | Holds `prod/terraform.tfstate` (versioned, SSE-S3, all public access blocked) |
| DynamoDB table | `dhtcdanang-tf-lock` | Prevents concurrent `terraform apply` (LockID hash key, PAY_PER_REQUEST) |

## After bootstrap

```bash
cd ../terraform
terraform init -backend-config=envs/prod/backend.hcl
```

## Destroy (very rare — only if abandoning the project)

```bash
aws s3 rb s3://dhtcdanang-tf-state --force --profile dhtcdanang
aws dynamodb delete-table --table-name dhtcdanang-tf-lock --profile dhtcdanang
```

⚠️ Destroying the state bucket loses all infra history. Don't do this unless you've already `terraform destroy`-ed everything else.
