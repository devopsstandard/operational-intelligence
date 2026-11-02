#!/usr/bin/env bash
# ==============================================================================
# Helper script to execute Terraform locally using configuration from .env
# Usage: ./scripts/tf-local.sh [dev|prod] [init|plan|apply|destroy]
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="${ROOT_DIR}/.env"

ENV_TARGET="${1:-dev}"
ACTION="${2:-plan}"

if [ -f "$ENV_FILE" ]; then
  echo "==> Loading environment variables from .env..."
  set -a
  source "$ENV_FILE"
  set +a
else
  echo "WARNING: .env not found. Relying on current shell variables."
fi

if [ -z "${GCP_PROJECT_ID:-}" ] || [ "$GCP_PROJECT_ID" == "your-gcp-project-id" ]; then
  echo "ERROR: GCP_PROJECT_ID is not configured in .env!"
  exit 1
fi

REGION="${GCP_REGION:-europe-west1}"
REPO="${GITHUB_REPO:-}"

TARGET_DIR="${ROOT_DIR}/terraform/environments/${ENV_TARGET}"
echo "==> Executing Terraform ${ACTION} in ${TARGET_DIR} for [${ENV_TARGET}]..."

cd "$TARGET_DIR"

VAR_FLAGS="-var=project_id=${GCP_PROJECT_ID} -var=region=${REGION} -var=github_repo=${REPO}"

case "$ACTION" in
  init)
    terraform init
    ;;
  plan)
    terraform plan $VAR_FLAGS
    ;;
  apply)
    terraform apply $VAR_FLAGS
    ;;
  destroy)
    terraform destroy $VAR_FLAGS
    ;;
  *)
    terraform "$ACTION"
    ;;
esac
