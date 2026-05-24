variable "name_prefix" {
  type = string
}

variable "alert_email" {
  type = string
}

variable "ecs_cluster_name" {
  type = string
}

variable "ecs_service_name" {
  type = string
}

variable "rds_instance_id" {
  type = string
}

variable "alb_arn_suffix" {
  type = string
}

variable "monthly_budget_usd" {
  type    = number
  default = 80
}
