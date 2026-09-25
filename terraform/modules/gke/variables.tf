variable "project_id" {
  type        = string
  description = "The GCP Project ID"
}

variable "region" {
  type        = string
  description = "GCP Region for GKE Cluster"
}

variable "environment" {
  type        = string
  description = "Environment name (dev, prod)"
}

variable "is_regional" {
  type        = bool
  description = "Whether the cluster is regional (true) or zonal (false)"
  default     = false
}

variable "enable_spot_pool" {
  type        = bool
  description = "Whether to provision the spot node pool"
  default     = true
}

variable "network_id" {
  type        = string
  description = "VPC Network ID"
}

variable "subnet_id" {
  type        = string
  description = "GKE Subnetwork ID"
}

variable "pods_secondary_range_name" {
  type        = string
  description = "Name of secondary IP range for Pods"
}

variable "services_secondary_range_name" {
  type        = string
  description = "Name of secondary IP range for Services"
}

variable "master_ipv4_cidr_block" {
  type        = string
  description = "CIDR block for GKE master control plane"
  default     = "172.16.0.0/28"
}

variable "ondemand_machine_type" {
  type        = string
  description = "Machine type for On-Demand node pool"
  default     = "e2-standard-4"
}

variable "spot_machine_type" {
  type        = string
  description = "Machine type for Spot node pool"
  default     = "e2-standard-4"
}

variable "master_authorized_cidrs" {
  type = list(object({
    cidr_block   = string
    display_name = string
  }))
  description = "CIDR blocks authorized to access GKE control plane API"
  default = [
    {
      cidr_block   = "0.0.0.0/0"
      display_name = "Allow All (Restrict in production)"
    }
  ]
}
