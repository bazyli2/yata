# Terraform core + provider pins, plus remote state backend.
#
# State lives in Terraform Cloud (org `yata`, workspace `yata-prod`). VCS
# integration on this directory drives plan-on-PR and apply-on-merge, so
# there is no need for a separate `terraform-apply.yml` GitHub workflow.
#
# Provider versions are pinned with caret ranges for stable providers and
# tight tilde ranges for the 0.x Fly provider (which still breaks between
# patch releases). Any bump needs a manual plan review.

terraform {
  required_version = ">= 1.9.0"

  cloud {
    organization = "bazyli2"

    workspaces {
      name = "yata"
    }
  }

  required_providers {
    neon = {
      source  = "kislerdm/neon"
      version = "~> 0.9"
    }

    vercel = {
      source  = "vercel/vercel"
      version = "~> 4.8"
    }

    fly = {
      source  = "fly-apps/fly"
      version = "~> 0.0.23"
    }

    doppler = {
      source  = "DopplerHQ/doppler"
      version = "~> 1.17"
    }
  }
}
