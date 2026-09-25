# Service Account for GKE Nodes
resource "google_service_account" "gke_nodes_sa" {
  account_id   = "boutique-gke-sa-${var.environment}"
  display_name = "Online Boutique GKE Nodes SA (${var.environment})"
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

# VPC-Native GKE Cluster
resource "google_container_cluster" "primary" {
  name                     = "boutique-gke-cluster-${var.environment}"
  location                 = var.is_regional ? var.region : "${var.region}-a"
  project                  = var.project_id
  network                  = var.network_id
  subnetwork               = var.subnet_id
  remove_default_node_pool = true
  initial_node_count       = 1
  deletion_protection      = var.environment == "prod" ? true : false

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

  # Control Plane Authorized Networks
  master_authorized_networks_config {
    dynamic "cidr_blocks" {
      for_each = var.master_authorized_cidrs
      content {
        cidr_block   = cidr_blocks.value.cidr_block
        display_name = cidr_blocks.value.display_name
      }
    }
  }

  # Workload Identity
  workload_identity_config {
    workload_pool = "${var.project_id}.svc.id.goog"
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

# 1. On-Demand Node Pool
resource "google_container_node_pool" "ondemand_nodes" {
  name       = "boutique-ondemand-${var.environment}"
  location   = var.is_regional ? var.region : "${var.region}-a"
  cluster    = google_container_cluster.primary.name
  project    = var.project_id
  node_count = var.environment == "prod" ? 2 : 1

  autoscaling {
    min_node_count = 1
    max_node_count = var.environment == "prod" ? 10 : 5
  }

  management {
    auto_repair  = true
    auto_upgrade = true
  }

  node_config {
    spot         = false
    machine_type = var.ondemand_machine_type
    disk_size_gb = 50
    disk_type    = "pd-ssd"
    image_type   = "COS_CONTAINERD"

    service_account = google_service_account.gke_nodes_sa.email
    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]

    labels = {
      "workload-type" = "ondemand"
      "environment"   = var.environment
      "part-of"       = "online-boutique"
    }

    tags = ["boutique-gke-node", "boutique-ondemand-node"]

    workload_metadata_config {
      mode = "GKE_METADATA"
    }
  }
}

# 2. Spot Node Pool (Cost-optimized for dev or non-critical worker workloads)
resource "google_container_node_pool" "spot_nodes" {
  count      = var.enable_spot_pool ? 1 : 0
  name       = "boutique-spot-${var.environment}"
  location   = var.is_regional ? var.region : "${var.region}-a"
  cluster    = google_container_cluster.primary.name
  project    = var.project_id
  node_count = 1

  autoscaling {
    min_node_count = 0
    max_node_count = var.environment == "prod" ? 10 : 3
  }

  management {
    auto_repair  = true
    auto_upgrade = true
  }

  node_config {
    spot         = true
    machine_type = var.spot_machine_type
    disk_size_gb = 50
    disk_type    = "pd-ssd"
    image_type   = "COS_CONTAINERD"

    service_account = google_service_account.gke_nodes_sa.email
    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]

    labels = {
      "workload-type"             = "spot"
      "cloud.google.com/gke-spot" = "true"
      "environment"               = var.environment
      "part-of"                   = "online-boutique"
    }

    tags = ["boutique-gke-node", "boutique-spot-node"]

    workload_metadata_config {
      mode = "GKE_METADATA"
    }
  }
}
