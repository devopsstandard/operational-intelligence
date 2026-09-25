output "robusta_service_account" {
  description = "GCP Service Account created for Robusta Runner"
  value       = google_service_account.robusta_runner.email
}

output "robusta_k8s_service_account" {
  description = "Kubernetes Service Account name for Robusta"
  value       = "robusta-runner-service-account"
}

output "audit_table_id" {
  description = "BigQuery Table ID for immutable operational audit trail"
  value       = google_bigquery_table.remediation_audit.id
}
