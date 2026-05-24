resource "random_password" "master" {
  length  = 32
  special = true
  # RDS rejects /, @, ", and spaces in master_password.
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

resource "aws_db_subnet_group" "this" {
  name       = "${var.name_prefix}-db-subnets"
  subnet_ids = var.subnet_ids
  tags       = { Name = "${var.name_prefix}-db-subnets" }
}

resource "aws_db_parameter_group" "pg16" {
  name        = "${var.name_prefix}-pg16"
  family      = "postgres16"
  description = "DHTC Postgres 16 tuning"

  parameter {
    name  = "log_min_duration_statement"
    value = "500"
  }

  parameter {
    name  = "log_connections"
    value = "1"
  }
}

resource "aws_db_instance" "this" {
  identifier     = "${var.name_prefix}-pg"
  engine         = "postgres"
  engine_version = "16.4"

  instance_class    = var.instance_class
  allocated_storage = var.allocated_storage
  storage_type      = "gp3"
  storage_encrypted = true

  db_name  = "dhtc"
  username = "dhtcadmin"
  password = random_password.master.result

  db_subnet_group_name   = aws_db_subnet_group.this.name
  vpc_security_group_ids = var.security_group_ids
  parameter_group_name   = aws_db_parameter_group.pg16.name

  publicly_accessible = var.publicly_accessible
  multi_az            = false
  port                = 5432

  backup_retention_period   = 7
  backup_window             = "17:00-18:00" # 00:00-01:00 ICT
  maintenance_window        = "sun:18:00-sun:19:30"
  skip_final_snapshot       = false
  final_snapshot_identifier = "${var.name_prefix}-pg-final-${formatdate("YYYYMMDDhhmmss", timestamp())}"
  deletion_protection       = true

  performance_insights_enabled          = true
  performance_insights_retention_period = 7

  apply_immediately = false

  tags = { Name = "${var.name_prefix}-pg" }

  lifecycle {
    ignore_changes = [final_snapshot_identifier]
  }
}
