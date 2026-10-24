# 1. OpenTelemetry Telemetry Cold-Storage Archive Bucket
resource "google_storage_bucket" "telemetry_archive" {
  name                        = "omnipulse-telemetry-archive-${var.environment}"
  location                    = var.region
  project                     = var.project_id
  uniform_bucket_level_access = true
  force_destroy               = false

  lifecycle_rule {
    condition {
      age = 30 # Transition to Nearline after 30 days
    }
    action {
      type          = "SetStorageClass"
      storage_class = "NEARLINE"
    }
  }

  lifecycle_rule {
    condition {
      age = 90 # Transition to Coldline after 90 days
    }
    action {
      type          = "SetStorageClass"
      storage_class = "COLDLINE"
    }
  }

  lifecycle_rule {
    condition {
      age = 365 # Transition to Archive after 1 year
    }
    action {
      type          = "SetStorageClass"
      storage_class = "ARCHIVE"
    }
  }
}

# 2. Dedicated GCP Service Account for OpenTelemetry Collector
resource "google_service_account" "otel_collector" {
  account_id   = "otel-collector-sa-${var.environment}"
  display_name = "OpenTelemetry Collector SA (${var.environment})"
  project      = var.project_id
  description  = "Service account for OTel collector to write logs and telemetry to GCS archive"
}

# 3. Grant OTel SA storage objectAdmin on the telemetry archive bucket
resource "google_storage_bucket_iam_member" "otel_storage_admin" {
  bucket = google_storage_bucket.telemetry_archive.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.otel_collector.email}"
}

# 4. Keyless Workload Identity Federation: bind K8s SA to GCP SA
resource "google_service_account_iam_member" "otel_workload_identity" {
  service_account_id = google_service_account.otel_collector.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "serviceAccount:${var.project_id}.svc.id.goog[opentelemetry/otel-collector-sa]"
}
