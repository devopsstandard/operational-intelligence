<#
.SYNOPSIS
  Executes Terraform locally using values defined in .env
.EXAMPLE
  .\scripts\tf-local.ps1 -Environment dev -Action plan
  .\scripts\tf-local.ps1 -Environment dev -Action apply
  .\scripts\tf-local.ps1 -Environment prod -Action apply
#>
param (
    [Parameter(Mandatory=$false)]
    [ValidateSet("dev", "prod")]
    [string]$Environment = "dev",

    [Parameter(Mandatory=$false)]
    [ValidateSet("init", "plan", "apply", "destroy", "validate", "fmt")]
    [string]$Action = "plan"
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = Split-Path -Parent $scriptDir
$envFile = Join-Path $rootDir ".env"

if (Test-Path $envFile) {
    Write-Host "==> Loading configuration from .env..." -ForegroundColor Cyan
    Get-Content $envFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -and !$line.StartsWith("#") -and $line.Contains("=")) {
            $parts = $line.Split("=", 2)
            $key = $parts[0].Trim()
            $val = $parts[1].Trim().Trim('"').Trim("'")
            [System.Environment]::SetEnvironmentVariable($key, $val, "Process")
        }
    }
} else {
    Write-Warning ".env file not found at $envFile. Using existing environment variables."
}

$projId = [System.Environment]::GetEnvironmentVariable("GCP_PROJECT_ID")
$region = [System.Environment]::GetEnvironmentVariable("GCP_REGION")
if (-not $region) { $region = "europe-west1" }
$githubRepo = [System.Environment]::GetEnvironmentVariable("GITHUB_REPO")
if (-not $githubRepo) { $githubRepo = "" }

if (-not $projId -or $projId -eq "your-gcp-project-id") {
    Write-Error "Please configure a valid GCP_PROJECT_ID in .env before running Terraform."
    exit 1
}

$envDir = Join-Path $rootDir "terraform\environments\$Environment"
Write-Host "==> Running Terraform $Action for [$Environment] in $envDir..." -ForegroundColor Green

Push-Location $envDir
try {
    $varArgs = @(
        "-var=project_id=$projId",
        "-var=region=$region",
        "-var=github_repo=$githubRepo"
    )

    if ($Action -eq "init") {
        terraform init
    } elseif ($Action -eq "plan") {
        terraform plan @varArgs
    } elseif ($Action -eq "apply") {
        terraform apply @varArgs
    } elseif ($Action -eq "destroy") {
        terraform destroy @varArgs
    } elseif ($Action -eq "validate") {
        terraform validate
    } elseif ($Action -eq "fmt") {
        terraform fmt
    }
} finally {
    Pop-Location
}
