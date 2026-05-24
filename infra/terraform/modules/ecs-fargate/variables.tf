variable "name_prefix" {
  type = string
}

variable "region" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "subnet_ids" {
  type = list(string)
}

variable "security_group_id" {
  type = string
}

variable "image_url" {
  description = "Full ECR image URL including tag"
  type        = string
}

variable "container_port" {
  type    = number
  default = 8001
}

variable "task_cpu" {
  type    = number
  default = 512
}

variable "task_memory" {
  type    = number
  default = 1024
}

variable "target_group_arn" {
  type = string
}

variable "secret_arn" {
  description = "Secrets Manager ARN with bundle of env values"
  type        = string
}

variable "rds_endpoint" {
  type = string
}

variable "rds_database_name" {
  type = string
}

variable "rds_master_username" {
  type = string
}
