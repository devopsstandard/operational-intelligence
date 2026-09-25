variable "project_id" {
  type        = string
  description = "The GCP Project ID"
}

variable "region" {
  type        = string
  description = "GCP Region"
  default     = "us-central1"
}

variable "github_repo" {
  type        = string
  description = "GitHub repository authorized for CI/CD WIF (format: owner/repo)"
  default     = ""
}

variable "enable_slack_notifications" {
  type        = bool
  description = "Enable Argo CD Slack notifications controller"
  default     = false
}

variable "slack_token" {
  type        = string
  description = "Slack Bot OAuth token (xoxb-...) for Argo CD Notifications"
  default     = ""
  sensitive   = true
}

variable "slack_channel" {
  type        = string
  description = "Default Slack channel for Argo CD notifications"
  default     = "devops-alerts"
}

variable "create_wif" {
  type        = bool
  description = "Whether Terraform should manage WIF resources (false if pre-created for GitHub Actions bootstrapping)"
  default     = false
}

variable "domain_name" {
  type        = string
  description = "Base domain name for application services"
  default     = "devopsstandard.name.ng"
}

variable "github_pat_token" {
  type        = string
  description = "GitHub Personal Access Token for Argo CD private repository access"
  default     = ""
  sensitive   = true
}

variable "bigquery_dataset" {
  type        = string
  description = "BigQuery dataset name for immutable audit logs (as mandated by SOW)"
  default     = "ops_analytics_prod"
}

variable "enable_robusta" {
  type        = bool
  description = "Enable Robusta OSS incident triage and automated remediation engine"
  default     = true
}


