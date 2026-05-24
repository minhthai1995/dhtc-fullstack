project     = "dhtcdanang"
environment = "prod"
region      = "ap-southeast-1"
aws_profile = "dhtcdanang"

domain      = "dhtcdanang.com"
alert_email = "REPLACE_WITH_YOUR_EMAIL@example.com" # TODO: set before first apply
github_repo = "REPLACE_OWNER/REPLACE_REPO"          # TODO: e.g. "thaifdv/DHTC-fullstack"

# Sizing — adjust as traffic grows
db_instance_class    = "db.t4g.micro"
db_allocated_storage = 20
task_cpu             = 512
task_memory          = 1024

# Temporary: opens RDS to the internet for initial pg_dump restore.
# Flip to false after migration completes and re-apply.
db_publicly_accessible = true
admin_ingress_cidr     = "0.0.0.0/0" # TODO: tighten to your laptop /32 after migration
