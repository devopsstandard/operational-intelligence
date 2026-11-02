# Custom VPC Network
resource "google_compute_network" "vpc" {
  name                    = "omnipulse-vpc-${var.environment}"
  auto_create_subnetworks = false
  project                 = var.project_id
}

# Subnet for GKE Nodes with Secondary Ranges for VPC-Native Pods and Services
resource "google_compute_subnetwork" "subnet" {
  name                     = "omnipulse-gke-subnet-${var.environment}"
  ip_cidr_range            = var.subnet_cidr
  region                   = var.region
  network                  = google_compute_network.vpc.id
  private_ip_google_access = true
  project                  = var.project_id

  secondary_ip_range {
    range_name    = "gke-pods"
    ip_cidr_range = var.pods_cidr
  }

  secondary_ip_range {
    range_name    = "gke-services"
    ip_cidr_range = var.services_cidr
  }
}

# Cloud Router for Outbound NAT
resource "google_compute_router" "router" {
  name    = "omnipulse-router-${var.environment}"
  region  = var.region
  network = google_compute_network.vpc.id
  project = var.project_id
}

# Cloud NAT for GKE Nodes internet access (pulling external images, APIs)
resource "google_compute_router_nat" "nat" {
  name                               = "omnipulse-nat-${var.environment}"
  router                             = google_compute_router.router.name
  region                             = var.region
  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"
  project                            = var.project_id

  log_config {
    enable = true
    filter = "ERRORS_ONLY"
  }
}
