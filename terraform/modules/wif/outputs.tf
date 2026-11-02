output "pool_id" {
  value       = var.create_wif ? google_iam_workload_identity_pool.github_pool[0].workload_identity_pool_id : "github-actions-pool-${var.environment}"
  description = "Workload Identity Pool ID"
}

output "provider_id" {
  value       = var.create_wif ? google_iam_workload_identity_pool_provider.github_provider[0].workload_identity_pool_provider_id : "github-actions-provider"
  description = "Workload Identity Provider ID"
}

output "provider_name" {
  value       = var.create_wif ? google_iam_workload_identity_pool_provider.github_provider[0].name : "projects/${var.project_id}/locations/global/workloadIdentityPools/github-actions-pool-${var.environment}/providers/github-actions-provider"
  description = "Full resource name of the Workload Identity Provider"
}

output "service_account_email" {
  value       = var.create_wif ? google_service_account.cicd_sa[0].email : "omnipulse-cicd-sa-${var.environment}@${var.project_id}.iam.gserviceaccount.com"
  description = "Service Account email for GitHub Actions CI/CD"
}
