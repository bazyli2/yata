# Inputs for the prod stack.
#
# Override via Terraform Cloud workspace variables if the strategy changes.

variable "github_repo" {
  description = "GitHub repository for the Vercel Git integration, in `owner/name` form."
  type        = string
  default     = "bazyli2/yata"
}

variable "neon_region" {
  description = "Neon region for the Postgres project."
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
