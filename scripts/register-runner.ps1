param(
  [string]$Repo = "TruJ0e/TruRando",
  [string]$RunnerName = "TruJoe-TruRando",
  [string]$Label = "trurando-windows",
  [string]$RunnerRoot = "$env:USERPROFILE\actions-runners\Projects\TruRando"
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  throw "GitHub CLI (gh) is required and must already be authenticated."
}

if (-not [Environment]::Is64BitOperatingSystem) {
  throw "TruRando runner setup expects 64-bit Windows."
}

Write-Host "Preparing self-hosted runner for $Repo..."

$release = Invoke-RestMethod -Uri "https://api.github.com/repos/actions/runner/releases/latest" -Headers @{ "User-Agent" = "TruRando-Runner-Setup" }
$asset = $release.assets | Where-Object { $_.name -match '^actions-runner-win-x64-.*\.zip$' } | Select-Object -First 1
if (-not $asset) {
  throw "Could not find the latest Windows x64 GitHub Actions runner package."
}

New-Item -ItemType Directory -Force -Path $RunnerRoot | Out-Null
$zipPath = Join-Path $env:TEMP $asset.name

Write-Host "Downloading $($asset.name)..."
Invoke-WebRequest -Uri $asset.browser_download_url -OutFile $zipPath -UseBasicParsing

if (Test-Path (Join-Path $RunnerRoot '.runner')) {
  Write-Host "A runner is already configured in $RunnerRoot. Skipping extraction/configuration."
} else {
  Expand-Archive -Path $zipPath -DestinationPath $RunnerRoot -Force
  $token = gh api --method POST "repos/$Repo/actions/runners/registration-token" --jq '.token'
  if (-not $token) {
    throw "Could not obtain a GitHub runner registration token. Confirm gh has admin access to $Repo."
  }

  Push-Location $RunnerRoot
  try {
    & .\config.cmd --url "https://github.com/$Repo" --token $token --name $RunnerName --labels $Label --unattended --replace
    if ($LASTEXITCODE -ne 0) {
      throw "GitHub runner configuration failed with exit code $LASTEXITCODE."
    }
  } finally {
    Pop-Location
  }
}

$taskName = "GitHubRunner-TruRando"
$runCmd = Join-Path $RunnerRoot 'run.cmd'
$taskAction = New-ScheduledTaskAction -Execute 'cmd.exe' -Argument "/c `"$runCmd`"" -WorkingDirectory $RunnerRoot
$taskTrigger = New-ScheduledTaskTrigger -AtLogOn
$taskPrincipal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited
$task = New-ScheduledTask -Action $taskAction -Trigger $taskTrigger -Principal $taskPrincipal -Description "TruRando GitHub Actions self-hosted runner"
Register-ScheduledTask -TaskName $taskName -InputObject $task -Force | Out-Null
Start-ScheduledTask -TaskName $taskName

Remove-Item $zipPath -Force -ErrorAction SilentlyContinue
Write-Host "Runner configured. Label: $Label. Scheduled task: $taskName."
