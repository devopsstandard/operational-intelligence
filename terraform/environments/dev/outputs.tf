output "gke_cluster_name" {
  value       = module.gke.cluster_name
  description = "GKE Dev Cluster Name"
}

output "gke_cluster_endpoint" {
  value       = module.gke.cluster_endpoint
  description = "GKE Dev Cluster Endpoint"
}

output "artifact_registry_url" {
  value       = module.artifact_registry.repository_url
  description = "Artifact Registry Repository URL for Dev"
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
  description = "Argo CD Namespace in Dev Cluster"
}

output "ingress_static_ip" {
  value       = google_compute_global_address.ingress_ip.address
  description = "Headlamp Ingress Static IP"
}

output "frontend_static_ip" {
  value       = google_compute_global_address.frontend_ip.address
  description = "OmniPulse Frontend Dev Ingress Static IP (dev.devopsstandard.name.ng)"
}

output "argocd_static_ip" {
  value       = google_compute_global_address.argocd_ip.address
  description = "Argo CD Ingress Static IP (argocd.devopsstandard.name.ng)"
}

output "static_ips" {
  value = {
    headlamp = google_compute_global_address.ingress_ip.address
    frontend = google_compute_global_address.frontend_ip.address
    argocd   = google_compute_global_address.argocd_ip.address
    grafana  = google_compute_global_address.grafana_ip.address
  }
  description = "All reserved static IPs to configure in DNS A-records"
}

output "domain_urls" {
  value = {
    marketplace = "https://dev.${var.domain_name}"
    argocd      = "https://argocd.${var.domain_name}"
    headlamp    = "https://headlamp.${var.domain_name}"
    grafana     = "https://grafana.${var.domain_name}"
  }
  description = "Application URLs across domains"
}
