variable "project_id" {
  type        = string
  description = "The GCP Project ID"
}

variable "region" {
  type        = string
  description = "Region for Artifact Registry repository"
}

variable "environment" {
  type        = string
  description = "Environment name (dev, prod)"
}
