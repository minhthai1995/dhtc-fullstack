variable "name_prefix" {
  type = string
}

variable "domain" {
  description = "Apex domain — used to derive bucket name"
  type        = string
}
