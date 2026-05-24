output "vpc_id" {
  value = data.aws_vpc.default.id
}

output "public_subnet_ids" {
  value = data.aws_subnets.default.ids
}

output "alb_security_group_id" {
  value = aws_security_group.alb.id
}

output "task_security_group_id" {
  value = aws_security_group.task.id
}

output "db_security_group_id" {
  value = aws_security_group.db.id
}
