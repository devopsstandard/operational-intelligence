variable "environment" {
  type        = string
  description = "Target environment (dev, prod)"
}

variable "chart_version" {
  type        = string
  description = "Helm chart version for Argo CD"
  default     = "7.7.16"
}

variable "server_service_type" {
  type        = string
  description = "Kubernetes Service type for Argo CD server (LoadBalancer, ClusterIP, NodePort)"
  default     = "LoadBalancer"
}

variable "ha_mode" {
  type        = bool
  description = "Enable High Availability mode for Argo CD components (prod)"
  default     = false
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
  description = "Default Slack channel for Argo CD notifications (e.g. devops-alerts)"
  default     = "devops-alerts"
}

variable "github_repo_url" {
  type        = string
  description = "Git repository URL for Argo CD"
  default     = "https://github.com/devopsstandard/operational-intelligence.git"
}

variable "github_pat_token" {
  type        = string
  description = "GitHub Personal Access Token for private repository access in Argo CD"
  default     = ""
  sensitive   = true
}
