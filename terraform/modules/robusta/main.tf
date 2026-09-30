terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 5.0"
    }
    helm = {
      source  = "hashicorp/helm"
      version = ">= 2.12.0, < 3.0.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = ">= 2.26.0"
    }
  }
}

# 1. Dedicated Google Cloud Service Account for Robusta Runner
resource "google_service_account" "robusta_runner" {
  account_id   = "robusta-runner-${var.environment}"
  display_name = "Robusta OSS In-Cluster Runner (${var.environment})"
  project      = var.project_id
  description  = "Service account for Robusta OSS diagnosis and automated remediation playbooks"
}

# 2. Grant Least-Privilege IAM Roles to Robusta SA (Blast Radius Isolation)
# Vertex AI access for Gemini 1.5 Flash diagnosis
resource "google_project_iam_member" "vertex_ai_user" {
  project = var.project_id
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:${google_service_account.robusta_runner.email}"
}

# BigQuery Data Editor for immutable audit logs
resource "google_project_iam_member" "bigquery_editor" {
  project = var.project_id
  role    = "roles/bigquery.dataEditor"
  member  = "serviceAccount:${google_service_account.robusta_runner.email}"
}

# Cloud Logging Writer
resource "google_project_iam_member" "logging_writer" {
  project = var.project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.robusta_runner.email}"
}

# 3. Workload Identity Federation (bind K8s SA to GCP SA)
resource "google_service_account_iam_member" "workload_identity_user" {
  service_account_id = google_service_account.robusta_runner.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "serviceAccount:${var.project_id}.svc.id.goog[robusta/robusta-runner-service-account]"
}

# 4. BigQuery Immutable Audit Log Dataset & Table for Operational Remediation
resource "google_bigquery_dataset" "audit_dataset" {
  dataset_id                 = var.bigquery_dataset
  friendly_name              = "Operational Remediation Audit Dataset (${var.environment})"
  description                = "Immutable audit logs for automated diagnosis, prompt interaction, and execution events as mandated by SOW Section 2"
  location                   = var.region
  project                    = var.project_id
  delete_contents_on_destroy = false
}

resource "google_bigquery_table" "remediation_audit" {
  dataset_id          = google_bigquery_dataset.audit_dataset.dataset_id
  table_id            = "operational_remediation_audit"
  project             = var.project_id
  deletion_protection = false

  depends_on = [google_bigquery_dataset.audit_dataset]

  time_partitioning {
    type  = "DAY"
    field = "timestamp"
  }

  clustering = ["failure_mode", "status", "target_workload"]

  schema = jsonencode([
    {
      name        = "timestamp",
      type        = "TIMESTAMP",
      mode        = "REQUIRED",
      description = "Event occurrence timestamp"
    },
    {
      name        = "incident_id",
      type        = "STRING",
      mode        = "REQUIRED",
      description = "Unique identifier for the incident / alert"
    },
    {
      name        = "failure_mode",
      type        = "STRING",
      mode        = "REQUIRED",
      description = "Classified failure mode (e.g., STALLED_CONSUMER, DLQ_POISON_PILL, QUOTA_EXHAUSTED)"
    },
    {
      name        = "target_workload",
      type        = "STRING",
      mode        = "REQUIRED",
      description = "Target deployment / pod name"
    },
    {
      name        = "diagnosis_summary",
      type        = "STRING",
      mode        = "NULLABLE",
      description = "Gemini 1.5 Flash root-cause analysis summary"
    },
    {
      name        = "action_executed",
      type        = "STRING",
      mode        = "REQUIRED",
      description = "Remediation action taken or proposed (e.g., RESTART, QUARANTINE, THROTTLE, ESCALATE)"
    },
    {
      name        = "execution_type",
      type        = "STRING",
      mode        = "REQUIRED",
      description = "AUTOMATED or HUMAN_IN_THE_LOOP"
    },
    {
      name        = "operator",
      type        = "STRING",
      mode        = "NULLABLE",
      description = "Operator identity if approved via HITL Slack button"
    },
    {
      name        = "status",
      type        = "STRING",
      mode        = "REQUIRED",
      description = "SUCCESS, FAILED, or ESCALATED"
    },
    {
      name        = "raw_telemetry",
      type        = "STRING",
      mode        = "NULLABLE",
      description = "JSON dump of relevant pod logs and metrics"
    }
  ])
}

# 5. Robusta OSS Helm Release
resource "helm_release" "robusta" {
  name             = "robusta"
  repository       = "https://robusta-charts.storage.googleapis.com"
  chart            = "robusta"
  version          = var.chart_version
  namespace        = "robusta"
  create_namespace = true
  cleanup_on_fail  = true

  set {
    name  = "clusterName"
    value = var.cluster_name
  }

  set {
    name  = "isSmallCluster"
    value = "true"
  }

  set {
    name  = "runner.serviceAccount.name"
    value = "robusta-runner-service-account"
  }

  set {
    name  = "runner.serviceAccount.annotations.iam\\.gke\\.io/gcp-service-account"
    value = google_service_account.robusta_runner.email
  }

  set {
    name  = "runner.resources.requests.cpu"
    value = "250m"
  }

  set {
    name  = "runner.resources.requests.memory"
    value = "512Mi"
  }

  set {
    name  = "runner.resources.limits.cpu"
    value = "1000m"
  }

  set {
    name  = "runner.resources.limits.memory"
    value = "1024Mi"
  }

  dynamic "set" {
    for_each = var.slack_api_key != "" ? [1] : []
    content {
      name  = "globalConfig.slack_api_key"
      value = var.slack_api_key
    }
  }

  values = [
    yamlencode({
      globalConfig = {
        cluster_name  = var.cluster_name
        signing_key   = "robusta-oss-internal"
        account_id    = "operational-intelligence"
        gcp_project   = var.project_id
        gemini_model     = var.gemini_model
        bq_dataset       = var.bigquery_dataset
        slack_channel    = var.slack_channel
        prometheus_url   = "http://prometheus-operated.monitoring.svc.cluster.local:9090"
        alertmanager_url = "http://alertmanager-operated.monitoring.svc.cluster.local:9093"
      }
      sinksConfig = var.slack_api_key != "" ? [
        {
          slack_sink = {
            name           = "slack_triage"
            slack_channel  = var.slack_channel
            api_key        = var.slack_api_key
            notify_on_eval = true
          }
        }
      ] : []
      customPlaybooks = [
        {
          triggers = [
            {
              on_pod_crash_loop = {
                namespace_prefix = "omnipulse-"
                rate_limit       = 300
              }
            }
          ]
          actions = [
            {
              restart_loop_reporter = {}
            },
            {
              rollout_restart = {}
            }
          ]
        }
      ]
    })
  ]

  depends_on = [
    google_service_account_iam_member.workload_identity_user,
    google_bigquery_table.remediation_audit
  ]
}
