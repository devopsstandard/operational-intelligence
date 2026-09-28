# Operational Intelligence Platform Modernization & Stabilization

This repository contains the production-grade GitOps, Infrastructure-as-Code (Terraform), and Automated Incident Response architecture designed to modernize and stabilize the Google Kubernetes Engine (GKE) platform in accordance with the **Operational Intelligence Platform SOW**.

---

## 1. System Architecture Overview

```
                                  +---------------------------------------+
                                  |         Developer / On-Call           |
                                  +-------------------+-------------------+
                                                      | git push / PR
                                                      v
+---------------------------------------------------------------------------------------------------------+
| GitHub Actions Supply Chain CI/CD (Keyless via GCP Workload Identity Federation OIDC)                   |
| - Secret Scanning (Gitleaks)                                                                            |
| - Container Linting (Hadolint) & SAST (SonarCloud)                                                      |
| - Image Build (Docker Buildx) -> Vulnerability Gate (Trivy) -> Attestation Signing (Cosign KMS)        |
+-----------------------------------------------------+---------------------------------------------------+
                                                      | Pushes signed images
                                                      v
                                      +-------------------------------+
                                      | Artifact Registry             |
                                      | (boutique-containers-prod)    |
                                      +---------------+---------------+
                                                      |
       +----------------------------------------------+---------------------------------------+
       |                                                                                      |
       v                                                                                      v
+---------------------------------------------+     +-------------------------------------------------+
| Terraform Modular IaC Engine                |     | GKE Cluster (gke-us-central1-prod-01)           |
| - VPC & Secondary CIDRs (10.16.0.0/14)      |     | - e2-standard-4 On-Demand Pool (Core & Ingress) |
| - GKE Dual Node Pools (On-Demand & Spot)    |     | - e2-standard-4 Spot Pool (Microservice Pods)   |
| - WIF Keyless GitHub OIDC Provider          |     +------------------------+------------------------+
| - BigQuery Dataset: ops_analytics_prod      |                              |
+---------------------------------------------+                              v
                                      +---------------------------------------------------------------+
                                      | Argo CD GitOps Continuous Delivery (0% Drift Engine)          |
                                      | - Automated Sync & Self-Healing: { prune: true, selfHeal: true}
                                      | - Single Source of Truth: /kubernetes-manifests & overlays    |
                                      +-------------------------------+-------------------------------+
                                                                      |
                                                                      v
                                      +---------------------------------------------------------------+
                                      | Robusta OSS (MIT License) Automated Triage & Remediation      |
                                      | - Vertex AI Gemini 1.5 Flash Contextual Diagnosis             |
                                      | - Top 3 SOW Playbooks (Stalled Consumer, DLQ, 429 Quota)      |
                                      | - Human-in-the-Loop (HITL) Interactive Slack Buttons          |
                                      | - Immutable BigQuery Audit Sink (operational_remediation_audit)
                                      +---------------------------------------------------------------+
```

---

## 2. Directory Layout

```
Operational Intelligence/
├── .github/
│   └── workflows/
│       ├── pr-checks.yaml          # Gitleaks, Hadolint, Terraform fmt, Kustomize, SonarCloud
│       ├── build-and-sign.yaml     # Docker Buildx, Trivy scan, Cosign KMS cryptographic signing
│       ├── terraform-infra.yaml    # Infrastructure pipeline (WIF, Terraform apply, GitOps bootstrap)
│       └── build-and-gitops.yaml   # Kustomize validation & rollout notification
├── gitops/
│   └── argocd-apps/
│       ├── app-of-apps.yaml        # Root App-of-Apps controller manifest
│       ├── dev-application.yaml    # Target: k8s/overlays/dev (omnipulse-dev namespace)
│       ├── prod-application.yaml   # Target: k8s/overlays/prod (omnipulse-prod namespace)
│       └── robusta-application.yaml# Target: Robusta OSS in namespace robusta
├── k8s/
│   ├── base/                       # 12 polyglot microservice deployments & services
│   ├── headlamp/                   # Headlamp cluster administration dashboard
│   ├── argocd-ingress/             # GCE Ingress & ManagedCertificate for Argo CD UI
│   ├── overlays/                   # Environment overlays (dev, prod)
│   └── robusta/                    # Production Robusta OSS Helm values & local playbook mirror
│       ├── values.yaml
│       └── playbooks/
├── src/
│   ├── emailservice/               # Streaming consumer worker proxy (consumer-triage)
│   ├── paymentservice/             # Batch summarizer pipeline proxy
│   ├── robusta-playbooks/          # Custom Robusta OSS incident response engine
│   │   ├── __init__.py
│   │   ├── gemini_enrichment.py    # Vertex AI Gemini 1.5 Flash structured diagnosis & fallback
│   │   ├── stalled_consumer_playbook.py # Playbook 1: Stalled / Deadlocked consumer restart
│   │   ├── dlq_poison_pill_playbook.py  # Playbook 2: Pub/Sub DLQ backpressure & quarantine
│   │   ├── vertex_quota_backoff_playbook.py # Playbook 3: 429 quota backoff & dynamic throttling
│   │   ├── bigquery_audit_sink.py  # Immutable BigQuery audit logger
│   │   └── requirements.txt
│   └── (remaining microservices)   # Full polyglot application suite
├── terraform/
│   ├── environments/
│   │   ├── dev/                    # Dev environment configuration
│   │   └── prod/                   # Prod environment configuration (Regional HA, Multi-replica)
│   └── modules/
│       ├── vpc/                    # VPC, secondary subnets, Cloud Router, Cloud NAT
│       ├── gke/                    # GKE cluster, On-Demand and Spot node pools
│       ├── artifact-registry/      # Docker image repository
│       ├── wif/                    # Workload Identity Federation (keyless OIDC)
│       ├── argocd/                 # Helm release for Argo CD & repository secret
│       └── robusta/                # Helm release for Robusta OSS, IAM Workload Identity & BigQuery
├── docs/                           # Architecture diagrams and design specifications
├── scripts/                        # Operational scripts and deployment helpers
└── SOW_Operational_Intelligence_Platform.docx # Contractual Statement of Work
```

---

## 3. SOW Requirements Traceability

| SOW Requirement | Implementation in this Repository | Target KPI |
| :--- | :--- | :--- |
| **Pager Fatigue & Off-Hours Alerts** | Robusta OSS with Gemini 1.5 Flash auto-triage + transient backoff rules. | $\le$ 1 page/week (down from ~4/week) |
| **GitOps Drift Crisis (40% Drift)** | Argo CD with `syncPolicy: { prune: true, selfHeal: true }`. | 0% drift; all mutations via Git PR |
| **Supply-Chain Security** | Trivy CVE gates (`CRITICAL/HIGH`) + Cosign Cloud KMS signing + Binary Auth. | 100% of prod images signed & scanned |
| **Mean Time to Remediation (MTTR)** | Automated playbooks for Stalled Consumer, DLQ Overflow, and 429 Quotas. | < 5 minutes (down from 45 min manual) |
| **Blast Radius Isolation** | Dedicated GCP ServiceAccount bound via Workload Identity with minimal scoped IAM. | Zero cluster-admin credentials on runner |
| **Human-In-The-Loop (HITL)** | Interactive Slack buttons for high-impact actions with deterministic callbacks. | Explicit engineer sign-off for mutations |
| **Immutable Audit Trail** | BigQuery dataset `ops_analytics_prod.operational_remediation_audit` table. | 100% of diagnoses and actions recorded |
| **Budget Cap ($\le$ $1,400/month)** | In-cluster Robusta OSS (MIT, $0 license) + Gemini 1.5 Flash tokens (~$15/mo). | Total incremental cost: ~$390/month |

---

## 4. Quick Start / Operations Commands

### Run Terraform Locally
```bash
cd terraform/environments/dev
terraform init -backend-config="bucket=<YOUR_GCP_PROJECT>-tfstate"
terraform plan -var="project_id=<YOUR_GCP_PROJECT>" -var="github_repo=<OWNER/REPO>"
```

### Validate Kubernetes Overlays
```bash
kubectl kustomize k8s/overlays/dev
kubectl kustomize k8s/overlays/prod
```

### Query Immutable BigQuery Remediation Audit Log
```sql
SELECT 
    timestamp, 
    incident_id, 
    failure_mode, 
    target_workload, 
    action_executed, 
    execution_type, 
    operator, 
    status 
FROM `ops_analytics_prod.operational_remediation_audit`
ORDER BY timestamp DESC
LIMIT 50;
```
