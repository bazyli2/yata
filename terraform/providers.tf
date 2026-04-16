# Provider configuration.
#
# All API tokens are supplied via Terraform Cloud workspace environment
# variables (marked sensitive). The variable names below are the ones each
# provider reads by default, so no explicit `token = var.*` plumbing is
# needed here — see the bootstrap section of README.md for the list.
#
#   NEON_API_KEY     → neon provider
#   VERCEL_API_TOKEN → vercel provider
#   FLY_API_TOKEN    → fly provider
#   DOPPLER_TOKEN    → doppler provider

provider "neon" {}

provider "vercel" {}

provider "fly" {}

provider "doppler" {}

provider "random" {}
