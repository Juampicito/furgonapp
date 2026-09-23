param([switch]$SkipBuild)
$ErrorActionPreference = 'Stop'
$projectRoot = $PSScriptRoot
$toolsDir = Join-Path $projectRoot '.tools'
$logsDir = Join-Path $toolsDir 'logs'
New-Item -ItemType Directory -Force -Path $toolsDir,$logsDir | Out-Null
if (-not (Get-Command java -ErrorAction SilentlyContinue)) { throw 'Instala Java 17 o superior antes de continuar.' }
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Instala Node.js 20.9 o superior antes de continuar.' }
foreach ($port in @(8080,3000)) {
    if (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue) { throw "El puerto $port está ocupado. Detén esa instancia antes de iniciar otra." }
}
if (-not $SkipBuild) {
    $mavenCommand = Get-Command mvn.cmd -ErrorAction SilentlyContinue
    if ($mavenCommand) { $maven = $mavenCommand.Source } else {
        $maven = Join-Path $toolsDir 'apache-maven-3.9.11/bin/mvn.cmd'
        if (-not (Test-Path -LiteralPath $maven)) {
            Write-Host 'Descargando Maven con verificación SHA-512...'
            & node (Join-Path $projectRoot 'scripts/download-maven.mjs') $toolsDir
            if ($LASTEXITCODE -ne 0) { throw 'No se pudo descargar Maven.' }
            Expand-Archive -LiteralPath (Join-Path $toolsDir 'maven.zip') -DestinationPath $toolsDir -Force
        }
    }
}
if (-not $SkipBuild) {
    Push-Location (Join-Path $projectRoot 'backend')
    try { & $maven "-Dmaven.repo.local=$toolsDir/m2" package; if ($LASTEXITCODE -ne 0) { throw 'Falló la compilación del backend.' } } finally { Pop-Location }
    Push-Location (Join-Path $projectRoot 'frontend')
    try {
        & npm.cmd ci --cache "$toolsDir/npm-cache" --no-audit --no-fund
        if ($LASTEXITCODE -ne 0) { throw 'No se pudieron instalar las dependencias del frontend.' }
        & npm.cmd run build
        if ($LASTEXITCODE -ne 0) { throw 'Falló la compilación del frontend.' }
    } finally { Pop-Location }
}
Copy-Item -LiteralPath (Join-Path $projectRoot 'backend/target/furgonapp-0.1.0.jar') -Destination (Join-Path $toolsDir 'furgonapp-running.jar') -Force
$javaProcess = Start-Process -FilePath (Get-Command java).Source -ArgumentList '-jar','../.tools/furgonapp-running.jar','--spring.profiles.active=demo' -WorkingDirectory (Join-Path $projectRoot 'backend') -WindowStyle Hidden -RedirectStandardOutput (Join-Path $logsDir 'backend.log') -RedirectStandardError (Join-Path $logsDir 'backend-error.log') -PassThru
$nodeProcess = Start-Process -FilePath (Get-Command node).Source -ArgumentList 'node_modules/next/dist/bin/next','start','--hostname','127.0.0.1' -WorkingDirectory (Join-Path $projectRoot 'frontend') -WindowStyle Hidden -RedirectStandardOutput (Join-Path $logsDir 'frontend.log') -RedirectStandardError (Join-Path $logsDir 'frontend-error.log') -PassThru
@{ backend = $javaProcess.Id; frontend = $nodeProcess.Id } | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $toolsDir 'demo-processes.json')
Write-Host 'FurgonApp iniciándose en http://127.0.0.1:3000'
Write-Host "Procesos: backend $($javaProcess.Id), frontend $($nodeProcess.Id). Logs: $logsDir"
Write-Host 'Para detenerlos: Stop-Process -Id <ID_BACKEND>,<ID_FRONTEND>'
