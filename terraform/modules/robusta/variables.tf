variable "project_id" {
  description = "The GCP project ID"
  type        = string
}

variable "region" {
  description = "The GCP region"
  type        = string
  default     = "us-central1"
}

variable "environment" {
  description = "Deployment environment (dev or prod)"
  type        = string
}

variable "cluster_name" {
  description = "Name of the GKE cluster"
  type        = string
}

variable "slack_channel" {
  description = "Slack channel for Robusta notifications & HITL approvals"
  type        = string
  default     = "operational-intelligence"
}

variable "slack_api_key" {
  description = "Slack Bot User OAuth Token for Robusta"
  type        = string
  default     = ""
  sensitive   = true
}

variable "gemini_model" {
  description = "Vertex AI foundation model name for diagnosis"
  type        = string
  default     = "gemini-1.5-flash"
}

variable "bigquery_dataset" {
  description = "BigQuery dataset name for immutable audit logs"
  type        = string
  default     = "ops_analytics_prod"
}

variable "chart_version" {
  description = "Robusta Helm chart version"
  type        = string
  default     = "0.18.0"
}
