output "network_id" {
  value       = google_compute_network.vpc.id
  description = "The ID of the VPC network"
}

output "network_name" {
  value       = google_compute_network.vpc.name
  description = "The name of the VPC network"
}

output "subnet_id" {
  value       = google_compute_subnetwork.subnet.id
  description = "The ID of the GKE subnetwork"
}

output "subnet_name" {
  value       = google_compute_subnetwork.subnet.name
  description = "The name of the GKE subnetwork"
}

output "pods_secondary_range_name" {
  value       = "gke-pods"
  description = "Name of secondary range for Pods"
}

output "services_secondary_range_name" {
  value       = "gke-services"
  description = "Name of secondary range for Services"
}
