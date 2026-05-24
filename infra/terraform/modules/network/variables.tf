variable "name_prefix" {
  description = "Resource name prefix (project-environment)"
  type        = string
}

variable "admin_ingress_cidr" {
  description = "CIDR allowed to reach RDS during initial migration (tighten to /32 after)"
  type        = string
  default     = "0.0.0.0/0"
}
