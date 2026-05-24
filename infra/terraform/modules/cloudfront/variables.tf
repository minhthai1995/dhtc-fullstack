variable "name_prefix" {
  type = string
}

variable "domain" {
  type = string
}

variable "app_subdomain" {
  type    = string
  default = "app"
}

variable "bucket_id" {
  type = string
}

variable "bucket_arn" {
  type = string
}

variable "bucket_regional_name" {
  description = "S3 bucket regional domain name to use as CloudFront origin"
  type        = string
}

variable "route53_zone_id" {
  description = "Hosted zone id (unused here but kept for symmetry with route53 module)"
  type        = string
  default     = ""
}
