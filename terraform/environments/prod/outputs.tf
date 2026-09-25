output "gke_cluster_name" {
  value       = module.gke.cluster_name
  description = "GKE Prod Cluster Name"
}

output "gke_cluster_endpoint" {
  value       = module.gke.cluster_endpoint
  description = "GKE Prod Cluster Endpoint"
}

output "artifact_registry_url" {
  value       = module.artifact_registry.repository_url
  description = "Artifact Registry Repository URL for Prod"
}

output "wif_provider_name" {
  value       = module.wif.provider_name
  description = "WIF Provider Name for GitHub Actions"
}

output "cicd_service_account" {
  value       = module.wif.service_account_email
  description = "Service Account email for GitHub Actions"
}

output "argocd_namespace" {
  value       = module.argocd.namespace
  description = "Argo CD Namespace in Prod Cluster"
}

output "ingress_static_ip" {
  value       = google_compute_global_address.ingress_ip.address
  description = "Reserved Global Static IP to configure in DNS A-records for *.devopsstandard.name.ng"
}

output "domain_urls" {
  value = {
    marketplace      = "https://prod.${var.domain_name}"
    marketplace_root = "https://${var.domain_name}"
    argocd           = "https://argocd.${var.domain_name}"
    headlamp         = "https://headlamp.${var.domain_name}"
  }
  description = "Configured Domain endpoints for Prod environment"
}

