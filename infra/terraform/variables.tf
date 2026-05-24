variable "project" {
  description = "Short project identifier used as resource name prefix"
  type        = string
  default     = "dhtcdanang"
}

variable "environment" {
  description = "Deployment environment (prod, staging, etc.)"
  type        = string
  default     = "prod"
}

variable "region" {
  description = "Primary AWS region for all regional resources"
  type        = string
  default     = "ap-southeast-1"
}

variable "aws_profile" {
  description = "Local AWS CLI profile name used by Terraform"
  type        = string
  default     = "dhtcdanang"
}

variable "domain" {
  description = "Apex domain hosting api/app subdomains"
  type        = string
}

variable "alert_email" {
  description = "Email to receive CloudWatch alarms + budget alerts"
  type        = string
}

variable "github_repo" {
  description = "GitHub repo in 'owner/name' form for OIDC trust policy"
  type        = string
}

variable "image_tag" {
  description = "ECR image tag deployed to ECS (typically the git sha; default 'latest' for first apply)"
  type        = string
  default     = "latest"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t4g.micro"
}

variable "db_allocated_storage" {
  description = "RDS allocated storage GB"
  type        = number
  default     = 20
}

variable "db_publicly_accessible" {
  description = "Whether RDS is reachable from the internet. Set true only during initial data migration."
  type        = bool
  default     = true
}

variable "task_cpu" {
  description = "Fargate task CPU units (256=0.25, 512=0.5, 1024=1.0)"
  type        = number
  default     = 512
}

variable "task_memory" {
  description = "Fargate task memory MiB"
  type        = number
  default     = 1024
}

variable "admin_ingress_cidr" {
  description = "CIDR allowed to reach RDS publicly during migration (your laptop /32)"
  type        = string
  default     = "0.0.0.0/0"
}
