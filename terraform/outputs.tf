# Non-sensitive outputs for operator convenience and cross-checking the
# runtime wiring. Everything here is safe to log; secrets stay in Doppler
# and TFC state only.

output "fly_app_name" {
  description = "Name of the Fly.io app running the backend."
  value       = fly_app.backend.name
}

output "fly_url" {
  description = "Public URL of the FastAPI backend on Fly.io."
  value       = local.backend_origin
}

output "vercel_project_id" {
  description = "Vercel project ID for the Next.js frontend."
  value       = vercel_project.frontend.id
}

output "vercel_url" {
  description = "Vercel production URL, derived from the project name (`<project>.vercel.app`)."
  value       = local.vercel_prod_url
}

output "neon_project_id" {
  description = "Neon project ID. Useful for CLI/API access outside Terraform."
  value       = neon_project.yata.id
}

output "neon_host" {
  description = "Neon Postgres host for the main branch's read/write endpoint."
  value       = neon_endpoint.main.host
}

output "doppler_prd_config" {
  description = "Doppler config name that holds prod runtime secrets."
  value       = doppler_config.prd.name
}
