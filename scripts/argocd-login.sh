#!/usr/bin/env bash
# ==============================================================================
# Argo CD Admin Credentials & Access Helper
# Usage: ./scripts/argocd-login.sh [dev]
# ==============================================================================

set -euo pipefail

ENV_TARGET="${1:-dev}"
CLUSTER_NAME="omnipulse-gke-cluster-${ENV_TARGET}"
ZONE="europe-west1-b"

echo "==> Connecting to GKE Cluster: ${CLUSTER_NAME} in ${ZONE}..."
gcloud container clusters get-credentials "${CLUSTER_NAME}" --zone="${ZONE}" 2>/dev/null || \
gcloud container clusters get-credentials "${CLUSTER_NAME}" --region=europe-west1

echo "==> Fetching initial admin password for Argo CD in namespace 'argocd'..."
PASSWORD=$(kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d)

echo "=========================================================="
echo "Argo CD Admin Username: admin"
echo "Argo CD Admin Password: ${PASSWORD}"
echo "=========================================================="
echo ""
echo "To access Argo CD Web UI locally, run:"
echo "kubectl port-forward svc/argo-cd-argocd-server -n argocd 8080:443"
echo "Then open: https://localhost:8080"
