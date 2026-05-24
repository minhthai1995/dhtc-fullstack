output "zone_id" {
  value = data.aws_route53_zone.primary.zone_id
}

output "name_servers" {
  description = "NS records to paste into registrar"
  value       = data.aws_route53_zone.primary.name_servers
}
