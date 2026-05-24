#!/usr/bin/env bash
# Bootstrap Terraform remote state: S3 bucket (versioned, encrypted) + DynamoDB lock table.
# Run ONCE before `terraform init`. Idempotent — safe to re-run.
#
# Usage:
#   AWS_PROFILE=dhtcdanang ./bootstrap.sh
#
# Why this exists (chicken-and-egg):
#   Terraform needs an S3 backend to store state, but the S3 bucket itself
#   can't be managed by that backend until it exists. So we provision it
#   out-of-band with AWS CLI before `terraform init`.

set -euo pipefail

REGION="${AWS_REGION:-ap-southeast-1}"
PROJECT="dhtcdanang"
BUCKET="${PROJECT}-tf-state"
TABLE="${PROJECT}-tf-lock"

: "${AWS_PROFILE:?AWS_PROFILE must be set (e.g. dhtcdanang)}"

aws sts get-caller-identity --profile "$AWS_PROFILE" >/dev/null \
  || { echo "ERROR: AWS credentials invalid for profile=$AWS_PROFILE"; exit 1; }

echo "==> Region: $REGION  Profile: $AWS_PROFILE"

# ── S3 state bucket ──────────────────────────────────────────────────────────
if aws s3api head-bucket --bucket "$BUCKET" --profile "$AWS_PROFILE" 2>/dev/null; then
  echo "==> S3 bucket s3://$BUCKET already exists"
else
  echo "==> Creating S3 bucket s3://$BUCKET"
  aws s3api create-bucket \
    --bucket "$BUCKET" \
    --region "$REGION" \
    --create-bucket-configuration "LocationConstraint=$REGION" \
    --profile "$AWS_PROFILE"
fi

echo "==> Enabling versioning"
aws s3api put-bucket-versioning \
  --bucket "$BUCKET" \
  --versioning-configuration Status=Enabled \
  --profile "$AWS_PROFILE"

echo "==> Enabling SSE-S3 encryption"
aws s3api put-bucket-encryption \
  --bucket "$BUCKET" \
  --server-side-encryption-configuration \
  '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"},"BucketKeyEnabled":true}]}' \
  --profile "$AWS_PROFILE"

echo "==> Blocking all public access"
aws s3api put-public-access-block \
  --bucket "$BUCKET" \
  --public-access-block-configuration \
  "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true" \
  --profile "$AWS_PROFILE"

# ── DynamoDB lock table ──────────────────────────────────────────────────────
if aws dynamodb describe-table --table-name "$TABLE" --region "$REGION" --profile "$AWS_PROFILE" >/dev/null 2>&1; then
  echo "==> DynamoDB table $TABLE already exists"
else
  echo "==> Creating DynamoDB table $TABLE"
  aws dynamodb create-table \
    --table-name "$TABLE" \
    --attribute-definitions AttributeName=LockID,AttributeType=S \
    --key-schema AttributeName=LockID,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region "$REGION" \
    --profile "$AWS_PROFILE" >/dev/null
  echo "==> Waiting for table ACTIVE..."
  aws dynamodb wait table-exists --table-name "$TABLE" --region "$REGION" --profile "$AWS_PROFILE"
fi

echo
echo "✅ Bootstrap complete."
echo "   S3 state bucket:    s3://$BUCKET"
echo "   DynamoDB lock:      $TABLE"
echo "   Region:             $REGION"
echo
echo "Next: cd ../terraform && terraform init -backend-config=envs/prod/backend.hcl"
