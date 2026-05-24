output "role_arn" {
  description = "Paste as AWS_DEPLOY_ROLE_ARN secret in GitHub repo settings"
  value       = aws_iam_role.deploy.arn
}

output "oidc_provider_arn" {
  value = aws_iam_openid_connect_provider.github.arn
}
