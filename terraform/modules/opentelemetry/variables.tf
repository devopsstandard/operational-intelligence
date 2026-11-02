variable "project_id" {
  type        = string
  description = "The GCP Project ID"
}

variable "region" {
  type        = string
  description = "GCP Region for OTel storage bucket"
  default     = "europe-west1"
}

variable "environment" {
  type        = string
  description = "Deployment environment (dev, prod)"
}
