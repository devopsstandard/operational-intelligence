# Service Account for Standard GKE Nodes
resource "google_service_account" "gke_nodes_sa" {
  account_id   = "omnipulse-gke-sa-${var.environment}"
  display_name = "OmniPulse GKE Nodes SA (${var.environment})"
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

# Standard VPC-Native GKE Cluster
resource "google_container_cluster" "primary" {
  name                = "omnipulse-gke-cluster-${var.environment}"
  location            = var.cluster_location != null ? var.cluster_location : var.region
  project             = var.project_id
  network             = var.network_id
  subnetwork          = var.subnet_id
  deletion_protection = false

  # Remove default node pool immediately to manage nodes through explicit node pool resource
  remove_default_node_pool = true
  initial_node_count       = 1

  # Explicitly configure default initial node with target machine_type to avoid stockouts on e2-medium
  node_config {
    machine_type    = var.machine_type
    disk_size_gb    = var.disk_size_gb
    disk_type       = "pd-balanced"
    service_account = google_service_account.gke_nodes_sa.email

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]
  }

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

  # Keyless Workload Identity Federation enabled on cluster
  workload_identity_config {
    workload_pool = "${var.project_id}.svc.id.goog"
  }

  # Add-ons configuration
  addons_config {
    http_load_balancing {
      disabled = false
    }
    horizontal_pod_autoscaling {
      disabled = false
    }
    network_policy_config {
      disabled = true
    }
  }

  # Release Channel
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

# Dedicated 3-Node Pool for OmniPulse Workloads (e2-standard-4 in europe-west1-b)
resource "google_container_node_pool" "primary_nodes" {
  name           = "omnipulse-node-pool-${var.environment}"
  location       = var.cluster_location != null ? var.cluster_location : var.region
  cluster        = google_container_cluster.primary.name
  project        = var.project_id
  node_locations = var.node_locations
  node_count     = var.node_count

  management {
    auto_repair  = true
    auto_upgrade = true
  }

  node_config {
    machine_type    = var.machine_type
    disk_size_gb    = var.disk_size_gb
    disk_type       = "pd-balanced"
    service_account = google_service_account.gke_nodes_sa.email

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]

    labels = {
      environment = var.environment
      role        = "worker"
      platform    = "omnipulse"
    }

    # Standard Workload Identity on nodes
    workload_metadata_config {
      mode = "GKE_METADATA"
    }

    metadata = {
      disable-legacy-endpoints = "true"
    }
  }
}
