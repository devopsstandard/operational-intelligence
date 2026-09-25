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
    prefix = "terraform/state/prod"
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
  environment   = "prod"
  subnet_cidr   = "10.10.0.0/20"
  pods_cidr     = "10.32.0.0/14"
  services_cidr = "10.40.0.0/20"
}

# 2. VPC-Native GKE Cluster (Prod: Regional HA Cluster across multiple zones)
module "gke" {
  source                        = "../../modules/gke"
  project_id                    = var.project_id
  region                        = var.region
  environment                   = "prod"
  is_regional                   = true
  enable_spot_pool              = false
  network_id                    = module.vpc.network_id
  subnet_id                     = module.vpc.subnet_id
  pods_secondary_range_name     = module.vpc.pods_secondary_range_name
  services_secondary_range_name = module.vpc.services_secondary_range_name
  ondemand_machine_type         = "e2-standard-4"
}

# 3. Artifact Registry for Container Images
module "artifact_registry" {
  source      = "../../modules/artifact-registry"
  project_id  = var.project_id
  region      = var.region
  environment = "prod"
}

# 4. Workload Identity Federation for GitHub Actions
module "wif" {
  source      = "../../modules/wif"
  project_id  = var.project_id
  environment = "prod"
  github_repo = var.github_repo
  create_wif  = var.create_wif
}

# 5. Argo CD GitOps Engine Deployment (Prod: HA Replicas, ClusterIP for Ingress)
module "argocd" {
  source                     = "../../modules/argocd"
  environment                = "prod"
  server_service_type        = "ClusterIP"
  ha_mode                    = true
  enable_slack_notifications = var.enable_slack_notifications
  slack_token                = var.slack_token
  slack_channel              = var.slack_channel

  depends_on = [module.gke]
}

# 6. Reserved Global Static IP for Ingress and DNS (*.devopsstandard.name.ng)
resource "google_compute_global_address" "ingress_ip" {
  name        = "boutique-ingress-ip-prod"
  description = "Static IP for Prod Ingress (*.devopsstandard.name.ng)"
  project     = var.project_id
}

# 7. Robusta OSS Automated Operational Intelligence Engine (Incident Triage & HITL Remediation)
module "robusta" {
  count            = var.enable_robusta ? 1 : 0
  source           = "../../modules/robusta"
  project_id       = var.project_id
  region           = var.region
  environment      = "prod"
  cluster_name     = module.gke.cluster_name
  slack_channel    = var.slack_channel
  slack_api_key    = var.slack_token
  bigquery_dataset = var.bigquery_dataset
  gemini_model     = "gemini-1.5-flash"

  depends_on = [module.gke]
}
