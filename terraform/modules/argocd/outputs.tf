output "namespace" {
  value       = helm_release.argocd.namespace
  description = "Kubernetes namespace where Argo CD is deployed"
}

output "release_name" {
  value       = helm_release.argocd.name
  description = "Argo CD Helm release name"
}

output "chart_version" {
  value       = helm_release.argocd.version
  description = "Argo CD Helm chart version deployed"
}
