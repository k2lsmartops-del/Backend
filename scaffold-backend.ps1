# scaffold-backend.ps1 — Crée l'arborescence complète du backend AIP Terrain
#
# À lancer DEPUIS la racine de ton projet backend (le dossier qui contient src/).
# Crée tous les dossiers et fichiers vides de la structure modulaire.
# Les fichiers existants ne sont PAS écrasés (création seulement si absent).
#
# Usage :
#   cd aip-backend
#   .\scaffold-backend.ps1
#

$ErrorActionPreference = "Stop"

Write-Host "→ Création de la structure backend AIP Terrain..." -ForegroundColor Yellow

# Fonction : crée un fichier vide seulement s'il n'existe pas déjà
function Touch-Safe {
    param([string]$Path)
    if (-not (Test-Path $Path)) {
        New-Item -ItemType File -Path $Path -Force | Out-Null
        Write-Host "  + $Path"
    } else {
        Write-Host "  = $Path (déjà présent, ignoré)"
    }
}

# ── prisma/ ──
New-Item -ItemType Directory -Path "prisma/migrations" -Force | Out-Null
Touch-Safe "prisma/seed.ts"

# ── config/ ──
New-Item -ItemType Directory -Path "src/config" -Force | Out-Null
Touch-Safe "src/config/configuration.ts"
Touch-Safe "src/config/env.validation.ts"

# ── prisma module ──
New-Item -ItemType Directory -Path "src/prisma" -Force | Out-Null
Touch-Safe "src/prisma/prisma.module.ts"
Touch-Safe "src/prisma/prisma.service.ts"

# ── common/ ──
New-Item -ItemType Directory -Path "src/common/decorators" -Force | Out-Null
New-Item -ItemType Directory -Path "src/common/guards" -Force | Out-Null
New-Item -ItemType Directory -Path "src/common/filters" -Force | Out-Null
New-Item -ItemType Directory -Path "src/common/interceptors" -Force | Out-Null
New-Item -ItemType Directory -Path "src/common/dto" -Force | Out-Null
Touch-Safe "src/common/decorators/roles.decorator.ts"
Touch-Safe "src/common/decorators/current-user.decorator.ts"
Touch-Safe "src/common/decorators/public.decorator.ts"
Touch-Safe "src/common/guards/jwt-auth.guard.ts"
Touch-Safe "src/common/guards/roles.guard.ts"
Touch-Safe "src/common/filters/http-exception.filter.ts"
Touch-Safe "src/common/interceptors/transform.interceptor.ts"
Touch-Safe "src/common/dto/pagination.dto.ts"

# ── auth/ ──
New-Item -ItemType Directory -Path "src/auth/strategies" -Force | Out-Null
New-Item -ItemType Directory -Path "src/auth/dto" -Force | Out-Null
Touch-Safe "src/auth/auth.module.ts"
Touch-Safe "src/auth/auth.controller.ts"
Touch-Safe "src/auth/auth.service.ts"
Touch-Safe "src/auth/strategies/jwt.strategy.ts"
Touch-Safe "src/auth/dto/login.dto.ts"
Touch-Safe "src/auth/dto/refresh.dto.ts"

# ── users/ ──
New-Item -ItemType Directory -Path "src/users/dto" -Force | Out-Null
Touch-Safe "src/users/users.module.ts"
Touch-Safe "src/users/users.controller.ts"
Touch-Safe "src/users/users.service.ts"
Touch-Safe "src/users/dto/create-user.dto.ts"
Touch-Safe "src/users/dto/update-user.dto.ts"
Touch-Safe "src/users/dto/query-users.dto.ts"

# ── zones/ ──
New-Item -ItemType Directory -Path "src/zones/dto" -Force | Out-Null
Touch-Safe "src/zones/zones.module.ts"
Touch-Safe "src/zones/zones.controller.ts"
Touch-Safe "src/zones/zones.service.ts"
Touch-Safe "src/zones/dto/create-zone.dto.ts"
Touch-Safe "src/zones/dto/update-zone.dto.ts"

# ── submissions/ ──
New-Item -ItemType Directory -Path "src/submissions/dto" -Force | Out-Null
Touch-Safe "src/submissions/submissions.module.ts"
Touch-Safe "src/submissions/submissions.controller.ts"
Touch-Safe "src/submissions/submissions.service.ts"
Touch-Safe "src/submissions/dto/create-submission.dto.ts"
Touch-Safe "src/submissions/dto/sync-submission.dto.ts"
Touch-Safe "src/submissions/dto/query-submissions.dto.ts"

# ── validation/ ──
New-Item -ItemType Directory -Path "src/validation/dto" -Force | Out-Null
Touch-Safe "src/validation/validation.module.ts"
Touch-Safe "src/validation/validation.controller.ts"
Touch-Safe "src/validation/validation.service.ts"
Touch-Safe "src/validation/dto/validate.dto.ts"
Touch-Safe "src/validation/dto/reject.dto.ts"

# ── uploads/ ──
New-Item -ItemType Directory -Path "src/uploads" -Force | Out-Null
Touch-Safe "src/uploads/uploads.module.ts"
Touch-Safe "src/uploads/uploads.controller.ts"
Touch-Safe "src/uploads/uploads.service.ts"

# ── dashboard/ ──
New-Item -ItemType Directory -Path "src/dashboard" -Force | Out-Null
Touch-Safe "src/dashboard/dashboard.module.ts"
Touch-Safe "src/dashboard/dashboard.controller.ts"
Touch-Safe "src/dashboard/dashboard.service.ts"

# ── health/ ──
New-Item -ItemType Directory -Path "src/health" -Force | Out-Null
Touch-Safe "src/health/health.module.ts"
Touch-Safe "src/health/health.controller.ts"

Write-Host ""
Write-Host "✅ Structure créée avec succès !" -ForegroundColor Green
Write-Host "Note : les fichiers sont vides, prêts à être remplis module par module." -ForegroundColor Yellow
Write-Host "Prochaine étape suggérée : remplir prisma/, config/ et main.ts (les fondations)."
