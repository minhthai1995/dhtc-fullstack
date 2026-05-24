terraform {
  # Backend config values are provided via `-backend-config=envs/<env>/backend.hcl`
  # during `terraform init` to keep the same code reusable across environments.
  backend "s3" {}
}
