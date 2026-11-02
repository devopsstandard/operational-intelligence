# Workload Identity Pool for GitHub Actions (Optional if pre-created for bootstrapping)
resource "google_iam_workload_identity_pool" "github_pool" {
  count                     = var.create_wif ? 1 : 0
  workload_identity_pool_id = "github-actions-pool-${var.environment}"
  display_name              = "GitHub Actions WIF Pool (${var.environment})"
  description               = "Identity Pool for keyless GitHub Actions OIDC authentication"
  project                   = var.project_id
}

# OIDC Identity Provider for GitHub Actions
resource "google_iam_workload_identity_pool_provider" "github_provider" {
  count                              = var.create_wif ? 1 : 0
  workload_identity_pool_id          = google_iam_workload_identity_pool.github_pool[0].workload_identity_pool_id
  workload_identity_pool_provider_id = "github-actions-provider"
  display_name                       = "GitHub Actions OIDC Provider"
  project                            = var.project_id

  attribute_mapping = {
    "google.subject"       = "assertion.sub"
    "attribute.actor"      = "assertion.actor"
    "attribute.repository" = "assertion.repository"
  }

  attribute_condition = var.github_repo != "" ? "assertion.repository == '${var.github_repo}'" : null

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }
}

# Dedicated Service Account for CI/CD Deployment
resource "google_service_account" "cicd_sa" {
  count        = var.create_wif ? 1 : 0
  account_id   = "omnipulse-cicd-sa-${var.environment}"
  display_name = "GitHub Actions CI/CD SA (${var.environment})"
  project      = var.project_id
}

# Bind WIF to the Service Account
resource "google_service_account_iam_member" "wif_binding" {
  count              = var.create_wif ? 1 : 0
  service_account_id = google_service_account.cicd_sa[0].name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github_pool[0].name}/attribute.repository/${var.github_repo}"
}

# CI/CD SA Roles (GKE Developer, Artifact Registry Writer)
resource "google_project_iam_member" "cicd_gke_dev" {
  count   = var.create_wif ? 1 : 0
  project = var.project_id
  role    = "roles/container.developer"
  member  = "serviceAccount:${google_service_account.cicd_sa[0].email}"
}

resource "google_project_iam_member" "cicd_ar_writer" {
  count   = var.create_wif ? 1 : 0
  project = var.project_id
  role    = "roles/artifactregistry.writer"
  member  = "serviceAccount:${google_service_account.cicd_sa[0].email}"
}
