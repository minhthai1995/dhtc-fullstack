#!/usr/bin/env bash
# Build the React SPA and publish to S3 + invalidate CloudFront.
# Resolves bucket + distribution from Terraform outputs so it stays in sync with infra.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
TF_DIR="${REPO_ROOT}/infra/terraform"
FRONTEND_DIR="${REPO_ROOT}/frontend"

export AWS_PROFILE="${AWS_PROFILE:-dhtcdanang}"

echo "==> Reading Terraform outputs"
BUCKET_NAME="$(cd "${TF_DIR}" && terraform output -raw app_url | sed 's#https://##')"
# app_url returns the FQDN — bucket name is the FQDN with dots → dashes prefixed by "app-"
BUCKET="app-$(echo "${BUCKET_NAME}" | tr '.' '-')"
# Strip the leading "app-app-…" if app_url already starts with app.
BUCKET="${BUCKET/app-app-/app-}"

DIST_ID="$(cd "${TF_DIR}" && terraform state show module.cloudfront.aws_cloudfront_distribution.this | awk -F'"' '/^  id /{print $2}')"

echo "==> Bucket: ${BUCKET}"
echo "==> Distribution: ${DIST_ID}"

echo "==> Building frontend"
pushd "${FRONTEND_DIR}" >/dev/null
npm ci
npm run build
popd >/dev/null

echo "==> Syncing dist/ → s3://${BUCKET}/"
aws s3 sync "${FRONTEND_DIR}/dist/" "s3://${BUCKET}/" \
    --delete \
    --cache-control "public, max-age=31536000, immutable" \
    --exclude "index.html" \
    --exclude "*.html"

# HTML files: short cache so SPA updates are picked up promptly.
aws s3 sync "${FRONTEND_DIR}/dist/" "s3://${BUCKET}/" \
    --cache-control "public, max-age=60, must-revalidate" \
    --exclude "*" \
    --include "*.html"

echo "==> Invalidating CloudFront /*"
aws cloudfront create-invalidation \
    --distribution-id "${DIST_ID}" \
    --paths "/*" \
    --query 'Invalidation.Id' --output text

echo "==> Deploy complete: https://${BUCKET_NAME}"
