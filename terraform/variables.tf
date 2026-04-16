# Inputs for the prod stack.
#
# All defaults encode the current intent: Fly in `ams` (Amsterdam) next to
# Neon in `aws-eu-central-1` (Frankfurt) for sub-10ms DB latency. Override
# via Terraform Cloud workspace variables if the region strategy changes.

variable "github_repo" {
  description = "GitHub repository for the Vercel Git integration, in `owner/name` form."
  type        = string
  default     = "bazyli2/yata"
}

variable "fly_app_name" {
  description = "Name of the Fly.io app hosting the FastAPI backend. Must be globally unique on Fly."
  type        = string
  default     = "yata-backend-prd"
}

variable "fly_region" {
  description = "Primary Fly.io region for the backend machine."
  type        = string
  default     = "ams"
}

variable "neon_region" {
  description = "Neon region for the Postgres project. Pick the AWS region closest to `fly_region`."
  type        = string
  default     = "aws-eu-central-1"
}

variable "vercel_project_name" {
  description = "Name of the Vercel project for the Next.js frontend."
  type        = string
  default     = "yata"
}

variable "custom_domain" {
  description = "Optional custom domain to attach to the Vercel project. Leave blank to use the auto-generated *.vercel.app URL."
  type        = string
  default     = ""
}
