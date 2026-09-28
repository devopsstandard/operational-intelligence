# Service Account for GKE Autopilot Nodes
resource "google_service_account" "gke_nodes_sa" {
  account_id   = "boutique-gke-sa-${var.environment}"
  display_name = "Online Boutique GKE Autopilot Nodes SA (${var.environment})"
  project      = var.project_id
}

# Grant GKE Nodes SA minimal permissions
resource "google_project_iam_member" "node_log_writer" {
  project = var.project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.gke_nodes_sa.email}"
}

resource "google_project_iam_member" "node_metric_writer" {
  project = var.project_id
  role    = "roles/monitoring.metricWriter"
  member  = "serviceAccount:${google_service_account.gke_nodes_sa.email}"
}

resource "google_project_iam_member" "node_ar_reader" {
  project = var.project_id
  role    = "roles/artifactregistry.reader"
  member  = "serviceAccount:${google_service_account.gke_nodes_sa.email}"
}

# VPC-Native GKE Autopilot Cluster
resource "google_container_cluster" "primary" {
  name                = "boutique-gke-cluster-${var.environment}"
  location            = var.region
  project             = var.project_id
  network             = var.network_id
  subnetwork          = var.subnet_id
  enable_autopilot    = true
  deletion_protection = var.environment == "prod" ? true : false

  # VPC-Native IP Allocation
  ip_allocation_policy {
    cluster_secondary_range_name  = var.pods_secondary_range_name
    services_secondary_range_name = var.services_secondary_range_name
  }

  # Private Cluster Configuration
  private_cluster_config {
    enable_private_nodes    = true
    enable_private_endpoint = false
    master_ipv4_cidr_block  = var.master_ipv4_cidr_block
  }

  # Control Plane Authorized Networks (Optional IP restriction)
  dynamic "master_authorized_networks_config" {
    for_each = var.enable_master_authorized_networks ? [1] : []
    content {
      dynamic "cidr_blocks" {
        for_each = var.master_authorized_cidrs
        content {
          cidr_block   = cidr_blocks.value.cidr_block
          display_name = cidr_blocks.value.display_name
        }
      }
    }
  }

  # Cluster Autoscaling & Custom Service Account for Autopilot Nodes
  cluster_autoscaling {
    auto_provisioning_defaults {
      service_account = google_service_account.gke_nodes_sa.email
      oauth_scopes = [
        "https://www.googleapis.com/auth/cloud-platform"
      ]
    }
  }

  # Release Channel (Autopilot requires a release channel, default REGULAR)
  release_channel {
    channel = "REGULAR"
  }

  # Maintenance Policy
  maintenance_policy {
    daily_maintenance_window {
      start_time = "03:00"
    }
  }
}
