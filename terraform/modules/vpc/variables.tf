variable "project_id" {
  type        = string
  description = "The GCP Project ID"
}

variable "region" {
  type        = string
  description = "GCP Region for VPC resources"
}

variable "environment" {
  type        = string
  description = "Deployment environment (dev, prod)"
}

variable "subnet_cidr" {
  type        = string
  description = "Primary CIDR block for GKE nodes subnet"
  default     = "10.0.0.0/20"
}

variable "pods_cidr" {
  type        = string
  description = "Secondary CIDR block for GKE Pods"
  default     = "10.16.0.0/14"
}

variable "services_cidr" {
  type        = string
  description = "Secondary CIDR block for GKE Services"
  default     = "10.20.0.0/20"
}
