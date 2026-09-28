# Compatibility launcher: no demo accounts or automatic role access.
param([switch]$SkipBuild)
& (Join-Path $PSScriptRoot 'start.ps1') -SkipBuild:$SkipBuild
