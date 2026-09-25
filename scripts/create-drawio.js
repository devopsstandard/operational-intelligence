const fs = require('fs');
const path = require('path');

// Helper to create pure base64 SVG data URI for draw.io (100% valid XML attribute)
function toBase64Uri(svgContent) {
  const clean = svgContent.replace(/[\r\n\t]/g, ' ').replace(/\s+/g, ' ').trim();
  return 'data:image/svg+xml;base64,' + Buffer.from(clean).toString('base64');
}

// 1. Clean Vector SVGs for all platform logos
const svgSoftwareDev = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect x="10" y="12" width="44" height="28" rx="3" fill="#0F172A"/><rect x="14" y="16" width="36" height="20" fill="#2563EB"/><path d="M22 23l-4 3 4 3m8-6l4 3-4 3m-3-7l-2 8" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" fill="none"/><path d="M4 44h56l-4 6H8z" fill="#94A3B8"/></svg>`;
const svgDevOps = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect x="10" y="12" width="44" height="28" rx="3" fill="#0F172A"/><rect x="14" y="16" width="36" height="20" fill="#059669"/><circle cx="27" cy="26" r="3" stroke="#FFF" stroke-width="1.5" fill="none"/><circle cx="37" cy="26" r="3" stroke="#FFF" stroke-width="1.5" fill="none"/><path d="M27 23a7 7 0 0 1 10 0M37 29a7 7 0 0 1-10 0" stroke="#FFF" stroke-width="1.5" fill="none"/><path d="M4 44h56l-4 6H8z" fill="#94A3B8"/></svg>`;

const svgGitHub = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 98 96"><circle cx="49" cy="48" r="48" fill="#181717"/><path fill-rule="evenodd" clip-rule="evenodd" d="M48.854 10C27.242 10 9.771 27.6 9.771 49.374c0 17.405 11.194 32.138 26.724 37.352 1.942.392 2.653-.847 2.653-1.872 0-.946-.034-4.109-.034-7.426-10.792 2.349-13.088-4.666-13.088-4.666-1.784-4.506-4.368-5.712-4.368-5.712-3.557-2.445.276-2.392.276-2.392 3.926.276 6.008 4.036 6.008 4.036 3.483 5.966 9.127 4.238 11.349 3.242.345-2.524 1.352-4.238 2.462-5.218-8.608-.98-17.664-4.31-17.664-19.267 0-4.262 1.516-7.747 4.002-10.467-.414-.986-1.739-4.966.379-10.332 0 0 3.286-1.05 10.754 4.01 3.121-.868 6.466-1.302 9.792-1.315 3.325.013 6.671.447 9.792 1.315 7.469-5.06 10.755-4.01 10.755-4.01 2.118 5.366.793 9.346.379 10.332 2.486 2.72 4.002 6.205 4.002 10.467 0 14.992-9.09 18.274-17.733 19.233 1.398 1.215 2.666 3.621 2.666 7.304 0 5.28-.034 9.526-.034 10.838 0 1.034.711 2.28 2.683 1.872C77.035 81.512 88.229 66.779 88.229 49.374 88.229 27.6 70.466 10 48.854 10z" fill="#FFFFFF"/></svg>`;

const svgGitHubActions = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#2088FF"/><circle cx="22" cy="24" r="5" fill="#FFFFFF"/><circle cx="42" cy="24" r="5" fill="#FFFFFF"/><circle cx="32" cy="44" r="5" fill="#FFFFFF"/><path d="M22 24h20M22 24v6a10 10 0 0 0 10 10M42 24v6a10 10 0 0 1-10 10" stroke="#FFFFFF" stroke-width="3.5" fill="none"/><path d="M21 24l2 2 4-4" stroke="#2088FF" stroke-width="1.5" fill="none"/></svg>`;

const svgSonarCloud = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="30" fill="#F3702A"/><path d="M18 36c2-8 10-12 18-10 4 1 8 4 10 8" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" fill="none"/><path d="M24 42c3-4 8-6 13-4 2 1 4 3 5 5" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" fill="none"/><circle cx="32" cy="32" r="3" fill="#FFFFFF"/></svg>`;

const svgGitleaks = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#0284C7"/><path d="M32 14c-7 0-14 4-16 11 4 1 8 1 12-1 4 7 11 11 20 9 2-7 1-13-4-17-4-1-8-2-12-2z" fill="#FFFFFF"/><circle cx="28" cy="26" r="2.5" fill="#0284C7"/><circle cx="40" cy="26" r="2.5" fill="#0284C7"/><path d="M24 38c4 4 12 4 16 0" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" fill="none"/></svg>`;

const svgHadolint = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#475569"/><path d="M20 18h16l10 10v20a2 2 0 0 1-2 2H20a2 2 0 0 1-2-2V20a2 2 0 0 1 2-2z" fill="#FFFFFF"/><path d="M36 18v10h10" fill="#CBD5E1"/><path d="M26 34l3 3 8-8" stroke="#059669" stroke-width="2.5" stroke-linecap="round" fill="none"/></svg>`;

const svgTrivy = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#1E293B"/><path d="M32 14l16 8v14c0 10-8 16-16 18-8-2-16-8-16-18V22z" fill="#38BDF8"/><path d="M32 20v24M24 28l16 8M40 28l-16 8" stroke="#0F172A" stroke-width="2" fill="none"/></svg>`;

const svgArtifactRegistry = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="M32 8l18 10v20L32 48 14 38V18z" fill="#4285F4"/><path d="M32 8v20l18 10M32 28L14 18" stroke="#FFFFFF" stroke-width="2.5" fill="none"/><path d="M23 23l9 5 9-5M32 38v10" stroke="#FFFFFF" stroke-width="2" fill="none"/></svg>`;

const svgArgoCD = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/><ellipse cx="32" cy="30" rx="14" ry="16" fill="#EF4444"/><circle cx="27" cy="27" r="3" fill="#FFFFFF"/><circle cx="37" cy="27" r="3" fill="#FFFFFF"/><circle cx="27" cy="27" r="1.5" fill="#000000"/><circle cx="37" cy="27" r="1.5" fill="#000000"/><path d="M26 35c3 3 9 3 12 0" stroke="#FFFFFF" stroke-width="2" fill="none"/><path d="M22 42c-2 6-6 8-8 6s1-6 4-8m8 2c-1 6-3 9-5 9s-1-5 2-9m10 0c1 6 3 9 5 9s1-5-2-9m4-2c2 6 6 8 8 6s-1-6-4-8" stroke="#EF4444" stroke-width="2.5" stroke-linecap="round" fill="none"/><path d="M16 28c-3 0-5-2-5-5s2-5 5-5m32 10c3 0 5-2 5-5s-2-5-5-5" stroke="#94A3B8" stroke-width="3" fill="none"/></svg>`;

const svgGCP = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="M41 42h7a8 8 0 0 0 2-15 13 13 0 0 0-25-3 10 10 0 0 0-9 10 8 8 0 0 0 8 8h17" fill="#4285F4"/><path d="M48 38a6 6 0 0 0 0-12 11 11 0 0 0-20-4" stroke="#EA4335" stroke-width="3" fill="none"/><path d="M28 22a10 10 0 0 0-8 10 6 6 0 0 0 6 6h15" stroke="#FBBC05" stroke-width="3" fill="none"/><path d="M41 38h7a6 6 0 0 0 0-12" stroke="#34A853" stroke-width="3" fill="none"/></svg>`;

const svgGKE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><polygon points="32,6 56,20 56,44 32,58 8,44 8,20" fill="#326CE5"/><circle cx="32" cy="32" r="14" fill="#FFFFFF"/><polygon points="32,22 40,27 40,37 32,42 24,37 24,27" fill="#326CE5"/><circle cx="32" cy="32" r="4" fill="#FFFFFF"/></svg>`;

const svgPod = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><polygon points="32,8 52,20 52,44 32,56 12,44 12,20" fill="#326CE5"/><text x="32" y="36" fill="#FFF" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="middle">pod</text></svg>`;

const svgHeadlamp = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="#0284C7"/><polygon points="32,12 36,24 48,24 38,32 42,44 32,36 22,44 26,32 16,24 28,24" fill="#FFFFFF"/><circle cx="32" cy="32" r="6" fill="#0284C7"/></svg>`;

const svgGCLB = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#0284C7"/><path d="M32 12v12m-16 12v16m32-16v16M16 24h32" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round"/><rect x="26" y="8" width="12" height="10" rx="2" fill="#FFFFFF"/><rect x="10" y="46" width="12" height="10" rx="2" fill="#FFFFFF"/><rect x="42" y="46" width="12" height="10" rx="2" fill="#FFFFFF"/></svg>`;

const svgSSLCert = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#F59E0B"/><rect x="14" y="14" width="36" height="26" rx="3" fill="#FFFFFF"/><circle cx="32" cy="40" r="8" fill="#D97706"/><path d="M29 46l-3 8 6-3 6 3-3-8" fill="#B45309"/><path d="M22 22h20M22 28h12" stroke="#D97706" stroke-width="2" stroke-linecap="round"/></svg>`;

const svgPublicUsers = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#16A34A"/><circle cx="26" cy="24" r="7" fill="#FFFFFF"/><path d="M14 42c0-6 6-9 12-9s12 3 12 9" fill="#FFFFFF"/><circle cx="42" cy="22" r="5" fill="#BBF7D0"/><path d="M34 38c1-4 4-6 8-6s8 2 8 6" fill="#BBF7D0"/></svg>`;

const svgAdminPC = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#0284C7"/><rect x="12" y="14" width="40" height="26" rx="2" fill="#0F172A"/><rect x="16" y="18" width="32" height="18" fill="#38BDF8"/><path d="M22 24l-3 3 3 3m10-6l3 3-3 3m-4-6l-2 6" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" fill="none"/><path d="M8 44h48l-4 6H12z" fill="#CBD5E1"/><path d="M28 44h8v2h-8z" fill="#94A3B8"/></svg>`;

// Convert to Base64 URIs
const b64SoftDev = toBase64Uri(svgSoftwareDev);
const b64DevOps = toBase64Uri(svgDevOps);
const b64GitHub = toBase64Uri(svgGitHub);
const b64GHActions = toBase64Uri(svgGitHubActions);
const b64Sonar = toBase64Uri(svgSonarCloud);
const b64Gitleaks = toBase64Uri(svgGitleaks);
const b64Hadolint = toBase64Uri(svgHadolint);
const b64Trivy = toBase64Uri(svgTrivy);
const b64ArtifactReg = toBase64Uri(svgArtifactRegistry);
const b64ArgoCD = toBase64Uri(svgArgoCD);
const b64GCP = toBase64Uri(svgGCP);
const b64GKE = toBase64Uri(svgGKE);
const b64Pod = toBase64Uri(svgPod);
const b64Headlamp = toBase64Uri(svgHeadlamp);
const b64GCLB = toBase64Uri(svgGCLB);
const b64SSLCert = toBase64Uri(svgSSLCert);
const b64PublicUsers = toBase64Uri(svgPublicUsers);
const b64AdminPC = toBase64Uri(svgAdminPC);

// Generate Valid Draw.io XML
const xml = `<mxfile host="app.diagrams.net" modified="2026-09-12T14:45:00.000Z" agent="5.0" version="22.1.16" type="device">
  <diagram id="gitops-gke-architecture" name="GitOps Architecture Flow">
    <mxGraphModel dx="1800" dy="1100" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="2000" pageHeight="1100" background="#FFFFFF" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />

        <!-- ==================== LEFT: DEVELOPERS ==================== -->
        <!-- Software Developer -->
        <mxCell id="node_soft_dev" value="&lt;b style=&quot;font-size:13px;&quot;&gt;Software Developer&lt;/b&gt;&lt;br&gt;&lt;font color=&quot;#64748B&quot; style=&quot;font-size:11px;&quot;&gt;Feature Branches &amp;amp; PRs&lt;/font&gt;" style="shape=image;html=1;verticalAlign=top;verticalLabelPosition=bottom;labelBackgroundColor=none;imageAspect=1;aspect=fixed;image=${b64SoftDev};" vertex="1" parent="1">
          <mxGeometry x="60" y="180" width="70" height="70" as="geometry" />
        </mxCell>

        <!-- DevOps -->
        <mxCell id="node_devops" value="&lt;b style=&quot;font-size:13px;&quot;&gt;DevOps&lt;/b&gt;&lt;br&gt;&lt;font color=&quot;#64748B&quot; style=&quot;font-size:11px;&quot;&gt;IaC &amp;amp; GitOps Manifests&lt;/font&gt;" style="shape=image;html=1;verticalAlign=top;verticalLabelPosition=bottom;labelBackgroundColor=none;imageAspect=1;aspect=fixed;image=${b64DevOps};" vertex="1" parent="1">
          <mxGeometry x="60" y="470" width="70" height="70" as="geometry" />
        </mxCell>

        <!-- ==================== GITHUB REPO ==================== -->
        <mxCell id="node_github" value="&lt;b style=&quot;font-size:14px;&quot;&gt;GitHub&lt;/b&gt;&lt;br&gt;&lt;font color=&quot;#64748B&quot; style=&quot;font-size:11px;&quot;&gt;Marketplace-microservices&lt;br&gt;(dev / main)&lt;/font&gt;" style="shape=image;html=1;verticalAlign=top;verticalLabelPosition=bottom;labelBackgroundColor=none;imageAspect=1;aspect=fixed;image=${b64GitHub};" vertex="1" parent="1">
          <mxGeometry x="240" y="320" width="75" height="75" as="geometry" />
        </mxCell>

        <!-- Connectors Dev -> GitHub -->
        <mxCell id="edge_soft_gh" value="App Code &amp;amp; PRs" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;entryX=0;entryY=0.3;entryDx=0;entryDy=0;strokeColor=#0F172A;strokeWidth=2;fontColor=#0F172A;fontSize=11;fontStyle=1;" edge="1" parent="1" source="node_soft_dev" target="node_github">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="edge_devops_gh" value="IaC &amp;amp; Manifests" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;entryX=0;entryY=0.7;entryDx=0;entryDy=0;strokeColor=#0F172A;strokeWidth=2;fontColor=#0F172A;fontSize=11;fontStyle=1;" edge="1" parent="1" source="node_devops" target="node_github">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>

        <!-- ==================== GITHUB ACTIONS ICON ==================== -->
        <mxCell id="node_gh_actions_icon" value="&lt;b style=&quot;font-size:13px;color:#2563EB;&quot;&gt;GitHub Actions&lt;/b&gt;" style="shape=image;html=1;verticalAlign=top;verticalLabelPosition=bottom;labelBackgroundColor=none;imageAspect=1;aspect=fixed;image=${b64GHActions};" vertex="1" parent="1">
          <mxGeometry x="380" y="325" width="65" height="65" as="geometry" />
        </mxCell>
        <mxCell id="edge_gh_gha" value="" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;entryX=0;entryY=0.5;entryDx=0;entryDy=0;strokeColor=#0F172A;strokeWidth=2;" edge="1" parent="1" source="node_github" target="node_gh_actions_icon">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>

        <!-- ==================== GITHUB ACTIONS CI/CD BOX ==================== -->
        <mxCell id="box_cicd" value="&lt;b style=&quot;font-size:13px;&quot;&gt;GitHub Actions CI/CD&lt;/b&gt;&lt;br&gt;&lt;font color=&quot;#64748B&quot; style=&quot;font-size:10px;&quot;&gt;Workload Identity Federation (WIF)&lt;/font&gt;" style="swimlane;whiteSpace=wrap;html=1;fillColor=#EFF6FF;strokeColor=#93C5FD;fontColor=#1E3A8A;rounded=1;arcSize=10;startSize=36;strokeWidth=1.5;" vertex="1" parent="1">
          <mxGeometry x="490" y="270" width="220" height="260" as="geometry" />
        </mxCell>

        <!-- CI Tool: Gitleaks -->
        <mxCell id="tool_gitleaks" value="&lt;b style=&quot;font-size:11px;&quot;&gt;Gitleaks&lt;/b&gt;&lt;br&gt;&lt;font color=&quot;#64748B&quot; style=&quot;font-size:9px;&quot;&gt;Secret Scan&lt;/font&gt;" style="shape=image;html=1;verticalAlign=top;verticalLabelPosition=bottom;labelBackgroundColor=none;imageAspect=1;aspect=fixed;image=${b64Gitleaks};" vertex="1" parent="box_cicd">
          <mxGeometry x="25" y="45" width="40" height="40" as="geometry" />
        </mxCell>
        <!-- CI Tool: Hadolint -->
        <mxCell id="tool_hadolint" value="&lt;b style=&quot;font-size:11px;&quot;&gt;Hadolint&lt;/b&gt;&lt;br&gt;&lt;font color=&quot;#64748B&quot; style=&quot;font-size:9px;&quot;&gt;Dockerfile Lint&lt;/font&gt;" style="shape=image;html=1;verticalAlign=top;verticalLabelPosition=bottom;labelBackgroundColor=none;imageAspect=1;aspect=fixed;image=${b64Hadolint};" vertex="1" parent="box_cicd">
          <mxGeometry x="135" y="45" width="40" height="40" as="geometry" />
        </mxCell>
        <!-- CI Tool: SonarCloud -->
        <mxCell id="tool_sonar" value="&lt;b style=&quot;font-size:11px;&quot;&gt;SonarCloud&lt;/b&gt;&lt;br&gt;&lt;font color=&quot;#64748B&quot; style=&quot;font-size:9px;&quot;&gt;SAST Gate&lt;/font&gt;" style="shape=image;html=1;verticalAlign=top;verticalLabelPosition=bottom;labelBackgroundColor=none;imageAspect=1;aspect=fixed;image=${b64Sonar};" vertex="1" parent="box_cicd">
          <mxGeometry x="25" y="150" width="40" height="40" as="geometry" />
        </mxCell>
        <!-- CI Tool: Trivy -->
        <mxCell id="tool_trivy" value="&lt;b style=&quot;font-size:11px;&quot;&gt;Trivy&lt;/b&gt;&lt;br&gt;&lt;font color=&quot;#64748B&quot; style=&quot;font-size:9px;&quot;&gt;CVE Scan&lt;/font&gt;" style="shape=image;html=1;verticalAlign=top;verticalLabelPosition=bottom;labelBackgroundColor=none;imageAspect=1;aspect=fixed;image=${b64Trivy};" vertex="1" parent="box_cicd">
          <mxGeometry x="135" y="150" width="40" height="40" as="geometry" />
        </mxCell>

        <!-- ==================== ARTIFACT REGISTRY ==================== -->
        <mxCell id="node_artifact_reg" value="&lt;b style=&quot;font-size:13px;&quot;&gt;GCP Artifact Registry&lt;/b&gt;&lt;br&gt;&lt;font color=&quot;#64748B&quot; style=&quot;font-size:11px;&quot;&gt;boutique-containers-dev&lt;br&gt;(Cosign Signed Images)&lt;/font&gt;" style="shape=image;html=1;verticalAlign=top;verticalLabelPosition=bottom;labelBackgroundColor=none;imageAspect=1;aspect=fixed;image=${b64ArtifactReg};" vertex="1" parent="1">
          <mxGeometry x="640" y="80" width="65" height="65" as="geometry" />
        </mxCell>
        <mxCell id="edge_ci_registry" value="Built Docker Image" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;entryX=0;entryY=0.5;entryDx=0;entryDy=0;strokeColor=#0F172A;strokeWidth=2;fontColor=#0F172A;fontSize=11;fontStyle=1;" edge="1" parent="1" source="node_gh_actions_icon" target="node_artifact_reg">
          <mxGeometry relative="1" as="geometry">
            <Array as="points">
              <mxPoint x="412" y="112" />
            </Array>
          </mxGeometry>
        </mxCell>

        <!-- ==================== ARGO CD (GITOPS) ==================== -->
        <mxCell id="node_argocd" value="&lt;b style=&quot;font-size:14px;&quot;&gt;Argo CD&lt;/b&gt;&lt;br&gt;&lt;font color=&quot;#DC2626&quot; style=&quot;font-size:12px;&quot;&gt;&lt;b&gt;(GitOps)&lt;/b&gt;&lt;/font&gt;" style="shape=image;html=1;verticalAlign=top;verticalLabelPosition=bottom;labelBackgroundColor=none;imageAspect=1;aspect=fixed;image=${b64ArgoCD};" vertex="1" parent="1">
          <mxGeometry x="560" y="600" width="80" height="80" as="geometry" />
        </mxCell>
        <mxCell id="edge_gh_argo" value="Pull Manifests" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;entryX=0;entryY=0.5;entryDx=0;entryDy=0;strokeColor=#0F172A;strokeWidth=2;fontColor=#0F172A;fontSize=11;fontStyle=1;" edge="1" parent="1" source="node_gh_actions_icon" target="node_argocd">
          <mxGeometry relative="1" as="geometry">
            <Array as="points">
              <mxPoint x="412" y="640" />
            </Array>
          </mxGeometry>
        </mxCell>

        <!-- ==================== GKE CLUSTER BOUNDARY ==================== -->
        <mxCell id="box_gke_cluster" value="&lt;b style=&quot;font-size:16px;&quot;&gt;Google Kubernetes Engine (GKE)&lt;/b&gt;&lt;br&gt;&lt;font color=&quot;#64748B&quot; style=&quot;font-size:11px;&quot;&gt;Private VPC-Native Cluster • us-central1-a&lt;/font&gt;" style="swimlane;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#0F172A;fontColor=#0F172A;rounded=1;arcSize=8;startSize=55;strokeWidth=2.5;shadow=1;" vertex="1" parent="1">
          <mxGeometry x="800" y="140" width="400" height="660" as="geometry" />
        </mxCell>

        <!-- GCP Logo Top Inside GKE -->
        <mxCell id="logo_gcp" value="" style="shape=image;html=1;verticalAlign=top;verticalLabelPosition=bottom;labelBackgroundColor=none;imageAspect=1;aspect=fixed;image=${b64GCP};" vertex="1" parent="box_gke_cluster">
          <mxGeometry x="175" y="8" width="50" height="50" as="geometry" />
        </mxCell>

        <!-- Namespace 1: boutique-dev -->
        <mxCell id="box_ns_boutique" value="&lt;b style=&quot;font-size:13px;&quot;&gt;boutique-dev&lt;/b&gt;" style="swimlane;whiteSpace=wrap;html=1;fillColor=#F8FAFC;strokeColor=#0F172A;fontColor=#0F172A;rounded=1;arcSize=8;startSize=30;strokeWidth=1.5;" vertex="1" parent="box_gke_cluster">
          <mxGeometry x="25" y="70" width="350" height="150" as="geometry" />
        </mxCell>
        <mxCell id="icon_pod" value="&lt;b style=&quot;font-size:11px;&quot;&gt;pod&lt;/b&gt;" style="shape=image;html=1;verticalAlign=top;verticalLabelPosition=bottom;labelBackgroundColor=none;imageAspect=1;aspect=fixed;image=${b64Pod};" vertex="1" parent="box_ns_boutique">
          <mxGeometry x="40" y="45" width="45" height="45" as="geometry" />
        </mxCell>
        <mxCell id="icon_services" value="&lt;b style=&quot;font-size:11px;&quot;&gt;microservices&lt;/b&gt;&lt;br&gt;&lt;font color=&quot;#64748B&quot; style=&quot;font-size:9px;&quot;&gt;12 Polyglot Services&lt;/font&gt;" style="shape=image;html=1;verticalAlign=top;verticalLabelPosition=bottom;labelBackgroundColor=none;imageAspect=1;aspect=fixed;image=${b64GKE};" vertex="1" parent="box_ns_boutique">
          <mxGeometry x="230" y="45" width="45" height="45" as="geometry" />
        </mxCell>

        <!-- Namespace 2: argocd -->
        <mxCell id="box_ns_argocd" value="&lt;b style=&quot;font-size:13px;&quot;&gt;argocd&lt;/b&gt;" style="swimlane;whiteSpace=wrap;html=1;fillColor=#F8FAFC;strokeColor=#0F172A;fontColor=#0F172A;rounded=1;arcSize=8;startSize=30;strokeWidth=1.5;" vertex="1" parent="box_gke_cluster">
          <mxGeometry x="25" y="250" width="350" height="140" as="geometry" />
        </mxCell>
        <mxCell id="icon_argo_in_ns" value="&lt;b style=&quot;font-size:12px;&quot;&gt;Argo CD&lt;/b&gt;&lt;br&gt;&lt;font color=&quot;#64748B&quot; style=&quot;font-size:10px;&quot;&gt;Server &amp;amp; Controllers&lt;/font&gt;" style="shape=image;html=1;verticalAlign=top;verticalLabelPosition=bottom;labelBackgroundColor=none;imageAspect=1;aspect=fixed;image=${b64ArgoCD};" vertex="1" parent="box_ns_argocd">
          <mxGeometry x="150" y="45" width="50" height="50" as="geometry" />
        </mxCell>

        <!-- Namespace 3: headlamp -->
        <mxCell id="box_ns_headlamp" value="&lt;b style=&quot;font-size:13px;&quot;&gt;headlamp&lt;/b&gt;" style="swimlane;whiteSpace=wrap;html=1;fillColor=#F8FAFC;strokeColor=#0F172A;fontColor=#0F172A;rounded=1;arcSize=8;startSize=30;strokeWidth=1.5;" vertex="1" parent="box_gke_cluster">
          <mxGeometry x="25" y="420" width="350" height="150" as="geometry" />
        </mxCell>
        <mxCell id="icon_headlamp_in_ns" value="&lt;b style=&quot;font-size:13px;&quot;&gt;Headlamp&lt;/b&gt;&lt;br&gt;&lt;font color=&quot;#64748B&quot; style=&quot;font-size:10px;&quot;&gt;Kubernetes dashboard&lt;/font&gt;" style="shape=image;html=1;verticalAlign=top;verticalLabelPosition=bottom;labelBackgroundColor=none;imageAspect=1;aspect=fixed;image=${b64Headlamp};" vertex="1" parent="box_ns_headlamp">
          <mxGeometry x="145" y="45" width="55" height="55" as="geometry" />
        </mxCell>

        <!-- Connector Argo CD -> GKE Cluster -->
        <mxCell id="edge_argo_gke" value="Continuously deploy" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;entryX=0;entryY=0.5;entryDx=0;entryDy=0;strokeColor=#0F172A;strokeWidth=2;fontColor=#0F172A;fontSize=11;fontStyle=1;" edge="1" parent="1" source="node_argocd" target="box_ns_argocd">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="edge_argo_boutique" value="" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;entryX=0;entryY=0.5;entryDx=0;entryDy=0;strokeColor=#0F172A;strokeWidth=2;" edge="1" parent="1" source="node_argocd" target="box_ns_boutique">
          <mxGeometry relative="1" as="geometry">
            <Array as="points">
              <mxPoint x="750" y="640" />
              <mxPoint x="750" y="285" />
            </Array>
          </mxGeometry>
        </mxCell>
        <mxCell id="edge_argo_headlamp" value="" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;entryX=0;entryY=0.5;entryDx=0;entryDy=0;strokeColor=#0F172A;strokeWidth=2;" edge="1" parent="1" source="node_argocd" target="box_ns_headlamp">
          <mxGeometry relative="1" as="geometry">
            <Array as="points">
              <mxPoint x="750" y="640" />
              <mxPoint x="750" y="635" />
            </Array>
          </mxGeometry>
        </mxCell>

        <!-- ==================== TOP RIGHT: GCLB & MANAGED SSL ==================== -->
        <mxCell id="node_gclb" value="&lt;b style=&quot;font-size:12px;&quot;&gt;Google Cloud HTTP(S)&lt;br&gt;Load Balancer&lt;/b&gt;" style="shape=image;html=1;verticalAlign=top;verticalLabelPosition=bottom;labelBackgroundColor=none;imageAspect=1;aspect=fixed;image=${b64GCLB};" vertex="1" parent="1">
          <mxGeometry x="1340" y="40" width="55" height="55" as="geometry" />
        </mxCell>
        <mxCell id="node_ssl_cert" value="&lt;b style=&quot;font-size:12px;&quot;&gt;Google-managed&lt;br&gt;SSL Certificates&lt;/b&gt;" style="shape=image;html=1;verticalAlign=top;verticalLabelPosition=bottom;labelBackgroundColor=none;imageAspect=1;aspect=fixed;image=${b64SSLCert};" vertex="1" parent="1">
          <mxGeometry x="1500" y="40" width="55" height="55" as="geometry" />
        </mxCell>

        <!-- ==================== RIGHT DESTINATION 1: PUBLIC USERS ==================== -->
        <mxCell id="dest_public_users" value="&lt;b style=&quot;font-size:14px;&quot;&gt;Public Users /&lt;br&gt;Customers&lt;/b&gt;&lt;br&gt;&lt;font color=&quot;#16A34A&quot; style=&quot;font-size:11px;&quot;&gt;https://dev.devopsstandard.name.ng&lt;/font&gt;" style="shape=image;html=1;verticalAlign=top;verticalLabelPosition=bottom;labelBackgroundColor=none;imageAspect=1;aspect=fixed;image=${b64PublicUsers};" vertex="1" parent="1">
          <mxGeometry x="1570" y="240" width="70" height="70" as="geometry" />
        </mxCell>

        <!-- Route: boutique-dev -> Public Users -->
        <mxCell id="edge_boutique_users" value="dev.devopsstandard.name.ng" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;entryX=0;entryY=0.5;entryDx=0;entryDy=0;strokeColor=#0F172A;strokeWidth=2.5;fontColor=#0F172A;fontSize=12;fontStyle=1;" edge="1" parent="1" source="box_ns_boutique" target="dest_public_users">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>

        <!-- ==================== RIGHT DESTINATION 2: DEVOPS ENGINEER PC ==================== -->
        <!-- Ingress GCLB mini box for Admin -->
        <mxCell id="box_admin_gclb" value="&lt;b style=&quot;font-size:11px;&quot;&gt;Google Cloud HTTP(S)&lt;br&gt;Load Balancer&lt;/b&gt;" style="swimlane;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#0F172A;fontColor=#0F172A;rounded=1;arcSize=8;startSize=22;strokeWidth=1.5;" vertex="1" parent="1">
          <mxGeometry x="1340" y="550" width="130" height="120" as="geometry" />
        </mxCell>
        <mxCell id="icon_admin_gclb" value="" style="shape=image;html=1;verticalAlign=top;verticalLabelPosition=bottom;labelBackgroundColor=none;imageAspect=1;aspect=fixed;image=${b64GCLB};" vertex="1" parent="box_admin_gclb">
          <mxGeometry x="45" y="40" width="40" height="40" as="geometry" />
        </mxCell>

        <!-- DevOps Engineer PC Destination -->
        <mxCell id="dest_devops_pc" value="&lt;b style=&quot;font-size:14px;&quot;&gt;DevOps Engineer PC&lt;/b&gt;&lt;br&gt;&lt;font color=&quot;#0284C7&quot; style=&quot;font-size:11px;&quot;&gt;GitOps &amp;amp; Cluster Management&lt;/font&gt;&lt;br&gt;&lt;i style=&quot;font-size:10px;color:#64748B;&quot;&gt;argocd &amp;amp; headlamp endpoints&lt;/i&gt;" style="shape=image;html=1;verticalAlign=top;verticalLabelPosition=bottom;labelBackgroundColor=none;imageAspect=1;aspect=fixed;image=${b64AdminPC};" vertex="1" parent="1">
          <mxGeometry x="1570" y="570" width="75" height="75" as="geometry" />
        </mxCell>

        <!-- Route: argocd & headlamp -> Admin GCLB -> DevOps PC -->
        <mxCell id="edge_argocd_admin" value="argocd.devopsstandard.name.ng" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;entryX=0;entryY=0.3;entryDx=0;entryDy=0;strokeColor=#0F172A;strokeWidth=2.5;fontColor=#0F172A;fontSize=12;fontStyle=1;" edge="1" parent="1" source="box_ns_argocd" target="dest_devops_pc">
          <mxGeometry relative="1" as="geometry">
            <Array as="points">
              <mxPoint x="1270" y="460" />
              <mxPoint x="1270" y="590" />
            </Array>
          </mxGeometry>
        </mxCell>
        <mxCell id="edge_headlamp_admin" value="headlamp.devopsstandard.name.ng" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;entryX=0;entryY=0.7;entryDx=0;entryDy=0;strokeColor=#0F172A;strokeWidth=2.5;fontColor=#0F172A;fontSize=12;fontStyle=1;" edge="1" parent="1" source="box_ns_headlamp" target="dest_devops_pc">
          <mxGeometry relative="1" as="geometry">
            <Array as="points">
              <mxPoint x="1270" y="635" />
              <mxPoint x="1270" y="625" />
            </Array>
          </mxGeometry>
        </mxCell>

      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;

const targetPath = path.resolve(__dirname, '..', 'docs', 'architecture-flow.drawio');
fs.writeFileSync(targetPath, xml, 'utf-8');
console.log('Successfully wrote draw.io file with embedded base64 SVG logo icons at: ' + targetPath);
