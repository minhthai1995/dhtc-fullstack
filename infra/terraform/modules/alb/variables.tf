variable "name_prefix" {
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

variable "domain" {
  description = "Apex domain (dhtcdanang.com)"
  type        = string
}

variable "api_subdomain" {
  description = "Subdomain for the backend (api)"
  type        = string
  default     = "api"
}
