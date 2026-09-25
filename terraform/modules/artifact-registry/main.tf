resource "google_artifact_registry_repository" "repo" {
  location        = var.region
  repository_id   = "boutique-containers-${var.environment}"
  description     = "Docker container repository for Online Boutique microservices (${var.environment})"
  format          = "DOCKER"
  project         = var.project_id
  deletion_policy = var.environment == "prod" ? "KEEP" : "DELETE"

  cleanup_policies {
    id     = "keep-minimum-versions"
    action = "KEEP"
    most_recent_versions {
      keep_count = 10
    }
  }

  cleanup_policies {
    id     = "delete-untagged"
    action = "DELETE"
    condition {
      tag_state = "UNTAGGED"
    }
  }
}
