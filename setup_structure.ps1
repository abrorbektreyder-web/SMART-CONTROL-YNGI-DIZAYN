$base = "backend/app"

# Create directories
$dirs = @(
    "$base/core",
    "$base/modules/auth",
    "$base/modules/products",
    "$base/modules/shifts",
    "$base/modules/sales",
    "$base/modules/debts",
    "$base/modules/expenses",
    "$base/modules/reports"
)

foreach ($d in $dirs) {
    if (!(Test-Path $d)) {
        New-Item -Path $d -ItemType Directory -Force | Out-Null
        Write-Host "Created directory: $d"
    }
}

# Create files
$files = @(
    "$base/__init__.py",
    "$base/main.py",
    "$base/core/__init__.py",
    "$base/core/config.py",
    "$base/core/db.py",
    "$base/core/security.py",
    "$base/core/dependencies.py",
    "$base/modules/__init__.py",
    "$base/modules/auth/__init__.py",
    "$base/modules/products/__init__.py",
    "$base/modules/shifts/__init__.py",
    "$base/modules/sales/__init__.py",
    "$base/modules/debts/__init__.py",
    "$base/modules/expenses/__init__.py",
    "$base/modules/reports/__init__.py"
)

foreach ($f in $files) {
    if (!(Test-Path $f)) {
        New-Item -Path $f -ItemType File -Force | Out-Null
        Write-Host "Created file: $f"
    }
}
