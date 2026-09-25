#!/usr/bin/env bash
# ==============================================================================
# Argo CD Deployment - Local Tooling Verification Script
# ==============================================================================

set -euo pipefail

log_info() { echo -e "\033[0;32m[OK]\033[0m $1"; }
log_warn() { echo -e "\033[0;33m[WARN]\033[0m $1"; }
log_err()  { echo -e "\033[0;31m[FAIL]\033[0m $1"; }

REQUIRED_TOOLS=("gcloud" "kubectl" "terraform" "docker" "kustomize")
OPTIONAL_TOOLS=("argocd")

echo "==> Verifying local engineering dependencies for Argo CD Deployment..."

for tool in "${REQUIRED_TOOLS[@]}"; do
  if command -v "$tool" &> /dev/null; then
    VERSION=$("$tool" version 2>&1 | head -n 1 || "$tool" --version 2>&1 | head -n 1)
    log_info "$tool is installed ($VERSION)"
  else
    log_err "$tool is missing"
  fi
done

for tool in "${OPTIONAL_TOOLS[@]}"; do
  if command -v "$tool" &> /dev/null; then
    log_info "$tool CLI is installed"
  else
    log_warn "$tool CLI is not installed (optional, web UI or kubectl can be used)"
  fi
done
