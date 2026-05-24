output "api_url" {
  description = "Public HTTPS URL for the FastAPI backend"
  value       = "https://api.${var.domain}"
}

output "app_url" {
  description = "Public HTTPS URL for the React frontend"
  value       = "https://app.${var.domain}"
}

output "alb_dns_name" {
  description = "Raw ALB DNS name (for Route 53 ALIAS or debugging)"
  value       = module.alb.dns_name
}

output "cloudfront_domain" {
  description = "CloudFront distribution domain name"
  value       = module.cloudfront.domain_name
}

output "ecr_repository_url" {
  description = "ECR repository URL for backend image pushes"
  value       = module.ecr.repository_url
}

output "rds_endpoint" {
  description = "RDS Postgres endpoint (host:port)"
  value       = module.rds.endpoint
  sensitive   = true
}

output "secrets_arn" {
  description = "Secrets Manager ARN for the app secret bundle"
  value       = module.secrets.secret_arn
  sensitive   = true
}

output "github_deploy_role_arn" {
  description = "IAM role ARN that GitHub Actions assumes via OIDC"
  value       = module.github_oidc.role_arn
}

output "route53_name_servers" {
  description = "Route 53 hosted zone NS records (paste into registrar)"
  value       = module.route53.name_servers
}
