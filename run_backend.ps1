# ── run_backend.ps1 ──────────────────────────────────────────────────────────
# Run from the project root:  .\run_backend.ps1
# -----------------------------------------------------------------------------

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir = Join-Path $ScriptDir "backend"
$VenvPython = Join-Path $BackendDir "venv\Scripts\python.exe"

# Activate the virtual environment
& "$BackendDir\venv\Scripts\Activate.ps1"

# Set PYTHONPATH so `from src.xxx import ...` resolves correctly
$env:PYTHONPATH = $BackendDir

# Move into backend/ and launch uvicorn
Set-Location $BackendDir
Write-Host "Starting Health Analyzer API..." -ForegroundColor Cyan
Write-Host "PYTHONPATH = $env:PYTHONPATH" -ForegroundColor DarkGray
& $VenvPython -m uvicorn src.api:app --reload --host 0.0.0.0 --port 8000
