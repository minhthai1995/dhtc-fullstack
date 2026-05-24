data "aws_caller_identity" "current" {}

locals {
  log_group_name = "/ecs/${var.name_prefix}-backend"

  database_url = format(
    "postgresql+asyncpg://%s:%s@%s/%s",
    var.rds_master_username,
    "DB_PASSWORD_PLACEHOLDER", # replaced by container entrypoint reading secret
    var.rds_endpoint,
    var.rds_database_name,
  )
}

# ── Cluster ───────────────────────────────────────────────────────────────────

resource "aws_ecs_cluster" "this" {
  name = "${var.name_prefix}-cluster"

  setting {
    name  = "containerInsights"
    value = "disabled" # Container Insights ~$2/mo per cluster. Enable later if needed.
  }
}

# ── IAM ───────────────────────────────────────────────────────────────────────

data "aws_iam_policy_document" "ecs_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

# Execution role: pulls image from ECR, writes logs, reads secrets at boot.
resource "aws_iam_role" "execution" {
  name               = "${var.name_prefix}-ecs-execution"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume.json
}

resource "aws_iam_role_policy_attachment" "execution_managed" {
  role       = aws_iam_role.execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy" "execution_secrets" {
  name = "${var.name_prefix}-ecs-execution-secrets"
  role = aws_iam_role.execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["secretsmanager:GetSecretValue"]
      Resource = [var.secret_arn]
    }]
  })
}

# Task role: what the running container's app code can call. Keep empty for now.
resource "aws_iam_role" "task" {
  name               = "${var.name_prefix}-ecs-task"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume.json
}

# ── Logs ──────────────────────────────────────────────────────────────────────

resource "aws_cloudwatch_log_group" "backend" {
  name              = local.log_group_name
  retention_in_days = 14
}

# ── Task Definition ──────────────────────────────────────────────────────────

resource "aws_ecs_task_definition" "backend" {
  family                   = "${var.name_prefix}-backend"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = tostring(var.task_cpu)
  memory                   = tostring(var.task_memory)

  execution_role_arn = aws_iam_role.execution.arn
  task_role_arn      = aws_iam_role.task.arn

  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "X86_64"
  }

  container_definitions = jsonencode([{
    name      = "backend"
    image     = var.image_url
    essential = true

    portMappings = [{
      containerPort = var.container_port
      protocol      = "tcp"
    }]

    environment = [
      { name = "ENVIRONMENT", value = "production" },
      { name = "PORT", value = tostring(var.container_port) },
      { name = "DB_HOST", value = split(":", var.rds_endpoint)[0] },
      { name = "DB_PORT", value = "5432" },
      { name = "DB_NAME", value = var.rds_database_name },
      { name = "DB_USER", value = var.rds_master_username },
      { name = "AWS_REGION", value = var.region },
      { name = "SECRET_ID", value = var.secret_arn },
    ]

    # Container reads these from Secrets Manager at startup via the JSON keys below.
    secrets = [
      { name = "DATABASE_PASSWORD", valueFrom = "${var.secret_arn}:DATABASE_PASSWORD::" },
      { name = "SECRET_KEY", valueFrom = "${var.secret_arn}:SECRET_KEY::" },
      { name = "FB_PAGE_ACCESS_TOKEN", valueFrom = "${var.secret_arn}:FB_PAGE_ACCESS_TOKEN::" },
      { name = "FB_APP_SECRET", valueFrom = "${var.secret_arn}:FB_APP_SECRET::" },
      { name = "FB_VERIFY_TOKEN", valueFrom = "${var.secret_arn}:FB_VERIFY_TOKEN::" },
      { name = "OPENAI_API_KEY", valueFrom = "${var.secret_arn}:OPENAI_API_KEY::" },
      { name = "ANTHROPIC_API_KEY", valueFrom = "${var.secret_arn}:ANTHROPIC_API_KEY::" },
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.backend.name
        "awslogs-region"        = var.region
        "awslogs-stream-prefix" = "ecs"
      }
    }

    healthCheck = {
      command     = ["CMD-SHELL", "curl -fsS http://localhost:${var.container_port}/api/v1/health || exit 1"]
      interval    = 30
      timeout     = 5
      retries     = 3
      startPeriod = 30
    }
  }])
}

# ── Service ──────────────────────────────────────────────────────────────────

resource "aws_ecs_service" "backend" {
  name            = "${var.name_prefix}-backend"
  cluster         = aws_ecs_cluster.this.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.subnet_ids
    security_groups  = [var.security_group_id]
    assign_public_ip = true # Public subnet, no NAT
  }

  load_balancer {
    target_group_arn = var.target_group_arn
    container_name   = "backend"
    container_port   = var.container_port
  }

  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200
  health_check_grace_period_seconds  = 60

  # CI bumps the image_tag on each deploy; ignore drift so a fresh `apply` doesn't
  # rollback what GitHub Actions just pushed.
  lifecycle {
    ignore_changes = [task_definition, desired_count]
  }
}
