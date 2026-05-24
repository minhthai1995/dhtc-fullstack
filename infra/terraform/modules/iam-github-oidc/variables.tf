variable "name_prefix" {
  type = string
}

variable "github_repo" {
  description = "owner/repo, e.g. thaifdv/DHTC-fullstack"
  type        = string
}

variable "ecr_repo_arn" {
  type = string
}

variable "ecs_cluster" {
  type = string
}

variable "ecs_service" {
  type = string
}

variable "task_role_arn" {
  type = string
}

variable "exec_role_arn" {
  type = string
}

variable "s3_bucket_arn" {
  type = string
}

variable "cloudfront_id" {
  type = string
}
