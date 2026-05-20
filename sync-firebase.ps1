# Sync Firebase order backend JS to all product folders (and nested OFFICIAL-main copy)
$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

$jsFiles = @(
    "firebase-config.js",
    "firebase-config.example.js",
    "orders-firebase.js",
    "orders-sheet.js",
    "orders-backend.js",
    "load-orders-backend.js"
)

$targets = @(
    "moka",
    "moka-pro-max",
    "saqr",
    "projectors"
)

foreach ($folder in $targets) {
    $jsDir = Join-Path $root "$folder\js"
    if (-not (Test-Path $jsDir)) { New-Item -ItemType Directory -Force -Path $jsDir | Out-Null }
    foreach ($f in $jsFiles) {
        $src = Join-Path $root "js\$f"
        if (Test-Path $src) {
            Copy-Item $src (Join-Path $jsDir $f) -Force
        }
    }
    Write-Host "Synced js -> $folder"
}

$nested = Join-Path $root "OFFICIAL-main"
if (Test-Path $nested) {
    foreach ($folder in $targets) {
        $jsDir = Join-Path $nested "$folder\js"
        if (-not (Test-Path $jsDir)) { New-Item -ItemType Directory -Force -Path $jsDir | Out-Null }
        foreach ($f in $jsFiles) {
            $src = Join-Path $root "js\$f"
            if (Test-Path $src) {
                Copy-Item $src (Join-Path $jsDir $f) -Force
            }
        }
    }
    $adminJs = Join-Path $nested "admin\js"
    if (Test-Path (Join-Path $root "admin\js")) {
        if (-not (Test-Path $adminJs)) { New-Item -ItemType Directory -Force -Path $adminJs | Out-Null }
        Copy-Item (Join-Path $root "admin\js\*") $adminJs -Force -Recurse
    }
    $fbConfig = Join-Path $root "js\firebase-config.js"
    if (Test-Path $fbConfig) {
        Copy-Item $fbConfig (Join-Path $nested "js\firebase-config.js") -Force -ErrorAction SilentlyContinue
    }
    Write-Host "Synced nested OFFICIAL-main"
}

Write-Host "Firebase backend sync complete."
