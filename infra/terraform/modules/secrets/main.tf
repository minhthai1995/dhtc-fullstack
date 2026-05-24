# Single Secrets Manager bundle holding all app secrets (~$0.40/mo).
# Values for FB_*/openai keys are populated manually via AWS Console after first apply.
# db_password is sourced from the RDS module (random_password) so it's never typed by a human.

resource "aws_secretsmanager_secret" "app" {
  name                    = "${var.name_prefix}/app"
  description             = "Bundle of app secrets (db, facebook, llm keys)"
  recovery_window_in_days = 7
}

resource "aws_secretsmanager_secret_version" "app" {
  secret_id = aws_secretsmanager_secret.app.id

  secret_string = jsonencode({
    DATABASE_PASSWORD    = var.db_password
    SECRET_KEY           = "REPLACE_AFTER_APPLY"
    FB_PAGE_ACCESS_TOKEN = "REPLACE_AFTER_APPLY"
    FB_APP_SECRET        = "REPLACE_AFTER_APPLY"
    FB_VERIFY_TOKEN      = "REPLACE_AFTER_APPLY"
    OPENAI_API_KEY       = "REPLACE_AFTER_APPLY"
    ANTHROPIC_API_KEY    = "REPLACE_AFTER_APPLY"
  })

  # After first apply, operators rotate values via Console.
  # TF should not overwrite manual edits on subsequent applies.
  lifecycle {
    ignore_changes = [secret_string]
  }
}
