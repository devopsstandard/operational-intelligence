terraform {
  required_providers {
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

resource "helm_release" "argocd" {
  name             = "argo-cd"
  repository       = "https://argoproj.github.io/argo-helm"
  chart            = "argo-cd"
  version          = var.chart_version
  namespace        = "argocd"
  create_namespace = true
  cleanup_on_fail  = true
  timeout          = 900

  set {
    name  = "server.service.type"
    value = var.server_service_type
  }

  set {
    name  = "server.extraArgs[0]"
    value = "--insecure"
  }

  set {
    name  = "server.replicas"
    value = var.ha_mode ? "2" : "1"
  }

  set {
    name  = "repoServer.replicas"
    value = var.ha_mode ? "2" : "1"
  }

  set {
    name  = "controller.replicas"
    value = "1"
  }

  set {
    name  = "redis-ha.enabled"
    value = var.ha_mode ? "true" : "false"
  }

  # Allow syncing CRDs and namespaces across the cluster
  set {
    name  = "server.clusterAdminAccess.enabled"
    value = "true"
  }

  set {
    name  = "notifications.enabled"
    value = var.enable_slack_notifications ? "true" : "false"
  }

  values = var.enable_slack_notifications && var.slack_token != "" ? [
    yamlencode({
      notifications = {
        secret = {
          create = true
          items = {
            slack-token = var.slack_token
          }
        }
        notifiers = {
          "service.slack" = <<-EOT
            token: $slack-token
          EOT
        }
        subscriptions = [
          {
            recipients = ["slack:${var.slack_channel}"]
            triggers = [
              "on-sync-running",
              "on-sync-succeeded",
              "on-sync-failed",
              "on-health-degraded"
            ]
          }
        ]
      }
    })
  ] : []
}

resource "kubernetes_secret_v1" "repo_credentials" {
  count = var.github_pat_token != "" ? 1 : 0

  metadata {
    name      = "repo-operational-intelligence"
    namespace = "argocd"
    labels = {
      "argocd.argoproj.io/secret-type" = "repository"
    }
  }

  type = "Opaque"

  data = {
    type     = "git"
    url      = var.github_repo_url
    username = "git"
    password = var.github_pat_token
  }

  depends_on = [helm_release.argocd]
}
