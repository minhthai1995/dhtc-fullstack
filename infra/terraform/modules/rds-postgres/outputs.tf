output "endpoint" {
  description = "host:port — use to build DATABASE_URL"
  value       = aws_db_instance.this.endpoint
}

output "address" {
  value = aws_db_instance.this.address
}

output "port" {
  value = aws_db_instance.this.port
}

output "database_name" {
  value = aws_db_instance.this.db_name
}

output "master_username" {
  value = aws_db_instance.this.username
}

output "master_password" {
  description = "Generated master password — consumed by secrets module"
  value       = random_password.master.result
  sensitive   = true
}

output "instance_id" {
  value = aws_db_instance.this.id
}
