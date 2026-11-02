variable "project_id" {
  type        = string
  description = "The GCP Project ID"
}

variable "region" {
  type        = string
  description = "GCP Region for GKE Cluster"
  default     = "europe-west1"
}

variable "cluster_location" {
  type        = string
  description = "Cluster location (zone or region, e.g. europe-west1-b)"
  default     = "europe-west1-b"
}

variable "environment" {
  type        = string
  description = "Environment name (dev)"
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

variable "enable_master_authorized_networks" {
  type        = bool
  description = "Whether to restrict GKE master control plane to specific authorized CIDRs"
  default     = false
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

variable "node_count" {
  type        = number
  description = "Number of worker nodes for the node pool"
  default     = 3
}

variable "node_locations" {
  type        = list(string)
  description = "Specific zones for the node pool (null for zonal cluster)"
  default     = null
}

variable "machine_type" {
  type        = string
  description = "Machine type for the standard GKE nodes"
  default     = "e2-standard-4"
}

variable "disk_size_gb" {
  type        = number
  description = "Disk size per node in GB"
  default     = 50
}
