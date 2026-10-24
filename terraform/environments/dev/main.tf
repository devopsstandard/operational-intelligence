terraform {
  required_version = ">= 1.5.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 5.0"
    }
    helm = {
      source  = "hashicorp/helm"
      version = ">= 2.12.0, < 3.0.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = ">= 2.26.0"
    }
  }

  backend "gcs" {
    prefix = "terraform/state/dev"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

data "google_client_config" "default" {}

provider "kubernetes" {
  host                   = "https://${module.gke.cluster_endpoint}"
  token                  = data.google_client_config.default.access_token
  cluster_ca_certificate = base64decode(module.gke.ca_certificate)
}

provider "helm" {
  kubernetes {
    host                   = "https://${module.gke.cluster_endpoint}"
    token                  = data.google_client_config.default.access_token
    cluster_ca_certificate = base64decode(module.gke.ca_certificate)
  }
}

# 1. Custom VPC Network with Secondary Ranges for Pods and Services
module "vpc" {
  source        = "../../modules/vpc"
  project_id    = var.project_id
  region        = var.region
  environment   = "dev"
  subnet_cidr   = "10.0.0.0/20"
  pods_cidr     = "10.16.0.0/14"
  services_cidr = "10.20.0.0/20"
}

# 2. VPC-Native GKE Autopilot Cluster (Dev: Cost-optimized with Spot Pods)
module "gke" {
  source                        = "../../modules/gke"
  project_id                    = var.project_id
  region                        = var.region
  environment                   = "dev"
  network_id                    = module.vpc.network_id
  subnet_id                     = module.vpc.subnet_id
  pods_secondary_range_name     = module.vpc.pods_secondary_range_name
  services_secondary_range_name = module.vpc.services_secondary_range_name
}

# 3. Artifact Registry for Container Images
module "artifact_registry" {
  source      = "../../modules/artifact-registry"
  project_id  = var.project_id
  region      = var.region
  environment = "dev"
}

# 4. Workload Identity Federation for GitHub Actions
module "wif" {
  source      = "../../modules/wif"
  project_id  = var.project_id
  environment = "dev"
  github_repo = var.github_repo
  create_wif  = var.create_wif
}

# 5. Argo CD GitOps Engine Deployment (Dev: Single Replica, LoadBalancer)
module "argocd" {
  source                     = "../../modules/argocd"
  environment                = "dev"
  server_service_type        = "ClusterIP"
  ha_mode                    = false
  enable_slack_notifications = var.enable_slack_notifications
  slack_token                = var.slack_token
  slack_channel              = var.slack_channel
  github_repo_url            = "https://github.com/${var.github_repo}.git"
  github_pat_token           = var.github_pat_token

  depends_on = [module.gke]
}

# 6. Reserved Global Static IPs for Services (*.devopsstandard.name.ng)
resource "google_compute_global_address" "ingress_ip" {
  name        = "boutique-ingress-ip-dev"
  description = "Static IP for Headlamp Ingress (headlamp.devopsstandard.name.ng)"
  project     = var.project_id
}

resource "google_compute_global_address" "frontend_ip" {
  name        = "boutique-frontend-ip-dev"
  description = "Static IP for Boutique Frontend (dev.devopsstandard.name.ng)"
  project     = var.project_id
}

resource "google_compute_global_address" "argocd_ip" {
  name        = "boutique-argocd-ip-dev"
  description = "Static IP for Argo CD (argocd.devopsstandard.name.ng)"
  project     = var.project_id
}

resource "google_compute_global_address" "grafana_ip" {
  name        = "boutique-grafana-ip-dev"
  description = "Static IP for Grafana (grafana.devopsstandard.name.ng)"
  project     = var.project_id
}

# 7. Robusta OSS Automated Operational Intelligence Engine (Incident Triage & HITL Remediation)
module "robusta" {
  count            = var.enable_robusta ? 1 : 0
  source           = "../../modules/robusta"
  project_id       = var.project_id
  region           = var.region
  environment      = "dev"
  cluster_name     = "omnipulse-gke-cluster-dev"
  slack_channel    = var.slack_channel
  slack_api_key    = var.slack_token
  bigquery_dataset = var.bigquery_dataset
  gemini_model     = "gemini-1.5-flash"

  depends_on = [module.gke]
}

# 8. OpenTelemetry (OTel) Collector & Telemetry Cold-Storage Archive
module "opentelemetry" {
  source      = "../../modules/opentelemetry"
  project_id  = var.project_id
  region      = var.region
  environment = "dev"
}

