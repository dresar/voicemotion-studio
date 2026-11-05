$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot

Set-Location (Join-Path $Root "frontend")
npm ci
npm run test
npm run typecheck
npm run build

$Static = Join-Path $Root "backend\static"
if (Test-Path $Static) {
  Remove-Item -Recurse -Force $Static
}
New-Item -ItemType Directory -Force -Path $Static | Out-Null
Copy-Item -Path "out\*" -Destination $Static -Recurse -Force

Set-Location (Join-Path $Root "backend")
go mod download
go vet ./...
go build -o voicemotion.exe .

Write-Output ("Build selesai: " + (Join-Path $Root "backend\voicemotion.exe"))
