<#
.SYNOPSIS
  Runs the ACUMEN AI API publicly: uvicorn + an internet tunnel, supervised.

.DESCRIPTION
  Starts the FastAPI app on localhost, exposes it to the internet through a
  tunnel, then writes the live public URL into the Supabase `app_config` table
  so installed APKs pick it up without a rebuild. Restarts either process if it
  dies and re-publishes the URL whenever it changes.

  Providers:
    ngrok       Stable URL when NGROK_DOMAIN is set. Needs a free account.
    cloudflare  No account needed, but the URL is random on every start.

  Configuration is read from python-api/.env:
    SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY  (required to publish the URL)
    NGROK_DOMAIN                             (optional reserved domain)
    TUNNEL_PROVIDER                          (ngrok | cloudflare)

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File .\scripts\start-server.ps1
.EXAMPLE
  powershell -ExecutionPolicy Bypass -File .\scripts\start-server.ps1 -Provider cloudflare
#>
[CmdletBinding()]
param(
    [ValidateSet('ngrok', 'cloudflare')]
    [string]$Provider,
    [int]$Port = 8000,
    [string]$NgrokDomain,
    [switch]$NoPublish
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$Root = Split-Path -Parent $PSScriptRoot
$ApiDir = Join-Path $Root 'python-api'
$LogDir = Join-Path $Root '.logs'
$NgrokApi = 'http://127.0.0.1:4040/api/tunnels'
$TunnelLog = Join-Path $LogDir 'tunnel.log'
$TunnelErrLog = Join-Path $LogDir 'tunnel.err.log'

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Write-Log {
    param([string]$Message, [string]$Level = 'INFO')
    $color = switch ($Level) { 'WARN' { 'Yellow' } 'ERROR' { 'Red' } 'OK' { 'Green' } default { 'Gray' } }
    Write-Host ("[{0}] {1,-5} {2}" -f (Get-Date -Format 'HH:mm:ss'), $Level, $Message) -ForegroundColor $color
}

function Read-DotEnv {
    param([string]$Path)
    $map = @{}
    if (-not (Test-Path $Path)) { return $map }
    foreach ($line in Get-Content -LiteralPath $Path) {
        if ($line -match '^\s*#') { continue }
        if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$') {
            $map[$matches[1]] = $matches[2].Trim().Trim('"').Trim("'")
        }
    }
    return $map
}

function Resolve-Exe {
    param([string]$Name, [string[]]$Candidates)
    $cmd = Get-Command $Name -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    foreach ($c in $Candidates) { if (Test-Path $c) { return $c } }
    return $null
}

function Test-NgrokReady {
    foreach ($cfg in @(
            (Join-Path $env:LOCALAPPDATA 'ngrok\ngrok.yml'),
            (Join-Path $env:USERPROFILE '.ngrok2\ngrok.yml')
        )) {
        if ((Test-Path $cfg) -and (Select-String -Path $cfg -Pattern 'authtoken' -Quiet)) { return $true }
    }
    return $false
}

function Start-Api {
    param([string]$Python, [int]$Port)
    $apiArgs = @('-m', 'uvicorn', 'main:app', '--host', '127.0.0.1', '--port', "$Port")
    return Start-Process -FilePath $Python -ArgumentList $apiArgs -WorkingDirectory $ApiDir `
        -RedirectStandardOutput (Join-Path $LogDir 'api.log') `
        -RedirectStandardError (Join-Path $LogDir 'api.err.log') `
        -WindowStyle Hidden -PassThru
}

function Start-Tunnel {
    param([string]$Exe, [string]$Provider, [int]$Port, [string]$Domain)

    Remove-Item -LiteralPath $TunnelLog, $TunnelErrLog -ErrorAction SilentlyContinue

    if ($Provider -eq 'ngrok') {
        $tunnelArgs = @('http', "$Port", '--log', 'stdout')
        if ($Domain) { $tunnelArgs += @('--domain', $Domain) }
    } else {
        $tunnelArgs = @('tunnel', '--no-autoupdate', '--url', "http://127.0.0.1:$Port")
    }

    return Start-Process -FilePath $Exe -ArgumentList $tunnelArgs `
        -RedirectStandardOutput $TunnelLog -RedirectStandardError $TunnelErrLog `
        -WindowStyle Hidden -PassThru
}

function Get-TunnelUrl {
    param([string]$Provider, [int]$TimeoutSeconds = 40)
    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        if ($Provider -eq 'ngrok') {
            try {
                $data = Invoke-RestMethod -Uri $NgrokApi -TimeoutSec 5
                $https = $data.tunnels | Where-Object { $_.public_url -like 'https://*' } | Select-Object -First 1
                if ($https) { return $https.public_url.TrimEnd('/') }
            } catch {
                # agent not up yet
            }
        } else {
            # cloudflared prints the quick-tunnel hostname to its log
            foreach ($f in @($TunnelErrLog, $TunnelLog)) {
                if (Test-Path $f) {
                    $m = Select-String -Path $f -Pattern 'https://[a-z0-9-]+\.trycloudflare\.com' -AllMatches -ErrorAction SilentlyContinue
                    if ($m) { return $m.Matches[-1].Value.TrimEnd('/') }
                }
            }
        }
        Start-Sleep -Seconds 1
    }
    return $null
}

function Test-ApiHealth {
    param([int]$Port, [int]$TimeoutSeconds = 45)
    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        try {
            $r = Invoke-RestMethod -Uri "http://127.0.0.1:$Port/health" -TimeoutSec 5
            if ($r.ok) { return $true }
        } catch {
            # still booting
        }
        Start-Sleep -Seconds 1
    }
    return $false
}

function Publish-Url {
    param([string]$Url, [string]$SupabaseUrl, [string]$ServiceKey)
    if ($NoPublish) { Write-Log 'Publish skipped (-NoPublish).'; return }
    if (-not $SupabaseUrl -or -not $ServiceKey) {
        Write-Log 'SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing - cannot publish URL.' 'WARN'
        return
    }
    $endpoint = "$($SupabaseUrl.TrimEnd('/'))/rest/v1/app_config?on_conflict=key"
    $headers = @{
        apikey         = $ServiceKey
        Authorization  = "Bearer $ServiceKey"
        'Content-Type' = 'application/json'
        Prefer         = 'resolution=merge-duplicates,return=minimal'
    }
    $body = ConvertTo-Json -Compress -InputObject @(@{
            key        = 'ai_api_url'
            value      = $Url
            updated_at = (Get-Date).ToUniversalTime().ToString('o')
        })
    try {
        Invoke-RestMethod -Uri $endpoint -Method Post -Headers $headers -Body $body -TimeoutSec 15 | Out-Null
        Write-Log "Published to Supabase: $Url" 'OK'
    } catch {
        Write-Log "Failed to publish URL: $($_.Exception.Message)" 'ERROR'
    }
}

# --- setup ---------------------------------------------------------------

$env:PATH = "$env:PATH;$(Join-Path $env:LOCALAPPDATA 'Microsoft\WinGet\Links');C:\Program Files (x86)\cloudflared"

$dotenv = Read-DotEnv (Join-Path $ApiDir '.env')
$supabaseUrl = $dotenv['SUPABASE_URL']; if (-not $supabaseUrl) { $supabaseUrl = $dotenv['EXPO_PUBLIC_SUPABASE_URL'] }
$serviceKey = $dotenv['SUPABASE_SERVICE_ROLE_KEY']
if (-not $NgrokDomain) { $NgrokDomain = $dotenv['NGROK_DOMAIN'] }
if (-not $NgrokDomain) { $NgrokDomain = $env:NGROK_DOMAIN }
$tunnelProvider = $Provider
$providerWasChosen = [bool]$tunnelProvider
if (-not $tunnelProvider) {
    $tunnelProvider = $dotenv['TUNNEL_PROVIDER']
    $providerWasChosen = [bool]$tunnelProvider
}
if (-not $tunnelProvider) { $tunnelProvider = 'ngrok' }

# ngrok gives a stable URL but needs an authtoken. Until one is configured, fall
# back to cloudflare so the server still comes up unattended (e.g. at boot).
if ($tunnelProvider -eq 'ngrok' -and -not (Test-NgrokReady)) {
    if ($providerWasChosen) {
        throw "ngrok has no authtoken. Run: ngrok config add-authtoken <token>  (get one at https://dashboard.ngrok.com/get-started/your-authtoken)"
    }
    Write-Log 'ngrok authtoken not configured - falling back to cloudflare (random URL).' 'WARN'
    $tunnelProvider = 'cloudflare'
}

$python = Join-Path $ApiDir '.venv\Scripts\python.exe'
if (-not (Test-Path $python)) {
    throw "Python venv missing at $python. Inside python-api run: py -m venv .venv; .\.venv\Scripts\pip install -r requirements.txt"
}

if ($tunnelProvider -eq 'ngrok') {
    $tunnelExe = Resolve-Exe -Name 'ngrok' -Candidates @(
        (Join-Path $env:LOCALAPPDATA 'ngrok-latest\ngrok.exe'),
        (Join-Path $env:LOCALAPPDATA 'Microsoft\WinGet\Links\ngrok.exe'),
        (Join-Path $env:LOCALAPPDATA 'Microsoft\WinGet\Packages\Ngrok.Ngrok_Microsoft.Winget.Source_8wekyb3d8bbwe\ngrok.exe')
    )
    if (-not $tunnelExe) { throw 'ngrok not found. Install with: winget install --id Ngrok.Ngrok -e' }
} else {
    $tunnelExe = Resolve-Exe -Name 'cloudflared' -Candidates @(
        'C:\Program Files (x86)\cloudflared\cloudflared.exe',
        'C:\Program Files\cloudflared\cloudflared.exe'
    )
    if (-not $tunnelExe) { throw 'cloudflared not found. Install with: winget install --id Cloudflare.cloudflared -e' }
}

# The startup shortcut and a manual run must not fight over the port.
$singleInstance = New-Object System.Threading.Mutex($false, 'Local\AcumenAiApiSupervisor')
try {
    $gotLock = $singleInstance.WaitOne(0)
} catch [System.Threading.AbandonedMutexException] {
    # Previous run was killed without releasing; the lock is ours now.
    $gotLock = $true
}
if (-not $gotLock) {
    Write-Log 'Another supervisor is already running. Exiting.' 'WARN'
    return
}

if (Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue) {
    $singleInstance.ReleaseMutex()
    throw "Port $Port is already in use. Stop whatever is listening on it, or pass -Port <other>."
}

Write-Log "Provider  : $tunnelProvider"
Write-Log "Tunnel exe: $tunnelExe"
if ($tunnelProvider -eq 'ngrok') {
    Write-Log ('Domain    : ' + $(if ($NgrokDomain) { $NgrokDomain } else { '(random URL - published to Supabase each start)' }))
}

$apiProc = $null
$tunnelProc = $null
$currentUrl = $null

try {
    Write-Log "Starting API on 127.0.0.1:$Port ..."
    $apiProc = Start-Api -Python $python -Port $Port
    if (-not (Test-ApiHealth -Port $Port)) {
        throw "API did not become healthy. See $LogDir\api.err.log"
    }
    Write-Log 'API healthy.' 'OK'

    Write-Log 'Opening tunnel ...'
    $tunnelProc = Start-Tunnel -Exe $tunnelExe -Provider $tunnelProvider -Port $Port -Domain $NgrokDomain
    $currentUrl = Get-TunnelUrl -Provider $tunnelProvider
    if (-not $currentUrl) { throw "Tunnel did not report a public URL. See $TunnelLog and $TunnelErrLog" }

    Write-Log "PUBLIC URL: $currentUrl" 'OK'
    Publish-Url -Url $currentUrl -SupabaseUrl $supabaseUrl -ServiceKey $serviceKey
    Write-Log 'Server is live. Press Ctrl+C to stop.'

    # --- supervise -------------------------------------------------------
    while ($true) {
        Start-Sleep -Seconds 15

        if ($apiProc.HasExited) {
            Write-Log "API exited (code $($apiProc.ExitCode)). Restarting ..." 'WARN'
            $apiProc = Start-Api -Python $python -Port $Port
            Test-ApiHealth -Port $Port | Out-Null
        }

        if ($tunnelProc.HasExited) {
            Write-Log "Tunnel exited (code $($tunnelProc.ExitCode)). Restarting ..." 'WARN'
            $tunnelProc = Start-Tunnel -Exe $tunnelExe -Provider $tunnelProvider -Port $Port -Domain $NgrokDomain
            $currentUrl = $null
        }

        $url = Get-TunnelUrl -Provider $tunnelProvider -TimeoutSeconds 10
        if ($url -and $url -ne $currentUrl) {
            $currentUrl = $url
            Write-Log "PUBLIC URL changed: $currentUrl" 'WARN'
            Publish-Url -Url $currentUrl -SupabaseUrl $supabaseUrl -ServiceKey $serviceKey
        }
    }
} finally {
    Write-Log 'Shutting down ...' 'WARN'
    foreach ($p in @($tunnelProc, $apiProc)) {
        if ($p -and -not $p.HasExited) {
            try { Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue } catch { }
        }
    }
    $singleInstance.ReleaseMutex()
    $singleInstance.Dispose()
}
