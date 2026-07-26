<#
.SYNOPSIS
  Makes the ACUMEN AI API and its public tunnel start automatically at logon.

.DESCRIPTION
  By default this drops a hidden shortcut in the current user's Startup folder,
  which needs no administrator rights. Pass -UseScheduledTask (from an elevated
  PowerShell) to register a Task Scheduler entry instead, which additionally
  restarts the supervisor if it ever crashes.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File .\scripts\install-autostart.ps1
.EXAMPLE
  powershell -ExecutionPolicy Bypass -File .\scripts\install-autostart.ps1 -Uninstall
#>
[CmdletBinding()]
param(
    [string]$TaskName = 'ACUMEN AI API',
    [switch]$UseScheduledTask,
    [switch]$Uninstall,
    [switch]$PreventSleep
)

$ErrorActionPreference = 'Stop'

$Root = Split-Path -Parent $PSScriptRoot
$ServerScript = Join-Path $PSScriptRoot 'start-server.ps1'
$StartupDir = [Environment]::GetFolderPath('Startup')
$ShortcutPath = Join-Path $StartupDir "$TaskName.lnk"
$PsArgs = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$ServerScript`""

function Test-Elevated {
    $id = [Security.Principal.WindowsIdentity]::GetCurrent()
    return (New-Object Security.Principal.WindowsPrincipal $id).IsInRole(
        [Security.Principal.WindowsBuiltInRole]::Administrator)
}

if ($Uninstall) {
    $removed = $false
    if (Test-Path $ShortcutPath) {
        Remove-Item $ShortcutPath -Force
        Write-Host "Removed startup shortcut." -ForegroundColor Green
        $removed = $true
    }
    if (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue) {
        Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
        Write-Host "Removed scheduled task '$TaskName'." -ForegroundColor Green
        $removed = $true
    }
    if (-not $removed) { Write-Host "Nothing to remove." -ForegroundColor Yellow }
    return
}

if (-not (Test-Path $ServerScript)) { throw "Missing $ServerScript" }

if ($UseScheduledTask) {
    if (-not (Test-Elevated)) {
        throw "-UseScheduledTask needs an elevated PowerShell. Right-click PowerShell > Run as administrator, or drop the switch to use the Startup folder instead."
    }

    $action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument $PsArgs -WorkingDirectory $Root
    $trigger = New-ScheduledTaskTrigger -AtLogOn
    $settings = New-ScheduledTaskSettingsSet `
        -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable `
        -RestartCount 99 -RestartInterval (New-TimeSpan -Minutes 1) `
        -ExecutionTimeLimit ([TimeSpan]::Zero)
    $principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive -RunLevel Limited

    Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger `
        -Settings $settings -Principal $principal -Force | Out-Null

    Write-Host "Registered scheduled task '$TaskName' (runs at logon, restarts on failure)." -ForegroundColor Green
    Write-Host "Start it now with: Start-ScheduledTask -TaskName '$TaskName'" -ForegroundColor Cyan
} else {
    $shell = New-Object -ComObject WScript.Shell
    $lnk = $shell.CreateShortcut($ShortcutPath)
    $lnk.TargetPath = (Get-Command powershell.exe).Source
    $lnk.Arguments = $PsArgs
    $lnk.WorkingDirectory = $Root
    $lnk.WindowStyle = 7  # minimized
    $lnk.Description = 'Serves the ACUMEN AI API to the internet'
    $lnk.Save()

    Write-Host "Created startup shortcut: $ShortcutPath" -ForegroundColor Green
    Write-Host "It will run at every logon. No admin rights needed." -ForegroundColor Green
    Write-Host "For crash auto-restart too, re-run elevated with -UseScheduledTask." -ForegroundColor Cyan
}

if ($PreventSleep) {
    powercfg /change standby-timeout-ac 0
    powercfg /change hibernate-timeout-ac 0
    Write-Host "Sleep and hibernate disabled while plugged in." -ForegroundColor Green
} else {
    Write-Host "Tip: the PC must stay awake to serve traffic. Re-run with -PreventSleep to disable sleep on AC power." -ForegroundColor Yellow
}
