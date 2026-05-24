locals {
  name_prefix = "${var.project}-${var.environment}"
}

# ── Foundation ───────────────────────────────────────────────────────────────

module "network" {
  source = "./modules/network"

  name_prefix        = local.name_prefix
  admin_ingress_cidr = var.admin_ingress_cidr
}

module "secrets" {
  source = "./modules/secrets"

  name_prefix = local.name_prefix
  db_password = module.rds.master_password
}

# ── Data ─────────────────────────────────────────────────────────────────────

module "rds" {
  source = "./modules/rds-postgres"

  name_prefix         = local.name_prefix
  vpc_id              = module.network.vpc_id
  subnet_ids          = module.network.public_subnet_ids
  security_group_ids  = [module.network.db_security_group_id]
  instance_class      = var.db_instance_class
  allocated_storage   = var.db_allocated_storage
  publicly_accessible = var.db_publicly_accessible
}

# ── Compute ──────────────────────────────────────────────────────────────────

module "ecr" {
  source = "./modules/ecr"

  name_prefix = local.name_prefix
}

module "alb" {
  source = "./modules/alb"

  name_prefix       = local.name_prefix
  vpc_id            = module.network.vpc_id
  subnet_ids        = module.network.public_subnet_ids
  security_group_id = module.network.alb_security_group_id
  domain            = var.domain
  api_subdomain     = "api"
}

module "ecs" {
  source = "./modules/ecs-fargate"

  name_prefix         = local.name_prefix
  region              = var.region
  vpc_id              = module.network.vpc_id
  subnet_ids          = module.network.public_subnet_ids
  security_group_id   = module.network.task_security_group_id
  image_url           = "${module.ecr.repository_url}:${var.image_tag}"
  container_port      = 8001
  task_cpu            = var.task_cpu
  task_memory         = var.task_memory
  target_group_arn    = module.alb.target_group_arn
  secret_arn          = module.secrets.secret_arn
  rds_endpoint        = module.rds.endpoint
  rds_database_name   = module.rds.database_name
  rds_master_username = module.rds.master_username
}

# ── Frontend ─────────────────────────────────────────────────────────────────

module "s3_frontend" {
  source = "./modules/s3-frontend"

  name_prefix = local.name_prefix
  domain      = var.domain
}

module "cloudfront" {
  source = "./modules/cloudfront"
  providers = {
    aws           = aws
    aws.us_east_1 = aws.us_east_1
  }

  name_prefix          = local.name_prefix
  domain               = var.domain
  app_subdomain        = "app"
  bucket_id            = module.s3_frontend.bucket_id
  bucket_arn           = module.s3_frontend.bucket_arn
  bucket_regional_name = module.s3_frontend.bucket_regional_domain_name
  route53_zone_id      = module.route53.zone_id
}

# ── DNS ──────────────────────────────────────────────────────────────────────

module "route53" {
  source = "./modules/route53"

  domain             = var.domain
  alb_dns_name       = module.alb.dns_name
  alb_zone_id        = module.alb.zone_id
  cloudfront_domain  = module.cloudfront.domain_name
  cloudfront_zone_id = module.cloudfront.hosted_zone_id
}

# ── CI/CD ────────────────────────────────────────────────────────────────────

module "github_oidc" {
  source = "./modules/iam-github-oidc"

  name_prefix   = local.name_prefix
  github_repo   = var.github_repo
  ecr_repo_arn  = module.ecr.repository_arn
  ecs_cluster   = module.ecs.cluster_name
  ecs_service   = module.ecs.service_name
  task_role_arn = module.ecs.task_role_arn
  exec_role_arn = module.ecs.execution_role_arn
  s3_bucket_arn = module.s3_frontend.bucket_arn
  cloudfront_id = module.cloudfront.distribution_id
}

# ── Observability ────────────────────────────────────────────────────────────

module "monitoring" {
  source = "./modules/monitoring"

  name_prefix        = local.name_prefix
  alert_email        = var.alert_email
  ecs_cluster_name   = module.ecs.cluster_name
  ecs_service_name   = module.ecs.service_name
  rds_instance_id    = module.rds.instance_id
  alb_arn_suffix     = module.alb.arn_suffix
  monthly_budget_usd = 80
}
