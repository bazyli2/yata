# Provider configuration.
#
# NEON_API_KEY, VERCEL_API_TOKEN, and FLY_API_TOKEN are read from the
# Doppler `yata/terraform` config via data.doppler_secrets.terraform.
# DOPPLER_TOKEN remains a Terraform Cloud workspace env var — it's the
# bootstrap credential the Doppler provider needs before it can read
# anything else.

provider "neon" {
  api_key = data.doppler_secrets.terraform.map.NEON_API_KEY
}

provider "vercel" {
  api_token = data.doppler_secrets.terraform.map.VERCEL_API_TOKEN
}

provider "fly" {
  fly_api_token = data.doppler_secrets.terraform.map.FLY_API_TOKEN
}

provider "doppler" {}
