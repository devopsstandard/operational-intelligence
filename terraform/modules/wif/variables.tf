variable "project_id" {
  type        = string
  description = "The GCP Project ID"
}

variable "environment" {
  type        = string
  description = "Deployment environment (dev, prod)"
}

variable "github_repo" {
  type        = string
  description = "GitHub repository authorized for WIF (owner/repo)"
  default     = ""
}

variable "create_wif" {
  type        = bool
  description = "Whether to create WIF resources. Set to false if pre-created for GitHub Actions OIDC."
  default     = false
}
