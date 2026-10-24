output "bucket_name" {
  description = "Name of the telemetry archive GCS bucket"
  value       = google_storage_bucket.telemetry_archive.name
}

output "bucket_url" {
  description = "URL of the telemetry archive GCS bucket"
  value       = google_storage_bucket.telemetry_archive.url
}

output "service_account_email" {
  description = "Email of the OTel Collector GCP Service Account"
  value       = google_service_account.otel_collector.email
}
