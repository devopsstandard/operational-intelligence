output "cluster_name" {
  value       = google_container_cluster.primary.name
  description = "The name of the GKE cluster"
}

output "cluster_endpoint" {
  value       = google_container_cluster.primary.endpoint
  description = "The IP address of the GKE cluster control plane API"
}

output "ca_certificate" {
  value       = google_container_cluster.primary.master_auth[0].cluster_ca_certificate
  description = "Base64 encoded CA certificate for the cluster"
}

output "workload_identity_pool" {
  value       = "${var.project_id}.svc.id.goog"
  description = "The Workload Identity Pool for the cluster"
}

output "ondemand_node_pool_name" {
  value       = google_container_node_pool.ondemand_nodes.name
  description = "Name of the On-Demand node pool"
}
